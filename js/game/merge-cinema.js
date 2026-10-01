// Merge Cinema Module — cinematic slow-motion, attraction, focus and combo coefficients
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { getAllFlowersWithGenerated } from '../random-flowers.js';
import { visualEffects } from '../visual-effects.js';
import { lerp, clamp, ease, rgba } from '../utils.js';

const { GW, GH, SLOWMO_SCALE, SLOWMO_DURATION, ATTRACT_FORCE, ATTRACT_MAX_SPEED,
        ATTRACT_MIN_DIST, ATTRACT_RANGE, MERGE_SIZE_STEP, MAX_MERGE_SIZE_MULT,
        BONUS_WINDOW, BONUS_MAX_FILL } = CONFIG;

/** How long a merged flower keeps its cinematic hold (glow/focus priority) — real seconds */
const MERGE_PHYSICS_HOLD = 0.2;

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

/** Update time scale: hold slow-mo, then lerp smoothly back to normal time flow */
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
}

/** Cinematic attraction: during slow-mo same-level flowers pull each other together.
 *  IMPORTANT (FPS): flowers are NEVER made static/non-physical here — no physics
 *  locking, no extra bodies. They stay fully dynamic during the merge hold (0.2s)
 *  and after the drop; only cheap applyForce/setVelocity calls are used. */
export function applyMergeAttraction() {
    // Clear stale attracting flags when not in cinematic mode
    if (state.timeScale > 0.75 || state.gameState !== 'playing') {
        for (let i = 0; i < state.flowers.length; i++) {
            const f = state.flowers[i];
            if (f && f.attracting) f.attracting = false;
        }
        return;
    }
    const { Body } = state.Matter;
    const maxLevel = getAllFlowersWithGenerated().length - 1;

    for (let i = 0; i < state.flowers.length; i++) {
        const fa = state.flowers[i];
        if (!fa || !fa.body || fa.justSpawned) continue;
        if (fa === state.selectedFlower) continue;
        if (Body.getStatic && Body.getStatic(fa.body)) continue;
        if (fa.level >= maxLevel) continue;

        for (let j = i + 1; j < state.flowers.length; j++) {
            const fb = state.flowers[j];
            if (!fb || !fb.body || fb.justSpawned || fb.level !== fa.level) continue;
            if (fb === state.selectedFlower) continue;

            const dx = fb.body.position.x - fa.body.position.x;
            const dy = fb.body.position.y - fa.body.position.y;
            const dist = Math.hypot(dx, dy);
            if (dist > ATTRACT_RANGE || dist < ATTRACT_MIN_DIST || dist < 1) continue;

            const strength = ATTRACT_FORCE * fa.body.mass * (1 - dist / ATTRACT_RANGE);
            const nx = dx / dist, ny = dy / dist;
            Body.applyForce(fa.body, fa.body.position, { x: nx * strength, y: ny * strength });
            if (!(Body.getStatic && Body.getStatic(fb.body))) {
                Body.applyForce(fb.body, fb.body.position, { x: -nx * strength, y: -ny * strength });
            }

            // Mark both as attracted so focus keeps them mostly sharp
            fa.attracting = true;
            fb.attracting = true;

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
 *  NOTE: the "blur floor" is deliberately high (never fully transparent/black)
 *  so no dark circle ever appears behind a blurred cached flower sprite.
 *  Focus transfers FAST from the old flower to the newly merged one. */
export function getFocusValue(f) {
    const cinematic = state.timeScale < 0.95;
    let target = 1;
    if (cinematic) {
        // The freshly merged flower (or last attraction participant) is sharp...
        if (f === state.focusFlower || f.mergeGlow > 0) {
            target = 1;
        } else if (f.attracting) {
            target = 0.85; // attracted pair stays mostly sharp while gliding together
        } else {
            target = 0.45; // background flowers: soft blur only, never a black silhouette
        }
    }
    // Fast transfer: strong lerp factor => focus jumps to the merged flower within ~2-3 frames
    const rate = target > (f.focus ?? target) ? 0.5 : 0.28;
    f.focus = lerp(f.focus ?? target, target, rate);
    if (Math.abs(f.focus - target) < 0.01) f.focus = target;
    return f.focus;
}

/** Blur radius (px) derived from focus — clamped to a gentle bokeh range. */
export function getBlurPx(focus) {
    // focus 1 -> 0px, focus 0.45 -> ~2.5px max: subtle, GPU-cheap, no dark halos
    return Math.min(3, Math.max(0, Math.round((1 - focus) * 5)));
}

/** Size multiplier: merged flowers stay slightly bigger (lerped in) */
export function getSizeMult(f) {
    const target = Math.min(MAX_MERGE_SIZE_MULT, 1 + (f.mergeDepth || 0) * MERGE_SIZE_STEP);
    f.sizeMult = lerp(f.sizeMult ?? 1, target, 0.08);
    return f.sizeMult;
}

/** Dark cinematic vignette drawn over the scene during slow-motion.
 *  SOFT light-touch only: very low alpha, warm tint — never a black circle. */
export function drawCinematicVignette(ctx) {
    const intensity = clamp((0.9 - state.timeScale) / 0.62, 0, 1);
    if (intensity <= 0.01) return;
    ctx.save();
    const g = ctx.createRadialGradient(GW / 2, GH / 2, GH * 0.45, GW / 2, GH / 2, GH * 0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    // gentle warm-dark edge (max ~12% opacity) instead of a hard dark ring
    g.addColorStop(1, `rgba(10,5,15,${0.12 * intensity})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GW, GH);
    ctx.restore();
}
