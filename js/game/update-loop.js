// Update Loop Module - game state updates and physics
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { getAllFlowersWithGenerated } from '../random-flowers.js';
import { applyForces, updateAngularVelocity } from '../physics.js';
import { updateSleep, wakeFlower } from './sleep-system.js';

const { SQUASH_FREQ, SQUASH_DAMP } = CONFIG;

export async function updateFlowers() {
    if (state.gameState !== 'playing') return;

    const allFlowers = getAllFlowersWithGenerated();
    const avgRadius = allFlowers.slice(0, Math.min(8, allFlowers.length)).reduce((sum, fl, idx) => {
        const rad = fl.flowerType === 'orchid' ? fl.radius * 0.5 : fl.radius;
        return sum + rad;
    }, 0) / Math.min(8, allFlowers.length) || 40;

    // Update flower animations
    for (let i = 0; i < state.flowers.length; i++) {
        const f = state.flowers[i];
        if (!f) continue;

        // Update animation time for this flower
        f.animTime = (f.animTime || 0) + 1;
        
        // Update physics if not being dragged
        if (state.selectedFlower !== f) {
            // Ensure gravity is enabled for non-dragged flowers
            if (f.body && typeof f.body.gravityScale !== 'undefined') {
                const flowerData = allFlowers[f.level];
                if (flowerData) {
                    const flowerRadius = flowerData.flowerType === 'orchid' ? flowerData.radius * 0.5 : flowerData.radius;
                    
                    const densityModifier = 1 + (flowerRadius - avgRadius) * CONFIG.GRAVITY_DENSITY_FACTOR / avgRadius;
                    f.body.gravityScale = densityModifier;
                    
                    // Ensure the body is not static when not dragging
                    // Check if Matter and Body.getStatic exist before calling
                    const hasMatterBody = state.Matter && state.Matter.Body && typeof state.Matter.Body.getStatic === 'function';
                    if (hasMatterBody && state.Matter.Body.getStatic(f.body)) {
                        state.Matter.Body.setStatic(f.body, false);
                    }
                }
            }
        } else {
            // For dragged flower, temporarily disable gravity and make static
            if (f.body && state.isDragging) {
                f.body.gravityScale = 0;
                // Check if Matter and Body exist before calling
                const hasMatterBody = state.Matter && state.Matter.Body && typeof state.Matter.Body.setStatic === 'function';
                if (hasMatterBody) {
                    state.Matter.Body.setStatic(f.body, true);
                }
            }
        }

        // Handle merge cooldown
        if (f.mergeCooldown > 0) {
            f.mergeCooldown--;
        }

        // Handle spawning effect
        if (f.spawning) {
            f.spawnProgress = (f.spawnProgress || 0) + 0.1;
            if (f.spawnProgress >= 1) {
                f.spawning = false;
                f.spawnProgress = 1;
            }
        }

        // Handle merge glow effect
        if (f.mergeGlow > 0) {
            f.mergeGlow -= 0.05;
            if (f.mergeGlow <= 0) {
                f.mergeGlow = 0;
            }
        }
    }
}

export function updateSquash(f, dt) {
    const vy = f.body.velocity.y;
    const targetSquash = Math.min(Math.max(vy * .03, -.2), .2);
    f.squashAmp = targetSquash - f.squashS;
    const springForce = -SQUASH_FREQ * SQUASH_FREQ * f.squashS;
    const dampForce = -2 * SQUASH_DAMP * SQUASH_FREQ * f.squashV;
    f.squashV += (springForce + dampForce) * dt;
    f.squashS += f.squashV * dt;

    if (Math.abs(f.squashS) < .01 && Math.abs(f.squashV) < .01) {
        f.squashS = 0;
        f.squashV = 0;
        f.squashAmp = 0;
    }
    f.lastVy = vy;
}