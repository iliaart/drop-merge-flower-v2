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
    particles: null, // Will be initialized in game.js with performance config
    audio: new AudioSystem(),
    shake: null, // set after import

    // Timing
    time: 0,
    lastTime: 0,

    // Input
    mouseX: 250, // GW/2 default
    lastMouseX: 250,
    lastMouseY: 250,

    // Game state
    gameState: 'playing',
    gameOverTimer: 0,
    gameOverAlpha: 0,
    outOfBoundsCount: 0,
    canDrop: true,
    dropCooldown: 0,
    dropIntervalId: null,
    isContinuousDrop: false,
    isPaused: false,  // Flag to pause game when tab is hidden

    // Levels
    currentLevel: 0,
    nextLevel: 0,
    highestLevel: 0,
    // Новые переменные для системы уровней
    currentGameLevel: 1,                          // Текущий уровень игры (например, 1, 2, 3...) - gameLevel
    targetFlowersForNextGameLevel: 10,            // Количество цветов максимального уровня, необходимое для перехода на следующий уровень
    flowersAtMaxLevel: 0,                         // Счетчик цветов максимального уровня
    minRequiredFlowerLevelForGameLevel: 2,        // Уровень цветка, который считается "максимальным" для текущего уровня игры - flowerLevel
    levelTransitionActive: false,                 // Флаг активности перехода между уровнями
    flowersToDrop: [],                            // Массив цветов, которые будут "падать" в следующем уровне

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
    
    // Performance tracking
    perfMonitor: {
        frameCount: 0,
        lastPerfCheck: 0,
        avgFps: 60,
        renderSkips: 0,
        lastRenderTime: 0
    },
    
    // Initialize particles in game.js with performance config
    initParticles: function() {
        const maxParticles = window.PERFORMANCE_CONFIG?.maxParticles || 500;
        this.particles = new ParticleSystem(maxParticles);
    }
};