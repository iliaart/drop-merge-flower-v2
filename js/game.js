// Main Game Logic — orchestrator module
import { state } from './state.js';
import { CONFIG } from './config.js';
import { clamp, rand, TAU, rgba, hexToRgb, hslToHex } from './utils.js';
import { generateRandomFlowerBatch, getAllFlowersWithGenerated, resetGeneratedFlowers, generateRandomFlower } from './random-flowers.js';
import { ParticleSystem, spawnMergeParticles, spawnDropParticles } from './particle.js';
import { visualEffects } from './visual-effects.js';
import { initPhysics, applyForces, updateAngularVelocity, destroyPhysics } from './physics.js';
import { resizeCanvas, setupInput as _setupInput, stopContinuousDrop } from './input.js';
import { ScreenShake } from './effects.js';  // Removed AmbientMote as it's not related to merging
import { flowerPool } from './flower-pool.js'; // Import the flower pool
import {
    drawBackground, drawVase, drawPreviewFlower, drawNextPreview,
    drawHighestLevel, drawGameOver, drawGameOverWarning, drawFlower, drawLevelProgress
} from './game-ui.js';

// Import modules
import { initGame as coreInitGame, restart as coreRestart, pickLevel, getPerformanceConfig, perfMonitor, checkGameOver } from './game/core.js';
import { createFlower, removeFlower, cleanupFlowers, dropFlower } from './game/flower-mechanics.js';
import { autoMergeExcessTypes, forceOverlapMerges, performMerge } from './game/merge-system.js';
import { checkMerges } from './game/spatial-grid.js';
import { updateFlowers, updateSquash } from './game/update-loop.js';
import { renderFrame, updateFlowerTail } from './game/render-loop.js';
import { shouldSkipFrame } from './game/utils.js';

const { GW, GH, VASE, DANGER_Y, DROP_Y, MAX_LEVEL, GAME_OVER_GRACE, MERGE_RADIUS_BONUS, SQUASH_FREQ, SQUASH_DAMP, MAX_FLOWER_TYPES, MAX_TYPES_AT_FULL, ADAPTIVE_FILL_THRESHOLD } = CONFIG;
const GAME_OVER_FLOWER_THRESHOLD = 3; // need this many flowers out of bounds to lose

// Track timeout IDs for proper cleanup
let currentDropTimeoutId = null;

// Performance tracking
let lastFrameTimestamp = 0;
let lastFrameTime = 0;
let frameSkipCounter = 0;

// Cache performance config to avoid repeated lookups
let cachedPerformanceConfig = null;
let lastPerformanceCheck = 0;

// State variable for mouse/touch hold instead of global variable
let isMouseDown = false;

/** Initialize game with canvas, context, restart button, and Matter.js */
export async function initGame(canvasEl, ctxEl, restartBtnEl, MatterLib) {
    await coreInitGame(canvasEl, ctxEl, restartBtnEl, MatterLib);
    requestAnimationFrame(gameLoop);
}

/** Load custom flowers and update MAX_LEVEL */
export async function initCustomFlowers(jsonPath) {
    const customFlowers = await loadCustomFlowers(jsonPath);
    if (customFlowers.length > 0) {
        CONFIG.MAX_LEVEL = getAllFlowersWithGenerated().length - 1;
    }
    return customFlowers;
}

export function restart() {
    coreRestart();
}

export { createFlower, dropFlower, pickLevel };

// Make createFlower function available globally
window.createFlower = createFlower;

// ─── Game Loop ───────────────────────────────────────────
function gameLoop(timestamp) {
    // Pause all game logic when tab is hidden to prevent CPU usage
    if (state.isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Get performance configuration
    const perfConfig = getPerformanceConfig();

    // Calculate frame interval based on target FPS for render throttling
    const targetFps = perfConfig?.targetFps || 60; // Default to 60fps if not specified
    const frameIntervalMs = 1000 / targetFps; // Convert fps to ms per frame

    // Performance optimization: removed FPS cap to allow unlimited frame rate
    const currentTime = timestamp;
    lastFrameTime = currentTime;

    // Update performance monitor
    perfMonitor.frameCount++;
    const now = performance.now();
    if (now - perfMonitor.lastPerfCheck >= 1000) {
        perfMonitor.avgFps = perfMonitor.frameCount * 1000 / (now - perfMonitor.lastPerfCheck);
        perfMonitor.frameCount = 0;
        perfMonitor.lastPerfCheck = now;
    }

    // Calculate delta time
    const rawDt = (timestamp - state.lastTime) / 1000;
    const dt = Math.min(rawDt, 1 / 20);
    state.lastTime = timestamp;
    state.time += dt;

    // Update physics using the state's Matter reference
    if (state.Matter && state.Matter.Engine) {
        state.Matter.Engine.update(state.engine, dt * 1000);
    } else {
        console.warn("state.Matter is not initialized, physics update skipped.");
    }
    applyForces(dt);

    // Update flower states
    for (const f of state.flowers) {
        if (!f) continue;
        updateAngularVelocity(f);
        if (f.spawning) {
            f.spawnTimer += dt;
            if (f.spawnTimer >= .5) f.spawning = false;
        }
        updateSquash(f, dt);
    }

    // Update flower tails for dragged or kinematic flowers
    // (static import — dynamic import() here allocated a Promise every frame)
    for (const f of state.flowers) {
        if (!f) continue;
        updateFlowerTail(f, currentTime);
    }

    // Perform merge checks less frequently based on performance config
    if (Math.floor(state.time * 10) % perfConfig.mergeCheckFreq === 0) { // Check every N frames based on performance
        checkMerges();
        forceOverlapMerges();
    }
    autoMergeExcessTypes();

    if (state.dropCooldown > 0) {
        state.dropCooldown -= dt;
        if (state.dropCooldown <= 0) state.dropCooldown = 0;
    }

    // Update particles with performance cap
    const maxParticles = perfConfig.maxParticles || 500;
    if (state.particles && state.particles.count < maxParticles) {
        state.particles.update(dt);
    }
    
    state.shake.update(dt);
    
    visualEffects.update(dt);

    if (state.gameState === 'playing') checkGameOver(dt);
    if (state.flowers.some(f => f === null)) cleanupFlowers();

    // Render - only if enough time has passed since last render for performance
    const renderTime = performance.now();
    if (renderTime - perfMonitor.lastRenderTime >= frameIntervalMs * 0.8) { // Allow 80% of frame time
        perfMonitor.lastRenderTime = renderTime;
        renderFrame(state.Matter);
    } else {
        perfMonitor.renderSkips++; // Track skipped renders
    }
    
    requestAnimationFrame(gameLoop);
}

// Make function available globally as per project specification
window.performMerge = performMerge;

export function setupInput() { _setupInput(); }