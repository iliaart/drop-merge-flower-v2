// Spatial Grid Module - efficient collision detection system
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { getAllFlowersWithGenerated } from '../random-flowers.js';

const { MERGE_RADIUS_BONUS } = CONFIG;

/**
 * Spatial hash grid for efficient collision detection
 */
export class SpatialGrid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = new Array(this.cols * this.rows).fill(null).map(() => []);
    }
    
    getCellIndex(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return -1; // Out of bounds
        }
        
        return row * this.cols + col;
    }
    
    add(item, x, y) {
        const index = this.getCellIndex(x, y);
        if (index !== -1) {
            this.grid[index].push(item);
        }
    }
    
    getNearbyItems(x, y) {
        const items = [];
        const leftCol = Math.floor((x - this.cellSize) / this.cellSize);
        const rightCol = Math.floor((x + this.cellSize) / this.cellSize);
        const topRow = Math.floor((y - this.cellSize) / this.cellSize);
        const bottomRow = Math.floor((y + this.cellSize) / this.cellSize);
        
        for (let col = leftCol; col <= rightCol; col++) {
            for (let row = topRow; row <= bottomRow; row++) {
                if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
                    const index = row * this.cols + col;
                    items.push(...this.grid[index]);
                }
            }
        }
        
        return items;
    }
    
    clear() {
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i] = [];
        }
    }
}

/**
 * Check for flower merges using spatial grid for efficiency
 */
export function checkMerges() {
    if (state.gameState !== 'playing') return;
    
    // Skip merge checks on low-performance devices or if there are too many flowers
    const perfConfig = window.PERFORMANCE_CONFIG || { maxFlowersForMerges: 50 };
    if (state.flowers.length > (perfConfig.maxFlowersForMerges || 50)) {
        // Reduce frequency of checks when there are many flowers
        if (Math.floor(state.time * 5) % 3 !== 0) return; // Check every 3 out of 5 frames
    }
    
    const allFlowers = getAllFlowersWithGenerated();
    
    // Use spatial partitioning to reduce collision checks
    const grid = new SpatialGrid(CONFIG.GW, CONFIG.GH, 100); // 100px grid cells
    
    // Populate grid with flowers
    for (let i = 0; i < state.flowers.length; i++) {
        const fa = state.flowers[i];
        if (!fa) continue;
        
        // Get the actual collision radius for flower a (accounting for orchid reduction)
        const flowerAData = allFlowers[fa.level];
        const radiusA = flowerAData.flowerType === 'orchid' ? flowerAData.radius * 0.5 : flowerAData.radius;
        
        grid.add({flower: fa, index: i, radius: radiusA}, fa.body.position.x, fa.body.position.y);
    }
    
    // Check for collisions using spatial grid
    for (let i = 0; i < state.flowers.length; i++) {
        const fa = state.flowers[i];
        if (!fa) continue;
        
        // Get the actual collision radius for flower a (accounting for orchid reduction)
        const flowerAData = allFlowers[fa.level];
        const radiusA = flowerAData.flowerType === 'orchid' ? flowerAData.radius * 0.5 : flowerAData.radius;
        
        if (fa.level >= allFlowers.length - 1) continue;
        if (state.mergingSet.has(fa.body.id)) continue;
        
        // Get nearby flowers from spatial grid instead of checking all flowers
        const nearbyFlowers = grid.getNearbyItems(fa.body.position.x, fa.body.position.y);
        
        for (const nearby of nearbyFlowers) {
            const fb = nearby.flower;
            const j = nearby.index;
            
            if (!fb || i >= j) continue; // Avoid duplicate checks and self-checks
            if (!fb || fa.level !== fb.level) continue;
            if (state.mergingSet.has(fb.body.id)) continue;
            
            const dx = fa.body.position.x - fb.body.position.x;
            const dy = fa.body.position.y - fb.body.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Get the actual collision radius for flower b (accounting for orchid reduction)
            const flowerBData = allFlowers[fb.level];
            const radiusB = flowerBData.flowerType === 'orchid' ? flowerBData.radius * 0.5 : flowerBData.radius;
            
            if (dist < radiusA + radiusB + MERGE_RADIUS_BONUS) {
                if (typeof window.performMerge === 'function') {
                    window.performMerge(fa, fb, i, j);
                }
                return; // one merge per frame to let physics settle
            }
        }
    }
    
    // Clear the grid for next frame
    grid.clear();
}