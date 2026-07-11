// Game Utilities Module - various helper functions
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { getAllFlowersWithGenerated } from '../random-flowers.js';

const { VASE } = CONFIG;

/**
 * Determine if we should skip this frame for performance optimization
 */
export function shouldSkipFrame() {
    // With unlimited FPS, we don't skip frames based on performance
    return false;
}

/**
 * Get all flower types currently in play
 */
export function getActiveFlowerTypes() {
    const activeTypes = new Set();
    for (const flower of state.flowers) {
        if (flower) {
            activeTypes.add(flower.level);
        }
    }
    return [...activeTypes].sort((a, b) => a - b);
}

/**
 * Count flowers by level
 */
export function countFlowersByLevel() {
    const counts = {};
    for (const flower of state.flowers) {
        if (flower) {
            counts[flower.level] = (counts[flower.level] || 0) + 1;
        }
    }
    return counts;
}

/**
 * Get statistics about the current game state
 */
export function getGameStateStats() {
    const allFlowers = getAllFlowersWithGenerated();
    const stats = {
        totalFlowers: state.flowers.length,
        activeFlowers: state.flowers.filter(f => f !== null).length,
        flowerCounts: countFlowersByLevel(),
        activeTypes: getActiveFlowerTypes(),
        highestLevel: state.highestLevel,
        currentLevel: state.currentLevel,
        nextLevel: state.nextLevel,
        vaseFillRatio: 0,
        outOfBoundsCount: state.outOfBoundsCount || 0
    };
    
    // Calculate vase fill ratio
    import('./core.js').then(coreModule => {
        stats.vaseFillRatio = coreModule.getVaseFillRatio();
    });
    
    return stats;
}

/**
 * Check if a position is within the vase boundaries
 */
export function isPositionInVase(x, y) {
    return x >= VASE.l && x <= VASE.r && y >= VASE.t && y <= VASE.b;
}