// Shared Game State Module
// Central mutable state accessible by all game modules
import { ParticleSystem } from './particle.js';
import { AudioSystem } from './audio.js';

export const state = {
    // Physics
    engine: null,
    world: null,
    runner: null,
    Matter: null,
    walls: [],

    // Game objects
    flowers: [],
    particles: new ParticleSystem(),
    ambientMotes: [],
    audio: new AudioSystem(),
    shake: null, // set after import

    // Timing
    time: 0,
    lastTime: 0,

    // Input
    mouseX: 250, // GW/2 default

    // Game state
    gameState: 'playing',
    gameOverTimer: 0,
    gameOverAlpha: 0,
    outOfBoundsCount: 0,
    canDrop: true,
    dropCooldown: 0,

    // Levels
    currentLevel: 0,
    nextLevel: 0,
    highestLevel: 0,

    // Merge tracking
    mergingSet: new Set(),

    // Canvas
    canvas: null,
    ctx: null,
    restartBtn: null,
    canvasScale: 1,
    canvasOffsetX: 0,
    canvasOffsetY: 0,
    
    // Flower selection properties
    selectedFlower: null,
    isDragging: false,
};