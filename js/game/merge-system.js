// Merge System Module - flower merging logic and auto-merge functionality
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { getAllFlowersWithGenerated } from '../random-flowers.js';
import { visualEffects } from '../visual-effects.js';
import { removeFlower, createFlower } from './flower-mechanics.js';

const { MERGE_RADIUS_BONUS } = CONFIG;

/**
 * Auto-merge the lowest-level flower type when distinct types exceed allowed count.
 * Picks the two lowest-level flowers at the smallest level and forces a merge,
 * effectively "evolving" them into the next tier and reducing type variety.
 */
export async function autoMergeExcessTypes() {
    if (state.gameState !== 'playing') return;
    
    // Import required functions dynamically to avoid circular dependency
    const coreModule = await import('./core.js');
    const allFlowers = getAllFlowersWithGenerated();
    const distinctLevels = coreModule.getDistinctLevelsInVase();
    const allowedCount = coreModule.getAllowedTypeCount();

    if (distinctLevels.length <= allowedCount) return;

    // Target the lowest level for forced merge
    const lowestLevel = distinctLevels[0];
    if (lowestLevel >= allFlowers.length - 1) return;

    // Collect all flowers at the lowest level, sorted by Y (lowest first)
    const lowestFlowers = state.flowers
        .map((f, idx) => ({ f, idx }))
        .filter(({ f }) => f && f.level === lowestLevel && !f.justSpawned && !f.spawning)
        .sort((a, b) => b.f.body.position.y - a.f.body.position.y);

    if (lowestFlowers.length < 2) return;

    // Merge the two lowest flowers at this level
    const { f: fa, idx: idxA } = lowestFlowers[0];
    const { f: fb, idx: idxB } = lowestFlowers[1];
    if (state.mergingSet.has(fa.body.id) || state.mergingSet.has(fb.body.id)) return;

    if (typeof window.performMerge === 'function') {
        window.performMerge(fa, fb, idxA, idxB);
    }
}

/**
 * Safety-net merge for same-level flowers that are physically overlapping
 * (centers closer than sum of radii). Catches cases where collisionStart
 * already fired and won't fire again (continuous contact after spawn).
 */
export function forceOverlapMerges() {
    if (state.gameState !== 'playing') return;
    const allFlowers = getAllFlowersWithGenerated();
    for (let i = 0; i < state.flowers.length; i++) {
        const fa = state.flowers[i];
        if (!fa) continue;
        // Get the actual collision radius for flower a (accounting for orchid reduction)
        const flowerAData = allFlowers[fa.level];
        const radiusA = flowerAData.flowerType === 'orchid' ? flowerAData.radius * 0.5 : flowerAData.radius;
        for (let j = i + 1; j < state.flowers.length; j++) {
            const fb = state.flowers[j];
            if (!fb) continue;
            if (fa.level !== fb.level || fa.level >= allFlowers.length - 1) continue;
            if (state.mergingSet.has(fa.body.id) || state.mergingSet.has(fb.body.id)) continue;

            const dx = fa.body.position.x - fb.body.position.x;
            const dy = fa.body.position.y - fb.body.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Get the actual collision radius for flower b (accounting for orchid reduction)
            const flowerBData = allFlowers[fb.level];
            const radiusB = flowerBData.flowerType === 'orchid' ? flowerBData.radius * 0.5 : flowerBData.radius;
            // Only merge when truly overlapping (centers < sum of radii)
            if (dist < radiusA + radiusB) {
                if (typeof window.performMerge === 'function') {
                    window.performMerge(fa, fb, i, j);
                }
                return;
            }
        }
    }
}

export function performMerge(fa, fb, idxA, idxB) {
    if (!fa || !fb) return;

    state.mergingSet.add(fa.body.id);
    state.mergingSet.add(fb.body.id);
    const mx = (fa.body.position.x + fb.body.position.x) / 2;
    const my = (fa.body.position.y + fb.body.position.y) / 2;
    const newLevel = fa.level + 1;

    // Check if either of the flowers being merged is currently selected
    const wasSelected = state.selectedFlower && (state.selectedFlower === fa || state.selectedFlower === fb);

    // Remove the existing flowers
    removeFlower(idxA);
    removeFlower(idxB);

    // Create the new flower
    const nf = createFlower(mx, my, newLevel);
    if (nf) {
        nf.spawning = true;
        nf.mergeGlow = 1;

        // If one of the merged flowers was selected, select the new flower
        if (wasSelected) {
            state.selectedFlower = nf;
            // Set isDragging to true so the player can continue moving the flower
            state.isDragging = true;
            
            // Ensure the new flower has the correct physical properties for dragging
            // Store original gravity scale and make kinematic during drag
            nf.originalGravityScale = 0;  // Initially 0 since we're dragging
            nf.body.gravityScale = 0;     // Disable gravity while dragging
            state.Matter.Body.setStatic(nf.body, true);  // Make kinematic during drag
        }

        visualEffects.createMergeEffect(mx, my, newLevel);
        state.shake.trigger(6 + newLevel * 2);
        state.audio.playMerge(newLevel);
        if (newLevel > state.highestLevel) state.highestLevel = newLevel;
    }
}

// Make function available globally as per project specification
window.performMerge = performMerge;