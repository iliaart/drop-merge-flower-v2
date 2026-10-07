// Spatial Grid Module - efficient collision detection system
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { getAllFlowersWithGenerated } from '../random-flowers.js';

const { MERGE_RADIUS_BONUS } = CONFIG;

/**
 * Spatial hash grid for efficient collision detection.
 * Cell arrays are reused between rebuilds (length = 0 instead of allocating
 * a new array per cell) — the old version allocated ~130 arrays + wrapper
 * objects every merge check, which was a constant GC pressure source.
 */
export class SpatialGrid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = new Array(this.cols * this.rows);
        for (let i = 0; i < this.grid.length; i++) this.grid[i] = [];
    }
    
    getCellIndex(x, y) {
        const col = (x / this.cellSize) | 0;
        const row = (y / this.cellSize) | 0;
        
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
    
    /**
     * Iterate over items in the 3x3 neighborhood of (x, y) without building
     * an intermediate array (getNearbyItems used push(...spread) per query).
     */
    forEachNearby(x, y, cb) {
        const leftCol = Math.floor((x - this.cellSize) / this.cellSize);
        const rightCol = Math.floor((x + this.cellSize) / this.cellSize);
        const topRow = Math.floor((y - this.cellSize) / this.cellSize);
        const bottomRow = Math.floor((y + this.cellSize) / this.cellSize);
        
        for (let col = leftCol; col <= rightCol; col++) {
            if (col < 0 || col >= this.cols) continue;
            const colBase = col;
            for (let row = topRow; row <= bottomRow; row++) {
                if (row < 0 || row >= this.rows) continue;
                const cell = this.grid[row * this.cols + colBase];
                for (let k = 0; k < cell.length; k++) cb(cell[k]);
            }
        }
    }

    getNearbyItems(x, y) {
        const items = [];
        this.forEachNearby(x, y, (item) => items.push(item));
        return items;
    }
    
    clear() {
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i].length = 0;
        }
    }
}

// Shared singleton grid — rebuilt each merge check, never re-allocated
let sharedGrid = null;

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
    if (!sharedGrid) sharedGrid = new SpatialGrid(CONFIG.GW, CONFIG.GH, 100); // 100px grid cells
    const grid = sharedGrid;
    grid.clear();
    
    // Populate grid with flowers
    for (let i = 0; i < state.flowers.length; i++) {
        const fa = state.flowers[i];
        if (!fa) continue;
        
        // Get the actual collision radius for flower a (accounting for orchid reduction)
        const flowerAData = allFlowers[fa.level];
        const radiusA = flowerAData.flowerType === 'orchid' ? flowerAData.radius * 0.5 : flowerAData.radius;
        
        // Проверяем, что тело существует перед использованием его позиции
        if (fa.body) {
            grid.add({flower: fa, index: i, radius: radiusA}, fa.body.position.x, fa.body.position.y);
        }
    }
    
    // Check for collisions using spatial grid
    for (let i = 0; i < state.flowers.length; i++) {
        const fa = state.flowers[i];
        if (!fa || !fa.body) continue;
        
        // Get the actual collision radius for flower a (accounting for orchid reduction)
        const flowerAData = allFlowers[fa.level];
        const radiusA = flowerAData.flowerType === 'orchid' ? flowerAData.radius * 0.5 : flowerAData.radius;
        
        if (fa.level >= allFlowers.length - 1) continue;
        if (state.mergingSet.has(fa.body.id)) continue;
        
        const ax = fa.body.position.x;
        const ay = fa.body.position.y;

        // Get nearby flowers from spatial grid instead of checking all flowers
        let merged = false;
        grid.forEachNearby(ax, ay, (nearby) => {
            if (merged) return;
            const fb = nearby.flower;
            const j = nearby.index;

            if (i >= j) return; // Avoid duplicate checks and self-checks
            if (!fb || !fb.body || fa.level !== fb.level) return;
            if (state.mergingSet.has(fb.body.id)) return;

            const dx = ax - fb.body.position.x;
            const dy = ay - fb.body.position.y;
            const distSq = dx * dx + dy * dy;

            // Get the actual collision radius for flower b (accounting for orchid reduction)
            const flowerBData = allFlowers[fb.level];
            const radiusB = flowerBData.flowerType === 'orchid' ? flowerBData.radius * 0.5 : flowerBData.radius;

            const mergeDist = radiusA + radiusB + MERGE_RADIUS_BONUS;
            if (distSq < mergeDist * mergeDist) {
                if (typeof window.performMerge === 'function') {
                    merged = true;
                    window.performMerge(fa, fb, i, j);
                }
            }
        });

        if (merged) return; // one merge per frame to let physics settle
    }
}