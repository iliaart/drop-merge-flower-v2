// Merge Cinema Module — cinematic slow-motion, attraction, focus and combo coefficients
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { getAllFlowersWithGenerated } from '../random-flowers.js';
import { visualEffects } from '../visual-effects.js';
import { lerp, clamp, ease, rgba } from '../utils.js';

const { GW, GH, SLOWMO_SCALE, SLOWMO_DURATION, ATTRACT_FORCE, ATTRACT_MAX_SPEED,
        ATTRACT_MIN_DIST, ATTRACT_RANGE, MERGE_SIZE_STEP, MAX_MERGE_SIZE_MULT,
        BONUS_WINDOW, BONUS_MAX_FILL } = CONFIG;

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

    state.slowmoTimer = Math.max(state.slowmoTimer, SLOWMO_DURATION);

    // Floating "xN" coefficient popup when the chain continues
    const mult = getComboMultiplier();
    if (mult > 1) {
        visualEffects.createCoefficientPopup(x, y, mult);
        state.bonusFlash = 1;
    }
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
export function updateCinema(dtReal) {
    let target = 1;
    if (state.slowmoTimer > 0) {
        state.slowmoTimer -= dtReal;
        target = SLOWMO_SCALE;
    }
    // Smooth lerp of time back to the normal course of events
    state.timeScale = lerp(state.timeScale, target, Math.min(1, dtReal * 6));
    if (Math.abs(state.timeScale - target) < 0.005) state.timeScale = target;

    // Animated bonus bar fill + flash decay
    state.bonusFill = lerp(state.bonusFill, getBonusTarget(), Math.min(1, dtReal * 8));
    state.bonusFlash = Math.max(0, state.bonusFlash - dtReal * 2);
}

/** Cinematic attraction: during slow-mo same-level flowers pull each other together */
export function applyMergeAttraction() {
    if (state.timeScale > 0.75 || state.gameState !== 'playing') return;
    const { Body } = state.Matter;
    const allFlowers = getAllFlowersWithGenerated();

    for (let i = 0; i < state.flowers.length; i++) {
        const fa = state.flowers[i];
        if (!fa || !fa.body || fa.justSpawned) continue;
        if (fa === state.selectedFlower) continue;
        if (Body.getStatic && Body.getStatic(fa.body)) continue;
        if (fa.level >= allFlowers.length - 1) continue;

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

/** Focus easing value for a flower: 1 = fully in focus, 0 = fully blurred */
export function getFocusValue(f) {
    const cinematic = state.timeScale < 0.95;
    const target = cinematic ? (f.mergeGlow > 0 ? 1 : 0) : 1;
    f.focus = lerp(f.focus ?? target, target, 0.12);
    if (Math.abs(f.focus - target) < 0.01) f.focus = target;
    return f.focus;
}

/** Size multiplier: merged flowers stay slightly bigger (lerped in) */
export function getSizeMult(f) {
    const target = Math.min(MAX_MERGE_SIZE_MULT, 1 + (f.mergeDepth || 0) * MERGE_SIZE_STEP);
    f.sizeMult = lerp(f.sizeMult ?? 1, target, 0.08);
    return f.sizeMult;
}

/** Dark cinematic vignette drawn over the scene during slow-motion */
export function drawCinematicVignette(ctx) {
    const intensity = clamp((0.9 - state.timeScale) / 0.62, 0, 1);
    if (intensity <= 0.01) return;
    ctx.save();
    const g = ctx.createRadialGradient(GW / 2, GH / 2, GH * 0.32, GW / 2, GH / 2, GH * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(5,0,10,${0.45 * intensity})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GW, GH);
    ctx.restore();
}
