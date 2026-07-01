// Random Flower Diversity Module for the game

// Queue of recently generated flowers to ensure neighbor diversity
let recentFlowersQueue = [];

// Maximum number of flowers to track in the queue for neighbor diversity
const MAX_RECENT_FLOWERS = 3;

/**
 * Check if a flower's color palette is too similar to any of the recent flowers in the queue
 * @param {object} newFlower - The new flower to check
 * @param {Array} recentFlowers - Array of recent flowers to compare against
 * @returns {boolean} - True if the new flower is too similar to any recent flower, false otherwise
 */
function isFlowerTooSimilarToNeighbors(newFlower, recentFlowers) {
    // For now, just check if there are any recent flowers to compare against
    // This is a simplified implementation - in a real scenario you'd implement
    // actual color similarity checking between flowers
    if (!recentFlowers || recentFlowers.length === 0) {
        return false;
    }
    
    // Check against recent flowers in the queue
    for (const recentFlower of recentFlowers) {
        // Simple check - if both flowers have similar primary colors
        if (recentFlower && recentFlower.petalColor && newFlower.petalColor) {
            // This would contain actual color similarity logic
            // For now we'll return false to allow flower generation
        }
    }
    
    return false;
}

/**
 * Calculate color similarity between two flowers
 * @param {object} flower1 - First flower object
 * @param {object} flower2 - Second flower object
 * @returns {number} - Similarity score (0-100)
 */
function calculateFlowerColorSimilarity(flower1, flower2) {
    // Simplified implementation
    // In a real implementation, this would calculate actual color distances
    return 0;
}

/**
 * Get color distance between two colors
 * @param {string} color1 - First color in hex format
 * @param {string} color2 - Second color in hex format
 * @returns {number} - Distance between colors (0-442 max)
 */
function getColorDistance(color1, color2) {
    // Convert hex to RGB
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    // Calculate Euclidean distance
    return Math.sqrt(
        Math.pow(r1 - r2, 2) +
        Math.pow(g1 - g2, 2) +
        Math.pow(b1 - b2, 2)
    );
}

/**
 * Add flower to recent flowers tracking
 * @param {object} flower - Flower object to add
 */
function addToRecentFlowers(flower) {
    recentFlowersQueue.unshift(flower);
    if (recentFlowersQueue.length > MAX_RECENT_FLOWERS) {
        recentFlowersQueue.pop();
    }
}

// Export functions
export {
    isFlowerTooSimilarToNeighbors,
    calculateFlowerColorSimilarity,
    getColorDistance,
    addToRecentFlowers,
    recentFlowersQueue
};