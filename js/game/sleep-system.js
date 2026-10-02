// Sleep System Module — FPS optimization: static flowers in the vase
//
// Idea: a flower that just lies in the vase (low velocity, at rest, supported
// by neighbours) is turned into a Matter.js STATIC body and its animated
// drawing (breath / sway / stamen animation) is frozen. Static bodies are
// skipped entirely by the broadphase, collision detection and integration,
// which directly raises FPS when the vase is full.
//
// A flower becomes dynamic again ("wakes up") when:
//   • a merge happens nearby (wakeNearMerge — instant, before slow-mo);
//   • a same-level partner drifts into merge range (checkMerges wake pass);
//   • physics contact/repulsion touches it (physics.js wakes both bodies);
//   • the player grabs or selects it (input.js);
//   • cinematic attraction targets it (merge-cinema.js).
//
// Safety rules:
//   • The dragged / selected flower is NEVER slept (update-loop re-asserts
//     setStatic(false) for non-dragged flowers — that would fight this system).
//   • Merging pairs are never slept (mergingSet guard), so merges can't be lost.
//   • Flowers still falling from above the vase mouth are never slept.
import { state } from '../state.js';
import { CONFIG } from '../config.js';

const SLEEP_SPEED = 0.25;        // linear speed below this counts as "at rest" (px/step)
const SLEEP_ANG_SPEED = 0.004;   // angular speed threshold (rad/step)
const SLEEP_SETTLE_TIME = 1.2;   // seconds of continuous calm before sleeping
const NEIGHBOR_SUPPORT_DIST = 60; // px — approximate diameter of the smallest flower
const DEFAULT_WAKE_RADIUS = 180;  // px — default "something happens near me" radius

/** Should this flower be treated as awake/dynamic right now? */
export function isFlowerAwake(f) {
    return !f || !f.sleeping;
}

/** Wake a single flower (make it dynamic + resume animated drawing). */
export function wakeFlower(f) {
    if (!f || !f.body || !f.sleeping) return;
    f.sleeping = false;
    f.settleTime = 0;
    state.Matter.Body.setStatic(f.body, false);
}

/** Wake every sleeping flower (used on restart / level transition). */
export function wakeAllFlowers() {
    for (const f of state.flowers) wakeFlower(f);
}

/**
 * Wake all flowers within `radius` of (x, y).
 * Called from performMerge BEFORE the merge removes/spawns bodies so that
 * nearby flowers become mobile again and the cascade can physically settle.
 */
export function wakeNearMerge(x, y, radius = DEFAULT_WAKE_RADIUS) {
    const r2 = radius * radius;
    for (const f of state.flowers) {
        if (!f || !f.body || !f.sleeping) continue;
        const dx = f.body.position.x - x;
        const dy = f.body.position.y - y;
        if (dx * dx + dy * dy <= r2) wakeFlower(f);
    }
}

/**
 * Per-frame sleep scheduler (replaces applyForces for cheap steady-state).
 * Awake flowers get their normal per-frame physics tuning; calm, supported
 * flowers are converted to static bodies after SLEEP_SETTLE_TIME.
 */
export function updateSleep(dt) {
    if (state.gameState !== 'playing') return;
    const { Body } = state.Matter;
    const VASE = CONFIG.VASE;

    for (const f of state.flowers) {
        if (!f || !f.body) continue;

        // Never sleep the flower under the player's finger/cursor.
        if (f === state.selectedFlower) { f.settleTime = 0; continue; }

        // Never sleep flowers involved in an in-flight merge.
        if (state.mergingSet.has(f.body.id)) { f.settleTime = 0; continue; }

        if (f.sleeping) continue; // static: zero per-frame work until woken

        const v = f.body.velocity;
        const speed = Math.sqrt(v.x * v.x + v.y * v.y);
        const angSpeed = Math.abs(f.body.angularVelocity);
        const calm = speed < SLEEP_SPEED && angSpeed < SLEEP_ANG_SPEED;

        if (!calm) {
            f.settleTime = 0;
            continue;
        }

        // Only sleep flowers resting INSIDE the vase on top of other flowers
        // (or the floor) — never flowers still falling through the air.
        const pos = f.body.position;
        if (pos.y < VASE.t) { f.settleTime = 0; continue; }

        f.settleTime = (f.settleTime || 0) + dt;
        if (f.settleTime < SLEEP_SETTLE_TIME) continue;

        // Require support: something solid below within ~one small diameter,
        // otherwise a flower hovering mid-stack would freeze in mid-air.
        let supported = pos.y + NEIGHBOR_SUPPORT_DIST >= VASE.b;
        if (!supported) {
            for (const o of state.flowers) {
                if (!o || o === f || !o.body) continue;
                const dx = o.body.position.x - pos.x;
                const dy = o.body.position.y - pos.y;
                if (dy > 0 && dy < NEIGHBOR_SUPPORT_DIST && dx * dx + dy * dy < NEIGHBOR_SUPPORT_DIST * NEIGHBOR_SUPPORT_DIST) {
                    supported = true;
                    break;
                }
            }
        }
        if (!supported) { f.settleTime = 0; continue; }

        // Put it to sleep: zero velocities, then static (excluded from
        // broadphase, collision pairs, integration and animated drawing).
        Body.setAngularVelocity(f.body, 0);
        Body.setVelocity(f.body, { x: 0, y: 0 });
        Body.setStatic(f.body, true);
        f.sleeping = true;
        f.settleTime = 0;
    }
}
