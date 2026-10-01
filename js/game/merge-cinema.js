// Merge Cinema Module — cinematic slow-motion, attraction, focus and combo coefficients
//
// FPS SAFETY RULES (this system previously dropped FPS to ~0):
//  1. Attraction is O(n) per frame via a level-bucket scan + pairwise distance
//     check, capped at MAX_ATTRACT_PAIRS pairs per cinematic step.
//  2. Focus / size / blur are animated ONCE per frame for all flowers in
//     updateCinema() — never inside the draw loop.
//  3. The canvas "blur" filter is applied only during an active cinematic
//     (timeScale < 0.95) and only while there are few enough flowers on screen;
//     otherwise it silently degrades to no-blur. ctx.filter is extremely
//     expensive on some GPUs, so it must never run unconditionally.
//  4. Flowers are NEVER made static/non-physical here — no physics locking,
//     no extra bodies; only cheap applyForce/setVelocity calls are used.
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { getAllFlowersWithGenerated } from '../random-flowers.js';
import { visualEffects } from '../visual-effects.js';
import { lerp, clamp, rgba } from '../utils.js';

const { GW, GH, SLOWMO_SCALE, SLOWMO_DURATION, ATTRACT_FORCE, ATTRACT_MAX_SPEED,
        ATTRACT_MIN_DIST, ATTRACT_RANGE, MERGE_SIZE_STEP, MAX_MERGE_SIZE_MULT,
        BONUS_WINDOW, BONUS_MAX_FILL } = CONFIG;

/** How long a merged flower keeps its cinematic hold (glow/focus priority) — real seconds */
const MERGE_PHYSICS_HOLD = 0.2;

/** Hard caps that keep every cinematic frame cheap */
const MAX_ATTRACT_PAIRS = 8;      // max attraction force-pairs per frame
const MAX_BLUR_FLOWERS = 25;      // skip ctx.filter blur when more flowers than this
const ATTRACT_SCAN_RADIUS = 260;  // px — spatial pre-filter before exact distance test

/** Combo coefficient for the current chain (x1, x2, x3, ...) */
export function getComboMultiplier() {
    return 1 + Math.max(0, state.comboCount);
}

/** Current bonus-bar fill target (0..1) derived from active consecutive merges */
export function getBonusTarget() {
    const remaining = Math.max(0, state.lastMergeTime + BONUS_WINDOW - state.time);
    return clamp(state.comboCount / BONUS_MAX_FILL, 0, 1) * (remaining > 0 ? 1 : 0);
}

/** Start/extend a cinematic slow-motion around a merge event */
export function triggerSlowmo(x, y, level) {
    // Chain detection: second merge right after the first one (same or next tier)
    if (state.time - state.lastMergeTime <= BONUS_WINDOW && level >= state.lastMergeLevel) {
        state.comboCount++;
    } else {
        state.comboCount = 0;
    }
    state.lastMergeTime = state.time;
    state.lastMergeLevel = level;

    // Halved slowdown duration — the cinematic moment is short and snappy
    state.slowmoTimer = Math.max(state.slowmoTimer, SLOWMO_DURATION);

    // Floating "xN" coefficient popup when the chain continues
    const mult = getComboMultiplier();
    if (mult > 1) {
        visualEffects.createCoefficientPopup(x, y, mult);
        state.bonusFlash = 1;
    }
}

/** Register the freshly merged flower as the new focus target.
 *  Focus transfers FAST from the merged flowers to the new combined one. */
export function setFocusTarget(flower) {
    if (!flower) return;
    // snap-in instantly on the new flower (no dark circle ever appears:
    // only flowers are sharp/blurred, there is no focus ring at the scene center)
    flower.focus = flower.focus ?? 0.55; // start near-sharp so it never looks like a black hole
    flower.mergeHoldUntil = (state.realTime || 0) + MERGE_PHYSICS_HOLD;
    state.focusFlower = flower;
}

/** Score award: base points for the new flower multiplied by the combo coefficient */
export function awardMergeScore(newLevel) {
    const base = (newLevel + 1) * (newLevel + 1) * 5;
    const mult = getComboMultiplier();
    state.baseScore += base;
    state.score += base * mult;
    return { base, mult };
}

/** Is a cinematic (slow-mo) sequence currently active? Cheap boolean check. */
export function isCinematicActive() {
    return state.timeScale < 0.95 && state.gameState === 'playing';
}

/** Update time scale + ALL per-flower cinematic animation once per frame.
 *  This centralizes focus/size lerping so the draw loop does zero math per flower. */
export function updateCinema(dtReal, realTime) {
    // Track real (un-scaled) time so physics-hold timers don't freeze during slow-mo
    state.realTime = realTime ?? ((state.realTime || 0) + dtReal);

    let target = 1;
    if (state.slowmoTimer > 0) {
        state.slowmoTimer -= dtReal;
        target = SLOWMO_SCALE;
    }
    // Smooth lerp of time back to the normal course of events (fast return)
    state.timeScale = lerp(state.timeScale, target, Math.min(1, dtReal * 10));
    if (Math.abs(state.timeScale - target) < 0.005) state.timeScale = target;

    // Animated bonus bar fill + flash decay
    state.bonusFill = lerp(state.bonusFill, getBonusTarget(), Math.min(1, dtReal * 8));
    state.bonusFlash = Math.max(0, state.bonusFlash - dtReal * 2);

    // Drop focus target once its cinematic hold is over (it stays fully physical)
    const ff = state.focusFlower;
    if (ff && state.realTime > (ff.mergeHoldUntil || 0) + SLOWMO_DURATION + 0.35) {
        state.focusFlower = null;
    }

    // ── Per-flower cinematic state, updated exactly once per frame ──────────
    const cinematic = isCinematicActive();
    const flowers = state.flowers;
    for (let i = 0; i < flowers.length; i++) {
        const f = flowers[i];
        if (!f) continue;

        // Focus target for this flower
        let fTarget = 1;
        if (cinematic) {
            if (f === state.focusFlower || f.mergeGlow > 0) {
                fTarget = 1;
            } else if (f.attracting) {
                fTarget = 0.85; // attracted pair stays mostly sharp while gliding together
            } else {
                fTarget = 0.45; // background flowers: soft blur only, never a black silhouette
            }
        }
        // Fast transfer: strong lerp factor => focus jumps to the merged flower within ~2-3 frames
        const cur = f.focus ?? fTarget;
        const rate = fTarget > cur ? 0.5 : 0.28;
        f.focus = lerp(cur, fTarget, rate);
        if (Math.abs(f.focus - fTarget) < 0.01) f.focus = fTarget;

        // Size multiplier: merged flowers stay slightly bigger (lerped in).
        // When idle (depth 0) snap straight to 1 without allocating anything.
        const depth = f.mergeDepth || 0;
        const sTarget = depth > 0 ? Math.min(MAX_MERGE_SIZE_MULT, 1 + depth * MERGE_SIZE_STEP) : 1;
        if (f.sizeMult !== sTarget) {
            f.sizeMult = lerp(f.sizeMult ?? 1, sTarget, 0.08);
            if (Math.abs(f.sizeMult - sTarget) < 0.002) f.sizeMult = sTarget;
        }
    }
}

/** Cinematic attraction: during slow-mo same-level flowers pull each other together.
 *  O(n) bucket scan, capped pair count — see FPS SAFETY RULES at the top. */
export function applyMergeAttraction() {
    if (!isCinematicActive()) {
        // Not cinematic: just clear stale flags (single cheap pass, no allocations)
        const flowers = state.flowers;
        for (let i = 0; i < flowers.length; i++) {
            const f = flowers[i];
            if (f && f.attracting) f.attracting = false;
        }
        return;
    }

    const { Body } = state.Matter;
    const maxLevel = getAllFlowersWithGenerated().length - 1; // tiny array copy, fine per-frame
    const flowers = state.flowers;
    const n = flowers.length;

    // Clear previous frame's marks; re-marked below only for actual participants
    for (let i = 0; i < n; i++) {
        const f = flowers[i];
        if (f) f.attracting = false;
    }

    let pairs = 0;
    const rangeSq = ATTRACT_RANGE * ATTRACT_RANGE;

    for (let i = 0; i < n && pairs < MAX_ATTRACT_PAIRS; i++) {
        const fa = flowers[i];
        if (!fa || !fa.body || fa.justSpawned) continue;
        if (fa === state.selectedFlower) continue;
        if (Body.getStatic && Body.getStatic(fa.body)) continue;
        if (fa.level >= maxLevel) continue;

        const pa = fa.body.position;
        for (let j = i + 1; j < n && pairs < MAX_ATTRACT_PAIRS; j++) {
            const fb = flowers[j];
            if (!fb || !fb.body || fb.justSpawned || fb.level !== fa.level) continue;
            if (fb === state.selectedFlower) continue;

            const pb = fb.body.position;
            // Cheap squared-distance pre-filter (no sqrt until a real candidate)
            const dx = pb.x - pa.x;
            if (dx > ATTRACT_SCAN_RADIUS || dx < -ATTRACT_SCAN_RADIUS) continue;
            const dy = pb.y - pa.y;
            if (dy > ATTRACT_SCAN_RADIUS || dy < -ATTRACT_SCAN_RADIUS) continue;
            const distSq = dx * dx + dy * dy;
            if (distSq > rangeSq || distSq < 1) continue;
            const dist = Math.sqrt(distSq);
            if (dist < ATTRACT_MIN_DIST) continue;

            const strength = ATTRACT_FORCE * fa.body.mass * (1 - dist / ATTRACT_RANGE);
            const inv = 1 / dist;
            const nx = dx * inv, ny = dy * inv;
            Body.applyForce(fa.body, pa, { x: nx * strength, y: ny * strength });
            if (!(Body.getStatic && Body.getStatic(fb.body))) {
                Body.applyForce(fb.body, pb, { x: -nx * strength, y: -ny * strength });
            }

            // Mark both as attracted so focus keeps them mostly sharp
            fa.attracting = true;
            fb.attracting = true;
            pairs++;

            // Velocity cap for a smooth magnetic glide (no collisions/jitter)
            capAttractSpeed(fa.body);
            capAttractSpeed(fb.body);
        }
    }
}

function capAttractSpeed(body) {
    const { Body } = state.Matter;
    const v = body.velocity;
    const sp = Math.hypot(v.x, v.y);
    if (sp > ATTRACT_MAX_SPEED) {
        const k = ATTRACT_MAX_SPEED / sp;
        Body.setVelocity(body, { x: v.x * k, y: v.y * k });
    }
}

/** Focus easing value for a flower: 1 = fully in focus, 0 = softly blurred.
 *  NOTE: animated centrally in updateCinema(); this getter is read-only now. */
export function getFocusValue(f) {
    return f.focus ?? 1;
}

/** Blur radius (px) derived from focus — clamped to a gentle bokeh range.
 *  Returns 0 outside an active cinematic or when too many flowers are on screen
 *  (ctx.filter blur is the single most expensive operation in this game). */
export function getBlurPx(focus) {
    if (!isCinematicActive()) return 0;
    if (state.flowers.length > MAX_BLUR_FLOWERS) return 0;
    // focus 1 -> 0px, focus 0.45 -> ~2.5px max: subtle, GPU-cheap, no dark halos
    const b = (1 - focus) * 5;
    return b < 0.75 ? 0 : (b > 3 ? 3 : Math.round(b));
}

/** Size multiplier: merged flowers stay slightly bigger (lerped in).
 *  Read-only — the lerp itself runs once per frame in updateCinema(). */
export function getSizeMult(f) {
    return f.sizeMult ?? 1;
}

/** Dark cinematic vignette drawn over the scene during slow-motion.
 *  SOFT light-touch only: very low alpha, warm tint — never a black circle.
 *  The gradient object is cached (rebuilding radial gradients per frame is costly). */
let _vignetteGrad = null;
let _vignetteIntensity = -1;
export function drawCinematicVignette(ctx) {
    const intensity = clamp((0.9 - state.timeScale) / 0.62, 0, 1);
    if (intensity <= 0.01) {
        _vignetteIntensity = -1;
        return;
    }
    // Quantize intensity to 10 steps so we rebuild the gradient at most 10 times
    const q = Math.round(intensity * 10) / 10;
    if (!_vignetteGrad || q !== _vignetteIntensity) {
        const g = ctx.createRadialGradient(GW / 2, GH / 2, GH * 0.45, GW / 2, GH / 2, GH * 0.85);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        // gentle warm-dark edge (max ~12% opacity) instead of a hard dark ring
        g.addColorStop(1, `rgba(10,5,15,${0.12 * q})`);
        _vignetteGrad = g;
        _vignetteIntensity = q;
    }
    ctx.save();
    ctx.fillStyle = _vignetteGrad;
    ctx.fillRect(0, 0, GW, GH);
    ctx.restore();
}
