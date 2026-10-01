/**
 * Object Pool for Flower Management
 * Improves performance by reusing existing flower objects instead of creating new ones
 */
export class FlowerPool {
    constructor(initialSize = 10) {
        this.pool = [];
        this.initialSize = initialSize;
        this.initializePool();
    }

    /**
     * Initialize the pool with a set of flower objects
     */
    initializePool() {
        for (let i = 0; i < this.initialSize; i++) {
            this.pool.push(this.createObject());
        }
    }

    /**
     * Create a new flower object with default values
     */
    createObject() {
        return {
            body: null,
            level: 0,
            justSpawned: true,
            spawning: false,
            spawnScale: 1,
            spawnTimer: 0,
            mergeGlow: 0,
            landingVy: 0,
            squashS: 0,
            squashV: 0,
            squashAmp: 0,
            lastVy: 0,
            idlePhase: 0,
            stamenPhase: 0,
            breathPhase: 0,
            repulsionDamping: 0,
            stopTimer: 0,
            isForcedStopped: false,
            resonanceTimer: 0,
            isInContact: false,
            vibrationEnergy: 0,
            tailPositions: [],
            lastTailUpdate: 0,
            timeoutId: null,
            // Additional properties that might be added during gameplay
            extraProps: {}
        };
    }

    /**
     * Get a flower object from the pool (or create a new one if pool is empty)
     */
    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        } else {
            // Expand pool if empty
            return this.createObject();
        }
    }

    /**
     * Return a flower object to the pool for reuse
     * @param {Object} flower - The flower object to return to the pool
     */
    release(flower) {
        if (!flower) return;

        // Reset all properties to default values
        this.resetObject(flower);

        // Add back to pool if we haven't exceeded max size
        if (this.pool.length < this.initialSize * 2) { // Limit pool growth
            this.pool.push(flower);
        }
        // Otherwise, let the object be garbage collected
    }

    /**
     * Reset a flower object to its default state
     * @param {Object} flower - The flower object to reset
     */
    resetObject(flower) {
        if (!flower) return;

        // Reset Matter.js body (it will be recreated)
        flower.body = null;
        
        // Reset basic properties
        flower.level = 0;
        flower.justSpawned = true;
        flower.spawning = false;
        flower.spawnScale = 1;
        flower.spawnTimer = 0;
        flower.mergeGlow = 0;
        // Cinematic merge fields — reset on pool reuse
        flower.focus = 1;
        flower.sizeMult = 1;
        flower.mergeDepth = 0;
        flower.attracting = false;
        flower.mergeHoldUntil = 0;
        flower.landingVy = 0;
        flower.squashS = 0;
        flower.squashV = 0;
        flower.squashAmp = 0;
        flower.lastVy = 0;
        flower.idlePhase = Math.random() * Math.PI * 2; // Randomize phases to avoid visual artifacts
        flower.stamenPhase = Math.random() * Math.PI * 2;
        flower.breathPhase = Math.random() * Math.PI * 2;
        flower.repulsionDamping = 0;
        flower.stopTimer = 0;
        flower.isForcedStopped = false;
        flower.resonanceTimer = 0;
        flower.isInContact = false;
        flower.vibrationEnergy = 0;
        
        // Clear and reset tail positions
        if (Array.isArray(flower.tailPositions)) {
            flower.tailPositions.length = 0; // Clear array without creating a new one
        } else {
            flower.tailPositions = [];
        }
        
        flower.lastTailUpdate = 0;
        
        // Clear any existing timeout
        if (flower.timeoutId) {
            clearTimeout(flower.timeoutId);
            flower.timeoutId = null;
        }
        
        // Reset extra properties
        if (typeof flower.extraProps === 'object') {
            for (let key in flower.extraProps) {
                delete flower.extraProps[key];
            }
        } else {
            flower.extraProps = {};
        }
    }

    /**
     * Get the current size of the pool
     */
    getPoolSize() {
        return this.pool.length;
    }

    /**
     * Clear the entire pool (useful for game restarts)
     */
    clear() {
        // Clear any pending timeouts
        for (const flower of this.pool) {
            if (flower.timeoutId) {
                clearTimeout(flower.timeoutId);
            }
        }
        
        this.pool.length = 0;
        this.initializePool();
    }
}

// Singleton instance of the flower pool
const flowerPool = new FlowerPool();

// Export both as named and default export
export { flowerPool };
export default flowerPool;