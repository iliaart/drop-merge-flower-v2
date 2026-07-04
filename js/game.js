// Main Game Logic — orchestrator module
import { state } from './state.js';
import { CONFIG } from './config.js';
import { clamp, rand, TAU } from './utils.js';
import { generateRandomFlowerBatch, getAllFlowersWithGenerated, resetGeneratedFlowers, generateRandomFlower } from './random-flowers.js';
import { ParticleSystem, spawnMergeParticles, spawnDropParticles } from './particle.js';
import { visualEffects } from './visual-effects.js';
import { initPhysics, applyForces, updateAngularVelocity, destroyPhysics } from './physics.js';
import { resizeCanvas, setupInput as _setupInput } from './input.js';
import { ScreenShake, AmbientMote } from './effects.js';
import {
    drawBackground, drawVase, drawPreviewFlower, drawNextPreview,
    drawHighestLevel, drawGameOver, drawGameOverWarning, drawFlower
} from './game-ui.js';

const { GW, GH, VASE, DANGER_Y, DROP_Y, MAX_LEVEL, GAME_OVER_GRACE, MERGE_RADIUS_BONUS, SQUASH_FREQ, SQUASH_DAMP, MAX_FLOWER_TYPES, MAX_TYPES_AT_FULL, ADAPTIVE_FILL_THRESHOLD } = CONFIG;
const GAME_OVER_FLOWER_THRESHOLD = 3; // need this many flowers out of bounds to lose

// Track timeout IDs for proper cleanup
let dropTimeoutId = null;
let prepareNextTimeoutId = null;

// Performance tracking
let lastFrameTime = 0;
let frameSkipCounter = 0;
let perfMonitor = {
    frameCount: 0,
    lastPerfCheck: performance.now(),
    avgFps: 60,
    renderSkips: 0,
    lastRenderTime: 0
};

/** Initialize game with canvas, context, restart button, and Matter.js */
export async function initGame(canvasEl, ctxEl, restartBtnEl, MatterLib) {
    state.canvas = canvasEl;
    state.ctx = ctxEl;
    state.restartBtn = restartBtnEl;
    state.Matter = MatterLib;

    resizeCanvas();
    initPhysics();
    state.audio.init();
    state.shake = new ScreenShake();

    // Initialize particles with performance configuration
    state.initParticles = () => {
        const maxParticles = window.PERFORMANCE_CONFIG?.maxParticles || 500;
        state.particles = new ParticleSystem(maxParticles);
    };

    // Initialize particles with performance configuration
    state.initParticles();

    // Use performance-configured number of ambient motes
    const ambientMoteCount = window.PERFORMANCE_CONFIG?.ambientMotes || 15;
    for (let i = 0; i < ambientMoteCount; i++) state.ambientMotes.push(new AmbientMote());

    // Initialize unique palettes before generating flowers
    if (typeof window.initializeUniquePalettes === 'function') {
        await window.initializeUniquePalettes();
    }

    // Generate random flowers for the game session
    resetGeneratedFlowers();
    // Use performance-appropriate flower count
    const flowerCount = window.PERFORMANCE_CONFIG?.isLowEndDevice ? 30 : window.PERFORMANCE_CONFIG?.isMobile ? 40 : 50;
    generateRandomFlowerBatch(flowerCount); // Generate more random flowers for variety
    
    // Update MAX_LEVEL to account for generated flowers
    CONFIG.MAX_LEVEL = getAllFlowersWithGenerated().length - 1;

    // Set a reasonable initial highest level to allow generated flowers to appear
    state.highestLevel = Math.min(7, getAllFlowersWithGenerated().length - 1); // Start allowing some generated flowers
    state.currentLevel = pickLevel();
    state.nextLevel = pickLevel();
    state.lastTime = performance.now();
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

/**
 * Calculate how full the vase is (0 = empty, 1 = packed).
 * Based on sum of flower circle areas vs vase rectangular area.
 */
function getVaseFillRatio() {
    const allFlowers = getAllFlowersWithGenerated();
    const vaseArea = (VASE.r - VASE.l) * (VASE.b - VASE.t);
    let totalFlowerArea = 0;
    for (const f of state.flowers) {
        if (!f) continue;
        const flowerData = allFlowers[f.level];
        const r = flowerData.flowerType === 'orchid' ? flowerData.radius * 0.5 : flowerData.radius; // Account for orchid size reduction
        totalFlowerArea += Math.PI * r * r;
    }
    return totalFlowerArea / vaseArea;
}

/**
 * Get the set of distinct flower levels currently in the vase (sorted ascending).
 */
function getDistinctLevelsInVase() {
    const levels = new Set();
    for (const f of state.flowers) {
        if (!f) continue;
        levels.add(f.level);
    }
    return [...levels].sort((a, b) => a - b);
}

/**
 * Calculate how many distinct flower types the generator is allowed to produce,
 * based on vase fill ratio. At 0% fill → MAX_FLOWER_TYPES; at 100% → MAX_TYPES_AT_FULL.
 */
function getAllowedTypeCount() {
    const fillRatio = getVaseFillRatio();
    const reductionScale = (MAX_FLOWER_TYPES - MAX_TYPES_AT_FULL) / ADAPTIVE_FILL_THRESHOLD;
    const reduction = Math.floor(fillRatio * reductionScale);
    return Math.max(MAX_TYPES_AT_FULL, MAX_FLOWER_TYPES - reduction);
}

function pickLevel() {
    const allFlowers = getAllFlowersWithGenerated();
    const maxLevel = allFlowers.length - 1;

    const distinctLevels = getDistinctLevelsInVase();
    const minLevel = distinctLevels.length > 0 ? distinctLevels[0] : 0;
    const allowedCount = getAllowedTypeCount();

    // Generator range:
    //   - starts at minLevel (lowest type still in vase)
    //   - capped by highestLevel + 1 (new types only appear after merging on the field)
    //   - capped by allowedCount (adaptive limit based on vase fill)
    const discoveryCap = state.highestLevel + 1;
    const maxOffer = Math.min(minLevel + allowedCount - 1, discoveryCap, maxLevel);
    const safeMin = Math.min(minLevel, maxOffer);

    // Adjust weights to give more variety with generated flowers
    // For early game, increase the chance of getting generated flowers
    const defaultWeights = [30, 25, 20, 13, 8, 3, 1, 0]; // For the 8 default flowers
    const weights = [...defaultWeights];
    
    // Add weights for custom flowers and generated flowers
    for (let i = 8; i < allFlowers.length; i++) {
        // Higher weight for generated flowers in early game to ensure variety
        const isEarlyGame = state.highestLevel < 5; // If player hasn't progressed far
        const weight = isEarlyGame ? 5 : 1.5; // Higher chance for generated flowers early on
        weights.push(weight); 
    }

    let total = 0;
    for (let i = safeMin; i <= maxOffer; i++) total += weights[i];
    if (total <= 0) return safeMin;

    let r = Math.random() * total;
    for (let i = safeMin; i <= maxOffer; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return safeMin;
}

function createFlower(x, y, level) {
    const { Bodies, World } = state.Matter;
    const allFlowers = getAllFlowersWithGenerated();
    const f = allFlowers[level];
    if (!f) return null;

    let r = f.radius;
    // Reduce collision radius by half for orchids
    let collisionRadius = f.flowerType === 'orchid' ? r * 0.5 : r;
    
    const body = Bodies.circle(x, y, collisionRadius, {
        restitution: .08 + (allFlowers.length - 1 - level) * .01,
        friction: .6, frictionAir: .015,
        density: .0015 + level * .0004,
        label: 'flower', frictionStatic: 0, sleepThreshold: 60,
    });
    body.flowerIdx = state.flowers.length;
    World.add(state.world, body);

    state.Matter.Body.setAngle(body, rand(-TAU, TAU));
    state.Matter.Body.setAngularVelocity(body, rand(-0.03, 0.03));

    const flower = {
        body, level, justSpawned: true, spawning: false, spawnScale: 1,
        spawnTimer: 0, mergeGlow: 0, landingVy: 0, squashS: 0, squashV: 0,
        squashAmp: 0, lastVy: 0, idlePhase: rand(0, TAU), stamenPhase: rand(0, TAU),
        breathPhase: rand(0, TAU), repulsionDamping: 0, stopTimer: 0,
        isForcedStopped: false, resonanceTimer: 0, isInContact: false, vibrationEnergy: 0,
    };
    state.flowers.push(flower);
    // Store timeout ID to allow cleanup
    const timeoutId = setTimeout(() => { flower.justSpawned = false; }, 300);
    flower.timeoutId = timeoutId;
    return flower;
}

function removeFlower(idx) {
    const f = state.flowers[idx];
    if (!f) return;
    // Clear timeout if exists
    if (f.timeoutId) {
        clearTimeout(f.timeoutId);
    }
    state.Matter.World.remove(state.world, f.body);
    state.flowers[idx] = null;
}

function cleanupFlowers() {
    state.flowers = state.flowers.filter(f => f !== null);
    state.flowers.forEach((f, i) => { f.body.flowerIdx = i; });
}

export function dropFlower() {
    if (!state.canDrop || state.gameState !== 'playing') return;
    
    const allFlowers = getAllFlowersWithGenerated();
    
    // Проверяем, что массив цветков не пуст
    if (allFlowers.length === 0) {
        console.warn('dropFlower: no flowers generated yet, skipping drop');
        return;
    }
    
    // Проверяем, что currentLevel является допустимым индексом
    if (state.currentLevel < 0 || state.currentLevel >= allFlowers.length) {
        console.error('dropFlower: currentLevel is out of bounds', state.currentLevel, 'with flowers array length', allFlowers.length);
        return;
    }
    
    const f = allFlowers[state.currentLevel];
    
    // Проверяем, существует ли цветок и имеет ли он необходимые свойства
    if (!f || typeof f.radius === 'undefined') {
        console.error('dropFlower: flower object is undefined or missing radius property for level', state.currentLevel);
        return;
    }
    
    state.canDrop = false;
    state.audio.ensure();
    state.audio.playDrop();
    
    const x = clamp(state.mouseX, VASE.l + f.radius + 5, VASE.r - f.radius - 5);
    const flower = createFlower(x, DROP_Y, state.currentLevel);
    if (flower) {
        flower.justSpawned = false;
        visualEffects.createDropEffect(x, DROP_Y, state.currentLevel);
    }
    state.dropCooldown = .3; // Changed from .35 to .3 (0.3 seconds)
    // Clear any existing timeout
    if (prepareNextTimeoutId) {
        clearTimeout(prepareNextTimeoutId);
    }
    prepareNextTimeoutId = setTimeout(prepareNextFlower, 300); // Changed from 350 to 300ms
}

// State variable for mouse/touch hold instead of global variable
let isMouseDown = false;

function prepareNextFlower() {
    state.currentLevel = state.nextLevel;
    state.nextLevel = pickLevel();
    state.canDrop = true;
    
    // We no longer automatically drop another flower if mouse is held down
    // This is now handled by the interval in input.js
}

export function restart() {
    // Clear all timeouts to prevent memory leaks
    if (dropTimeoutId) {
        clearTimeout(dropTimeoutId);
        dropTimeoutId = null;
    }
    if (prepareNextTimeoutId) {
        clearTimeout(prepareNextTimeoutId);
        prepareNextTimeoutId = null;
    }

    // Clear all flower timeouts
    state.flowers.forEach(f => {
        if (f && f.timeoutId) {
            clearTimeout(f.timeoutId);
        }
    });

    state.flowers.forEach(f => { if (f) state.Matter.World.remove(state.world, f.body); });
    state.flowers = [];
    state.mergingSet.clear();
    // Initialize particles with performance configuration
    state.initParticles();
    state.gameState = 'playing';
    state.gameOverTimer = 0;
    state.gameOverAlpha = 0;
    state.outOfBoundsCount = 0;
    state.highestLevel = 0; // Reset to 0 initially
    
    // Clean up ambient motes
    state.ambientMotes.forEach(mote => {
        if (mote.cleanup) {
            mote.cleanup();
        }
    });
    state.ambientMotes = [];

    // Initialize new ambient motes
    // Initialize new ambient motes with performance-configured count
    const ambientMoteCount = window.PERFORMANCE_CONFIG?.ambientMotes || 15;
    for (let i = 0; i < ambientMoteCount; i++) state.ambientMotes.push(new AmbientMote());
    
    // Destroy and recreate physics world to prevent memory leaks
    destroyPhysics();
    initPhysics();
    
    // Regenerate random flowers for the new game
    resetGeneratedFlowers();
    generateRandomFlowerBatch(50); // Generate more random flowers for variety
    CONFIG.MAX_LEVEL = getAllFlowersWithGenerated().length - 1;
    
    // Set initial highest level to allow generated flowers from start
    state.highestLevel = Math.min(7, getAllFlowersWithGenerated().length - 1);
    state.currentLevel = pickLevel();
    state.nextLevel = pickLevel();
    state.canDrop = true;
    state.dropCooldown = 0;
    state.restartBtn.style.display = 'none';
}

export function setupInput() { _setupInput(); }

/**
 * Auto-merge the lowest-level flower type when distinct types exceed allowed count.
 * Picks the two lowest-level flowers at the smallest level and forces a merge,
 * effectively "evolving" them into the next tier and reducing type variety.
 */
function autoMergeExcessTypes() {
    const allFlowers = getAllFlowersWithGenerated();
    const distinctLevels = getDistinctLevelsInVase();
    const allowedCount = getAllowedTypeCount();

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

function checkGameOver(dt) {
    if (state.gameState !== 'playing') return;

    let outOfBoundsCount = 0;
    for (const f of state.flowers) {
        if (!f) continue;
        if (f.body.position.y < VASE.t - 20) outOfBoundsCount++;
    }
    state.outOfBoundsCount = outOfBoundsCount;

    if (outOfBoundsCount >= GAME_OVER_FLOWER_THRESHOLD) {
        if (state.gameOverTimer === 0) state.restartBtn.style.display = 'block';
        state.gameOverTimer += dt;
        if (state.gameOverTimer > GAME_OVER_GRACE) state.gameState = 'gameover';
    } else {
        state.gameOverTimer = Math.max(0, state.gameOverTimer - dt * 1.2);
        // Only hide restart button when definitely not game over
        if (state.gameOverTimer <= 0) {
            state.restartBtn.style.display = 'none';
        }
    }
}

/** Secondary merge check in game loop (distance-based) */
function checkMerges() {
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
            if (dist < radiusA + radiusB + MERGE_RADIUS_BONUS) {
                if (typeof window.performMerge === 'function') {
                    window.performMerge(fa, fb, i, j);
                }
                return; // one merge per frame to let physics settle
            }
        }
    }
}

/**
 * Safety-net merge for same-level flowers that are physically overlapping
 * (centers closer than sum of radii). Catches cases where collisionStart
 * already fired and won't fire again (continuous contact after spawn).
 */
function forceOverlapMerges() {
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

function performMerge(fa, fb, idxA, idxB) {
    if (!fa || !fb) return;

    state.mergingSet.add(fa.body.id);
    state.mergingSet.add(fb.body.id);
    const mx = (fa.body.position.x + fb.body.position.x) / 2;
    const my = (fa.body.position.y + fb.body.position.y) / 2;
    const newLevel = fa.level + 1;

    // Check if either of the flowers being merged is currently selected
    const wasSelected = state.selectedFlower && (state.selectedFlower === fa || state.selectedFlower === fb);

    removeFlower(idxA);
    removeFlower(idxB);

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

// ─── Game Loop ───────────────────────────────────────────
function gameLoop(timestamp) {
    // Performance optimization: skip frames if running behind
    const currentTime = timestamp;
    const perfConfig = window.PERFORMANCE_CONFIG || { maxFPS: 60, mergeCheckFreq: 2 };
    const frameInterval = 1000 / perfConfig.maxFPS;
    const elapsed = currentTime - lastFrameTime;
    
    if (elapsed < frameInterval) {
        requestAnimationFrame(gameLoop);
        return;
    }
    lastFrameTime = currentTime - (elapsed % frameInterval);
    
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

    // Update physics
    state.Matter.Engine.update(state.engine, dt * 1000);
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

    state.particles.update(dt);
    state.shake.update(dt);
    state.ambientMotes.forEach(m => m.update(dt, state.time));
    visualEffects.update(dt);

    if (state.gameState === 'playing') checkGameOver(dt);
    if (state.flowers.some(f => f === null)) cleanupFlowers();

    // Render - only if enough time has passed since last render for performance
    const renderTime = performance.now();
    if (renderTime - perfMonitor.lastRenderTime >= frameInterval * 0.8) { // Allow 80% of frame time
        perfMonitor.lastRenderTime = renderTime;
        renderFrame();
    } else {
        perfMonitor.renderSkips++; // Track skipped renders
    }
    
    requestAnimationFrame(gameLoop);
}

function renderFrame() {
    // Render
    const ctx = state.ctx;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);

    drawBackground(ctx);
    drawVase(ctx);

    // Separate the flowers into selected and unselected for rendering order
    const unselectedFlowers = [];
    let selectedFlowerToRender = null;

    for (const f of state.flowers) {
        if (f) {
            if (state.selectedFlower === f) {
                selectedFlowerToRender = f;
            } else {
                unselectedFlowers.push(f);
            }
        }
    }

    // Draw unselected flowers first
    for (const f of unselectedFlowers) {
        drawFlower(ctx, f, state.time);
    }

    // Then draw the selected flower on top
    if (selectedFlowerToRender) {
        drawFlower(ctx, selectedFlowerToRender, state.time);
    }

    // Draw visual effects
    visualEffects.draw(ctx);
    
    // Draw particle system
    state.particles.draw(ctx);

    // Draw selected flower indicator if there is one
    if (state.selectedFlower) {
        const pos = state.selectedFlower.body.position;
        const allFlowers = getAllFlowersWithGenerated();
        const f = allFlowers[state.selectedFlower.level];
        const r = f.radius;

        // Draw a selection ring around the selected flower
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)'; // Yellow selection ring
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, Math.max(r + 10, 25), 0, TAU); // Slightly larger than flower radius

        // Add a glow effect for better visibility
        ctx.shadowColor = 'rgba(255, 255, 0, 0.6)';
        ctx.shadowBlur = 10;

        ctx.stroke();

        // Draw an arrow pointing to the selected flower
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - (Math.max(r + 15, 30)));
        ctx.lineTo(pos.x - 5, pos.y - (Math.max(r + 25, 40)));
        ctx.lineTo(pos.x + 5, pos.y - (Math.max(r + 25, 40)));
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
        ctx.fill();

        ctx.restore();
    }

    drawPreviewFlower(ctx, state.time);
    drawNextPreview(ctx, state.time);
    drawHighestLevel(ctx);
    drawGameOverWarning(ctx);
    drawGameOver(ctx, state.time > 0 ? 0.016 : 0); // Используем state.time или фиксированное значение вместо dt

    ctx.restore();
}

function updateFlowers() {
    if (state.gameState !== 'playing') return;

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
                const allFlowers = getAllFlowersWithGenerated();
                const flowerData = allFlowers[f.level];
                if (flowerData) {
                    const flowerRadius = flowerData.flowerType === 'orchid' ? flowerData.radius * 0.5 : flowerData.radius;
                    const avgRadius = allFlowers.slice(0, Math.min(8, allFlowers.length)).reduce((sum, fl, idx) => {
                        const rad = fl.flowerType === 'orchid' ? fl.radius * 0.5 : fl.radius;
                        return sum + rad;
                    }, 0) / Math.min(8, allFlowers.length) || 40;
                    
                    const densityModifier = 1 + (flowerRadius - avgRadius) * CONFIG.GRAVITY_DENSITY_FACTOR / avgRadius;
                    f.body.gravityScale = densityModifier;
                    
                    // Ensure the body is not static when not dragging
                    if (state.Matter.Body.getStatic(f.body)) {
                        state.Matter.Body.setStatic(f.body, false);
                    }
                }
            }
        } else {
            // For dragged flower, temporarily disable gravity and make static
            if (f.body && state.isDragging) {
                f.body.gravityScale = 0;
                state.Matter.Body.setStatic(f.body, true);
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
        if (f.mergeGlow) {
            f.mergeGlow -= 0.05;
            if (f.mergeGlow <= 0) {
                f.mergeGlow = 0;
            }
        }
    }
}

function updateSquash(f, dt) {
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