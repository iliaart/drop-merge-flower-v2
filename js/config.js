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
};