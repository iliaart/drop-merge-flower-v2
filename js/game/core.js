// Core Game Module - initialization and basic game state management
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { clamp, rand, TAU, rgba, hexToRgb, hslToHex } from '../utils.js';
import { generateRandomFlowerBatch, getAllFlowersWithGenerated, resetGeneratedFlowers } from '../random-flowers.js';
// ParticleSystem import removed - particles are disabled for performance
import { visualEffects } from '../visual-effects.js';
import { initPhysics, destroyPhysics } from '../physics.js';
import { resizeCanvas } from '../input.js';
import { ScreenShake } from '../effects.js';  // Removed AmbientMote as it's not related to merging
import { flowerPool } from '../flower-pool.js';

const { GW, GH, VASE, DANGER_Y, DROP_Y, MAX_LEVEL, GAME_OVER_GRACE, MAX_FLOWER_TYPES, MAX_TYPES_AT_FULL, ADAPTIVE_FILL_THRESHOLD } = CONFIG;
const { TARGET_FLOWERS_FOR_NEXT_LEVEL, INITIAL_MAX_LEVEL_REQUIRED } = CONFIG;
const GAME_OVER_FLOWER_THRESHOLD = 3; // need this many flowers out of bounds to lose

// Track timeout IDs for proper cleanup
let dropTimeoutId = null;

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

// Cache performance config to avoid repeated lookups
let cachedPerformanceConfig = null;
let lastPerformanceCheck = 0;

function getPerformanceConfig() {
    const now = Date.now();
    if (!cachedPerformanceConfig || now - lastPerformanceCheck > 1000) { // Cache for 1 second
        cachedPerformanceConfig = window.PERFORMANCE_CONFIG || { maxParticles: 500, mergeCheckFreq: 2, ambientMotes: 15 };
        lastPerformanceCheck = now;
    }
    return cachedPerformanceConfig;
}

/** Initialize game with canvas, context, restart button, and Matter.js */
export async function initGame(canvasEl, ctxEl, restartBtnEl, MatterLib) {
    state.canvas = canvasEl;
    state.ctx = ctxEl;
    state.restartBtn = restartBtnEl;
    state.Matter = MatterLib; // Store MatterLib in state as per specification

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

    // Removed ambient motes initialization as they are not merge-related effects
    // const ambientMoteCount = window.PERFORMANCE_CONFIG?.ambientMotes || 15;
    // for (let i = 0; i < ambientMoteCount; i++) state.ambientMotes.push(new AmbientMote());

    // Initialize unique palettes before generating flowers
    if (typeof window.initializeUniquePalettes === 'function') {
        await window.initializeUniquePalettes();
    }

    // Generate random flowers for the game session
    resetGeneratedFlowers();
    // Use performance-appropriate flower count
    // Changed to generate 50 flowers on all mobile devices as per requirement
    const flowerCount = window.PERFORMANCE_CONFIG?.isLowEndDevice ? 30 : 50;
    generateRandomFlowerBatch(flowerCount); // Generate more random flowers for variety
    
    // Update MAX_LEVEL to account for generated flowers
    CONFIG.MAX_LEVEL = getAllFlowersWithGenerated().length - 1;

    // Set a reasonable initial highest level to allow generated flowers to appear
    state.highestLevel = Math.min(7, getAllFlowersWithGenerated().length - 1); // Start allowing some generated flowers
    state.currentLevel = pickLevel();
    state.nextLevel = pickLevel();
    state.lastTime = performance.now();
    
    // Инициализация системы уровней
    state.currentGameLevel = 1;                           // Текущий уровень игры
    state.targetFlowersForNextGameLevel = TARGET_FLOWERS_FOR_NEXT_LEVEL || 10; // Целевое количество цветов для перехода
    state.flowersAtMaxLevel = 0;                          // Счетчик цветов максимального уровня
    state.minRequiredFlowerLevelForGameLevel = INITIAL_MAX_LEVEL_REQUIRED || 2; // Минимальный уровень цветка для текущего уровня игры
    state.levelTransitionActive = false;                  // Флаг активности перехода между уровнями
    state.flowersToDrop = [];                             // Массив цветов для следующего уровня
}

export function restart() {
    // Clear all timeouts to prevent memory leaks
    if (dropTimeoutId) {
        clearTimeout(dropTimeoutId);
        dropTimeoutId = null;
    }
    // Note: prepareNextTimeoutId is now managed in flower-mechanics.js, not here

    // Clear all flower timeouts and return them to the pool
    state.flowers.forEach(f => {
        if (f && f.timeoutId) {
            clearTimeout(f.timeoutId);
        }
        // Return each flower to the pool
        flowerPool.release(f);
    });

    state.flowers.forEach(f => { if (f && f.body) state.Matter.World.remove(state.world, f.body); });
    state.flowers = [];
    state.mergingSet.clear();
    // Initialize particles with performance configuration
    state.initParticles();
    state.gameState = 'playing';
    state.gameOverTimer = 0;
    state.gameOverAlpha = 0;
    state.outOfBoundsCount = 0;
    state.highestLevel = 0; // Reset to 0 initially
    
    // Removed ambient motes cleanup as they are not merge-related effects
    // state.ambientMotes.forEach(mote => {
    //     if (mote.cleanup) {
    //         mote.cleanup();
    //     }
    // });
    // Removed clearing ambientMotes array since the property no longer exists in state

    // Removed ambient motes initialization as they are not merge-related effects
    // const ambientMoteCount = window.PERFORMANCE_CONFIG?.ambientMotes || 15;
    // for (let i = 0; i < ambientMoteCount; i++) state.ambientMotes.push(new AmbientMote());
    
    // Destroy and recreate physics world to prevent memory leaks
    destroyPhysics();
    initPhysics();
    
    // Regenerate random flowers for the new game
    resetGeneratedFlowers();
    // Use performance-appropriate flower count (same logic as initGame)
    const restartFlowerCount = window.PERFORMANCE_CONFIG?.isLowEndDevice ? 30 : 50;
    generateRandomFlowerBatch(restartFlowerCount); // Generate more random flowers for variety
    CONFIG.MAX_LEVEL = getAllFlowersWithGenerated().length - 1;
    
    // Clear and reset the flower pool
    flowerPool.clear();
    
    // Set initial highest level to allow generated flowers from start
    state.highestLevel = Math.min(7, getAllFlowersWithGenerated().length - 1);
    state.currentLevel = pickLevel();
    state.nextLevel = pickLevel();
    state.canDrop = true;
    state.dropCooldown = 0;
    state.restartBtn.style.display = 'none';
    
    // Перезапуск системы уровней
    state.currentGameLevel = 1;                           // Сброс до первого уровня
    state.targetFlowersForNextGameLevel = TARGET_FLOWERS_FOR_NEXT_LEVEL || 10; // Сброс целевого количества
    state.flowersAtMaxLevel = 0;                          // Сброс счетчика
    state.minRequiredFlowerLevelForGameLevel = INITIAL_MAX_LEVEL_REQUIRED || 2; // Сброс требуемого уровня
    state.levelTransitionActive = false;                  // Деактивация перехода
    state.flowersToDrop = [];                             // Очистка массива цветов для следующего уровня
}

/**
 * Calculate how full the vase is (0 = empty, 1 = packed).
 * Based on sum of flower circle areas vs vase rectangular area.
 */
export function getVaseFillRatio() {
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
export function getDistinctLevelsInVase() {
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
export function getAllowedTypeCount() {
    const fillRatio = getVaseFillRatio();
    const reductionScale = (MAX_FLOWER_TYPES - MAX_TYPES_AT_FULL) / ADAPTIVE_FILL_THRESHOLD;
    const reduction = Math.floor(fillRatio * reductionScale);
    return Math.max(MAX_TYPES_AT_FULL, MAX_FLOWER_TYPES - reduction);
}

export function pickLevel() {
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

export function checkGameOver(dt) {
    if (state.gameState !== 'playing') return;

    let outOfBoundsCount = 0;
    for (const f of state.flowers) {
        if (!f || !f.body) continue;
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

// Export utility functions
export { getPerformanceConfig, perfMonitor };

/**
 * Проверяет, достиг ли игрок целевого количества цветов максимального уровня.
 * При достижении цели активирует переход на следующий уровень.
 */
export function checkLevelProgress() {
    if (state.levelTransitionActive || state.gameState !== 'playing') {
        return false;
    }

    const allFlowers = getAllFlowersWithGenerated();
    const maxLevel = allFlowers.length - 1;
    
    // Проверяем, есть ли цветы максимального уровня
    const maxLevelFlowers = state.flowers.filter(f => 
        f && f.level === maxLevel && 
        f.body.position.y >= VASE.t
    );
    
    state.flowersAtMaxLevel = maxLevelFlowers.length;
    
    // Если игрок собрал достаточно цветов максимального уровня
    if (state.flowersAtMaxLevel >= state.targetFlowersForNextLevel) {
        // Активируем переход на следующий уровень
        state.levelTransitionActive = true;
        state.currentGameLevel++;
        
        // Подготавливаем цветы для следующего уровня
        prepareNextLevelFlowers();
        
        // Воспроизводим звук перехода на следующий уровень
        if (state.audio.levelUp) {
            state.audio.play(state.audio.levelUp);
        }
        
        return true;
    }
    
    return false;
}

/**
 * Подготавливает цветы для следующего уровня
 */
function prepareNextLevelFlowers() {
    const allFlowers = getAllFlowersWithGenerated();
    const maxLevel = allFlowers.length - 1;
    
    // Очищаем предыдущие цветы уровня
    state.flowersToDrop = [];
    
    // Добавляем цветы максимального уровня для следующего уровня
    const maxLevelFlowers = state.flowers.filter(f => 
        f && f.level === maxLevel && 
        f.body.position.y >= VASE.t
    );
    
    // Берем несколько цветов максимального уровня для следующего уровня
    const flowersForNextLevel = Math.min(3, maxLevelFlowers.length);
    
    // Добавляем цветы в массив для следующего уровня
    for (let i = 0; i < flowersForNextLevel; i++) {
        state.flowersToDrop.push(maxLevelFlowers[i]);
    }
    
    // Также добавляем несколько новых цветов из сгенерированных
    const generatedFlowers = allFlowers.slice(8); // Пропускаем стандартные цветы
    if (generatedFlowers.length > 0) {
        const newFlowerCount = Math.min(2, generatedFlowers.length);
        for (let i = 0; i < newFlowerCount; i++) {
            // Добавляем случайный сгенерированный цветок
            const randomIndex = Math.floor(Math.random() * generatedFlowers.length);
            state.flowersToDrop.push({ level: 8 + randomIndex });
        }
    }
}

/**
 * Получает цветок для следующего уровня
 */
export function getNextLevelFlower() {
    if (state.flowersToDrop.length > 0) {
        return state.flowersToDrop.pop();
    }
    
    // Если цветов для уровня нет, возвращаем обычный цветок
    return { level: pickLevel() };
}

// Export all functions that need to be available to other modules
// Note: pickLevel, checkGameOver, getAllowedTypeCount are already exported above, so we don't need to include them here again
