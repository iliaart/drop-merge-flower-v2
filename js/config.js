// Game Configuration Module
export const CONFIG = {
    // Game dimensions
    GW: 500,
    GH: 850,
    
    // Vase boundaries
    VASE: { l: 70, r: 430, t: 130, b: 800 },
    
    // Game mechanics
    DANGER_Y: 175,
    DROP_Y: 100,
    MAX_LEVEL: 57, // Increased to accommodate generated flowers (8 default + 50 generated)
    GAME_OVER_GRACE: 2.5,
    MERGE_RADIUS_BONUS: 12, // extra pixels for merge trigger beyond physical body

    // Cinematic merge (slow motion + attraction + focus)
    SLOWMO_SCALE: 0.28,       // time scale during cinematic merge
    SLOWMO_DURATION: 0.6,     // real seconds of full slow-motion before lerp back
    ATTRACT_FORCE: 0.045,     // attraction force between same-level flowers during slow-mo
    ATTRACT_MAX_SPEED: 7,     // px/step velocity cap while being attracted
    ATTRACT_MIN_DIST: 30,     // stop attracting when closer than this (px)
    ATTRACT_RANGE: 240,       // max distance at which attraction applies
    MERGE_SIZE_STEP: 0.06,    // each flower becomes ~6% bigger per merge generation
    MAX_MERGE_SIZE_MULT: 1.6, // cap for the size multiplier
    BONUS_WINDOW: 2.2,        // real-seconds window to keep the combo chain alive
    BONUS_MAX_FILL: 10,       // number of coefficient steps that fills the bonus bar
    
    // Physics
    GRAVITY: 1.4,
    GRAVITY_DENSITY_FACTOR: 0.15, // how much density affects gravity (positive = heavier falls faster)
    VIBRATION_STRENGTH: 0.08, // upward force on light flowers from vibrations
    VIBRATION_RADIUS: 150, // radius around impact where vibration affects flowers
    
    // Adaptive flower generator
    MAX_FLOWER_TYPES: 25,          // increased to allow more variety from generated flowers
    MAX_TYPES_AT_FULL: 15,         // types allowed when vase is ~full
    ADAPTIVE_FILL_THRESHOLD: 0.8, // fill ratio at which generator restricts to MAX_TYPES_AT_FULL

    // Animation
    SQUASH_FREQ: 14,     // spring oscillation speed
    SQUASH_DAMP: 0.35,   // 0 = no damping, 1 = critical

    // Level system - определяем переменные уровня здесь
    FLOWERS_NEEDED_FOR_NEXT_LEVEL: 10, // Количество цветов максимального уровня, необходимое для перехода на следующий уровень
    STARTING_MAX_LEVEL: 2,             // Начальный уровень, который считается максимальным для первого уровня игры
};