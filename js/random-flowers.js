// Random Flower Generation Module for the game
import { rand } from './utils.js';
import { getAllFlowers } from './flowers.js';
import { 
    isColorTooSimilar,
    addToRecentColors,
    generateRandomColors,
    generateComplementaryColor,
    calculateColorHarmony,
    evaluatePaletteHarmony,
    passesDiversityCheck,
    generateEnhancedColors,
    generateBeeAttractiveColors,
    generateButterflyAttractiveColors,
    generateAggressiveColors,
    generateInsectAttractiveColors,
    recentColors,
    hslToHex
} from './random-flower-colors.js';
import {
    isFlowerTooSimilarToNeighbors,
    calculateFlowerColorSimilarity,
    getColorDistance,
    addToRecentFlowers,
    recentFlowersQueue
} from './random-flower-diversity.js';

// Store generated flowers during gameplay
let generatedFlowers = [];

// Counter for tracking generation order
let generationCounter = 0;

// Maximum number of recent colors to track for diversity
const MAX_RECENT_COLORS = 10;

/**
 * Generate harmonious color palette based on color theory
 * @returns {object} color palette with primary, secondary, accent, etc.
 */
function generateHarmoniousColors() {
    // Use centralized palette manager if available
    if (typeof window.getUniquePaletteFromJson === 'function') {
        try {
            const colors = window.getUniquePaletteFromJson();
            // Since the centralized manager already ensures uniqueness, we just need to check diversity
            if (
                !isColorTooSimilar(colors.primary, recentColors.primary) &&
                !isColorTooSimilar(colors.secondary, recentColors.secondary) &&
                !isColorTooSimilar(colors.accent, recentColors.accent) &&
                !isColorTooSimilar(colors.accentDark, recentColors.accentDark) &&
                !isColorTooSimilar(colors.stem, recentColors.stem) &&
                !isColorTooSimilar(colors.leaf, recentColors.leaf) &&
                !isColorTooSimilar(colors.stamen, recentColors.stamen)
            ) {
                // Add these colors to recent colors tracking
                addToRecentColors('primary', colors.primary);
                addToRecentColors('secondary', colors.secondary);
                addToRecentColors('accent', colors.accent);
                addToRecentColors('accentDark', colors.accentDark);
                addToRecentColors('stem', colors.stem);
                addToRecentColors('leaf', colors.leaf);
                addToRecentColors('stamen', colors.stamen);
                
                return {
                    ...colors,
                    scheme: 'harmonious-from-json'
                };
            } else {
                // If colors are too similar to recent ones, fall back to algorithmic generation
            }
        } catch (e) {
            console.warn('Centralized palette manager failed, falling back to local algorithm:', e);
            // Continue with local algorithm below
        }
    }
    
    // Local algorithm implementation
    let attempts = 0;
    const maxAttempts = 10; // Limit attempts to avoid infinite loops
    
    while (attempts < maxAttempts) {
        // Генерация базового оттенка для цветка
        const baseHue = Math.floor(Math.random() * 360);
        
        // Создание гармоничных цветов с использованием теории цвета
        const primary = hslToHex(baseHue, 70 + Math.random() * 30, 40 + Math.random() * 30); // Основной цвет
        const secondary = hslToHex((baseHue + 30) % 360, 60 + Math.random() * 35, 45 + Math.random() * 25); // Аналогичный
        const accent = hslToHex((baseHue + 180) % 360, 65 + Math.random() * 30, 50 + Math.random() * 20); // Комплементарный
        const accentDark = hslToHex((baseHue + 180) % 360, 70 + Math.random() * 25, 30 + Math.random() * 20); // Темнее комплементарный
        const stem = hslToHex(120, 40 + Math.random() * 20, 25 + Math.random() * 15); // Зеленые тона для стебля
        const leaf = hslToHex(100, 45 + Math.random() * 20, 30 + Math.random() * 15); // Зеленые тона для листьев
        const stamen = hslToHex((baseHue + 150) % 360, 80 + Math.random() * 15, 60 + Math.random() * 20); // Контрастный тычинки
        
        const colors = {
            primary,
            secondary,
            accent,
            accentDark,
            stem,
            leaf,
            stamen,
            scheme: 'harmonious-theory'
        };
        
        // Check if any of these colors are too similar to recently used ones
        if (
            !isColorTooSimilar(colors.primary, recentColors.primary) &&
            !isColorTooSimilar(colors.secondary, recentColors.secondary) &&
            !isColorTooSimilar(colors.accent, recentColors.accent) &&
            !isColorTooSimilar(colors.accentDark, recentColors.accentDark) &&
            !isColorTooSimilar(colors.stem, recentColors.stem) &&
            !isColorTooSimilar(colors.leaf, recentColors.leaf) &&
            !isColorTooSimilar(colors.stamen, recentColors.stamen)
        ) {
            // Add these colors to recent colors tracking
            addToRecentColors('primary', colors.primary);
            addToRecentColors('secondary', colors.secondary);
            addToRecentColors('accent', colors.accent);
            addToRecentColors('accentDark', colors.accentDark);
            addToRecentColors('stem', colors.stem);
            addToRecentColors('leaf', colors.leaf);
            addToRecentColors('stamen', colors.stamen);
            
            return colors;
        }
        
        attempts++;
    }
    
    // If all attempts fail, return a standard harmonious palette
    return generateRandomColors();
}

// Define generateRandomFlower function in this module
function generateRandomFlower() {
    const flowerTypes = ['simple', 'double', 'multi', 'cluster', 'spiral', 'rose', 'orchid', 'jellyfish', 'coral', 'microorganism', 'insectoid', 'cosmic-cluster'];
    const flowerType = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];
    
    let petals;
    if (flowerType === 'simple') petals = Math.floor(rand(5, 13));
    else if (flowerType === 'double') petals = Math.floor(rand(8, 20));
    else if (flowerType === 'multi') petals = Math.floor(rand(12, 25));
    else if (flowerType === 'cluster') petals = Math.floor(rand(9, 21));
    else if (flowerType === 'spiral') petals = Math.floor(rand(13, 26));
    else if (flowerType === 'rose') petals = 25;
    else if (flowerType === 'jellyfish') petals = Math.floor(rand(8, 16)); // Tentacles count
    else if (flowerType === 'coral') petals = Math.floor(rand(6, 12)); // Branches count
    else if (flowerType === 'microorganism') petals = 10; // Fixed for cellular structure
    else if (flowerType === 'insectoid') petals = 6; // Symmetrical insect anatomy
    else petals = Math.floor(rand(10, 20)); // Default for cosmic-cluster and others
    
    // Set all flowers to medium size (around 45 pixels radius)
    const radius = 45; // Medium size for all flowers
    const petalW = parseFloat(rand(0.2, 0.7).toFixed(2));
    const petalH = parseFloat(rand(0.5, 1.1).toFixed(2));
    const fractalDepth = Math.floor(rand(0, 3));
    const tilt3D = 0; // Удаляем 3D наклон, устанавливаем в 0
    
    // Генерация цветов
    let colors;
    let attempts = 0;
    const maxAttempts = 5;

    // Randomly choose color generation method for variety
    const colorMethods = [
        { method: 'harmonious', weight: 40 },
        { method: 'bee-friendly', weight: 15 },
        { method: 'butterfly-friendly', weight: 15 },
        { method: 'aggressive', weight: 15 },
        { method: 'insect-attractive', weight: 15 }
    ];
    
    // Weighted random selection
    let totalWeight = colorMethods.reduce((sum, m) => sum + m.weight, 0);
    let r = Math.random() * totalWeight;
    let selectedMethod = 'harmonious';
    for (const cm of colorMethods) {
        r -= cm.weight;
        if (r <= 0) {
            selectedMethod = cm.method;
            break;
        }
    }

    // Try to generate a color palette that passes diversity checks
    do {
        if (selectedMethod === 'harmonious') {
            colors = generateHarmoniousColors();
        } else if (selectedMethod === 'bee-friendly') {
            colors = generateBeeAttractiveColors();
        } else if (selectedMethod === 'butterfly-friendly') {
            colors = generateButterflyAttractiveColors();
        } else if (selectedMethod === 'aggressive') {
            colors = generateAggressiveColors();
        } else if (selectedMethod === 'insect-attractive') {
            colors = generateInsectAttractiveColors();
        }
        
        attempts++;
    } while (attempts < maxAttempts && !passesDiversityCheck(colors));

    // Fallback to harmonious colors if no suitable palette was found
    if (attempts >= maxAttempts) {
        colors = generateHarmoniousColors();
    }

    const petalColor = colors.primary;
    const petalColor2 = colors.secondary;
    const centerColor = colors.accent;
    const centerColor2 = colors.accentDark;
    const stemColor = colors.stem;
    const leafColor = colors.leaf;
    const stamenColor = colors.stamen;
    
    const stamenTypes = ['simple', 'filament', 'clustered', 'spiral', 'brush', 'prominent', 'minimal', 'exotic', 'glass', 'jewel'];
    const stamenType = stamenTypes[Math.floor(Math.random() * stamenTypes.length)];
    const stamenCount = Math.floor(rand(3, 16));
    const stamenLen = parseFloat(rand(0.15, 0.5).toFixed(2));
    const antherSize = parseFloat(rand(0.7, 1.5).toFixed(1));

    // For insectoid type, always use 'none' pattern (no tessellation)
    let centerPattern;
    if (flowerType === 'insectoid') {
        centerPattern = 'none';
    } else {
        const centerPatterns = ['none', 'triangles', 'squares', 'pentagons', 'diamonds', 'cells', 'stars'];
        centerPattern = centerPatterns[Math.floor(Math.random() * centerPatterns.length)];
    }

    const flower = {
        type: flowerType,
        radius,
        petals,
        petalW,
        petalH,
        fractalDepth,
        tilt3D,
        petalColor,
        petalColor2,
        centerColor,
        centerColor2,
        stemColor,
        leafColor,
        stamenType,
        stamenCount,
        stamenLen,
        stamenColor,
        antherSize,
        level: 1,
        x: 0, // Will be set by the game
        y: 0, // Will be set by the game
        vx: 0, // Will be set by the game
        vy: 0, // Will be set by the game
        rotation: 0, // Will be set by the game
        hasStamens: Math.random() > 0.3, // Mostly has stamens, but sometimes not
        centerPattern,      // Add the center pattern property
        hasTessellation: centerPattern !== 'none',    // Add the tessellation flag
        hasOutlines: Math.random() > 0.5,        // Randomly add outlines
        generationNumber: 1  // Will be incremented by caller
    };

    return flower;
}

/**
 * Get all generated flowers
 * @returns {Array} Array of generated flower objects
 */
function getAllFlowersWithGenerated() {
    return [...generatedFlowers];
}

/**
 * Reset generated flowers pool and color tracking
 */
function resetGeneratedFlowers() {
    generatedFlowers = [];
    generationCounter = 0; // Reset the generation counter as well
    // Reset the recent colors tracking to allow full color diversity again
    for (let key in recentColors) {
        recentColors[key] = [];
    }
    // Reset the recent flowers queue
    recentFlowersQueue.length = 0; // Clear the array
    // Reset used palettes tracking using centralized manager if available
    if (typeof window.resetUsedPalettes === 'function') {
        try {
            window.resetUsedPalettes();
        } catch (e) {
            console.warn('Failed to reset palette tracking via centralized manager:', e);
        }
    }
    // Also reset color history if available
    if (typeof window.resetColorHistory === 'function') {
        try {
            window.resetColorHistory();
        } catch (e) {
            console.warn('Failed to reset color history via centralized manager:', e);
        }
    }
    // Also reset component color tracking if available
    if (typeof window.resetUsedComponentColors === 'function') {
        try {
            window.resetUsedComponentColors();
        } catch (e) {
            console.warn('Failed to reset component color tracking via centralized manager:', e);
        }
    }
}

/**
 * Generate a batch of random flowers
 * @param {number} count - Number of flowers to generate
 */
function generateRandomFlowerBatch(count) {
    for (let i = 0; i < count; i++) {
        const flower = generateRandomFlower();
        flower.generationNumber = ++generationCounter;
        generatedFlowers.push(flower);
        addToRecentFlowers(flower);
    }
    
    // Automatically log flower info if we've generated 50 flowers
    if (count === 50) {
        setTimeout(() => {
            logGeneratedFlowers(generatedFlowers);
        }, 100); // Delay to ensure all flowers are processed
    }
}

// Function to log all generated flowers with their properties
function logGeneratedFlowers(allFlowers) {
    // Проверяем, определен ли параметр allFlowers
    if (!allFlowers) {
        // Если allFlowers не передан, используем глобальный массив generatedFlowers
        allFlowers = generatedFlowers;
    }
    
    console.log(`%c=== Generated Flowers (${allFlowers.length} total) ===`, 'color: #4CAF50; font-weight: bold; font-size: 16px;');
    
    allFlowers.forEach((flower, index) => {
        const patternNames = {
            'none': 'No Tessellation',
            'triangles': 'Triangles',
            'squares': 'Squares',
            'pentagons': 'Pentagons',
            'diamonds': 'Diamonds',
            'cells': 'Cells',
            'stars': 'Stars'
        };
        
        const patternName = patternNames[flower.centerPattern] || flower.centerPattern;
        const flowerTypeName = flower.type;
        const paletteInfo = {
            'Primary Petal Color': flower.petalColor,
            'Secondary Petal Color': flower.petalColor2,
            'Center Accent Color': flower.centerColor,
            'Center Dark Accent Color': flower.centerColor2,
            'Stem Color': flower.stemColor,
            'Leaf Color': flower.leafColor,
            'Stamen Color': flower.stamenColor
        };
        
        console.group(`%cFlower #${index + 1}: ${flowerTypeName} with ${patternName}`, 'color: #2196F3; font-weight: bold;');
        console.table(paletteInfo);
        console.groupEnd();
    });
    
    console.log('%c=== End of Generated Flowers ===', 'color: #4CAF50; font-weight: bold; font-size: 16px;');
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.generateRandomFlower = () => {
        const flower = generateRandomFlower();
        flower.generationNumber = ++generationCounter;
        generatedFlowers.push(flower);
        addToRecentFlowers(flower);
        return flower;
    };
    window.generateRandomFlowerBatch = (count) => {
        for (let i = 0; i < count; i++) {
            const flower = generateRandomFlower();
            flower.generationNumber = ++generationCounter;
            generatedFlowers.push(flower);
            addToRecentFlowers(flower);
        }
        
        // Automatically log flower info if we've generated 50 flowers
        if (count === 50) {
            setTimeout(() => {
                logGeneratedFlowers(generatedFlowers);
            }, 100); // Delay to ensure all flowers are processed
        }
    };
    window.getAllFlowersWithGenerated = getAllFlowersWithGenerated;
    window.resetGeneratedFlowers = resetGeneratedFlowers;
    window.logGeneratedFlowers = () => logGeneratedFlowers(generatedFlowers); // Add the logging function to global scope
    window.colorPalettes = window.colorPalettes || [];
    window.calculateColorHarmony = () => {}; // Placeholder
    window.evaluatePaletteHarmony = () => {}; // Placeholder
    window.passesDiversityCheck = passesDiversityCheck;
    window.generateComplementaryColor = () => {}; // Placeholder
    window.hslToHex = hslToHex; // Added hslToHex to global scope
    window.isColorTooSimilar = isColorTooSimilar;
    window.generateHarmoniousColors = generateHarmoniousColors;
    window.generationCounter = generationCounter; // Make the counter available globally
    window.generatedFlowers = generatedFlowers; // Make the flowers array available globally
}

export {
    generateRandomFlower,
    generateRandomFlowerBatch,
    getAllFlowersWithGenerated,
    resetGeneratedFlowers,
    logGeneratedFlowers  // Export the logging function
};