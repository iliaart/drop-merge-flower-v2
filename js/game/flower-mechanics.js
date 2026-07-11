// Flower Mechanics Module - flower creation, removal, and management
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { clamp, rand, TAU, rgba, hexToRgb, hslToHex } from '../utils.js';
import { getAllFlowersWithGenerated } from '../random-flowers.js';
import { visualEffects } from '../visual-effects.js';
import { flowerPool } from '../flower-pool.js';

const { VASE, DROP_Y } = CONFIG;

// Track timeout IDs for proper cleanup
let prepareNextTimeoutId = null;

/**
 * Create a new flower at the given position with the specified level
 */
export function createFlower(x, y, level) {
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

    // Acquire a flower object from the pool instead of creating a new one
    const flower = flowerPool.acquire();
    
    // Set the required properties for the flower
    flower.body = body;
    flower.level = level;
    flower.justSpawned = true;
    flower.spawning = false;
    flower.spawnScale = 1;
    flower.spawnTimer = 0;
    flower.mergeGlow = 0;
    flower.landingVy = 0;
    flower.squashS = 0;
    flower.squashV = 0;
    flower.squashAmp = 0;
    flower.lastVy = 0;
    flower.idlePhase = rand(0, TAU); // Randomize phase to avoid visual artifacts
    flower.stamenPhase = rand(0, TAU);
    flower.breathPhase = rand(0, TAU);
    flower.repulsionDamping = 0;
    flower.stopTimer = 0;
    flower.isForcedStopped = false;
    flower.resonanceTimer = 0;
    flower.isInContact = false;
    flower.vibrationEnergy = 0;
    // Clear and reset tail positions
    flower.tailPositions.length = 0;
    flower.lastTailUpdate = 0;

    // Clear any existing timeout ID
    if (flower.timeoutId) {
        clearTimeout(flower.timeoutId);
        flower.timeoutId = null;
    }

    state.flowers.push(flower);
    // Store timeout ID to allow cleanup
    const timeoutId = setTimeout(() => { flower.justSpawned = false; }, 300);
    flower.timeoutId = timeoutId;
    return flower;
}

export function removeFlower(idx) {
    const f = state.flowers[idx];
    if (!f) return;
    // Clear timeout if exists
    if (f.timeoutId) {
        clearTimeout(f.timeoutId);
    }
    state.Matter.World.remove(state.world, f.body);
    
    // Return the flower object to the pool for reuse
    flowerPool.release(f);
    
    state.flowers[idx] = null;
}

export function cleanupFlowers() {
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

async function prepareNextFlower() {
    // Import pickLevel dynamically to avoid circular dependency
    const coreModule = await import('./core.js');
    state.currentLevel = state.nextLevel;
    state.nextLevel = coreModule.pickLevel();
    state.canDrop = true;
    
    // We no longer automatically drop another flower if mouse is held down
    // This is now handled by the interval in input.js
}

// State variable for mouse/touch hold instead of global variable
let isMouseDown = false;

