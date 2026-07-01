// Import necessary functions from other modules
import { rand, hslToHex } from './utils.js';
import { generateHarmoniousColors } from './flower-gen-colors.js';

// Variables to track recently used colors and palettes
const recentColors = {
    primary: [],
    secondary: [],
    accent: [],
    accentDark: [],
    stem: [],
    leaf: [],
    stamen: []
};

const MAX_RECENT_COLORS = 5; // Track last 5 colors for each category

// Function to add a color to the recent colors tracking
function addToRecentColors(category, color) {
    if (!recentColors[category]) {
        recentColors[category] = [];
    }
    
    // Add the new color to the front of the array
    recentColors[category].unshift(color);
    
    // Keep only the most recent colors (up to MAX_RECENT_COLORS)
    if (recentColors[category].length > MAX_RECENT_COLORS) {
        recentColors[category].pop();
    }
}

// Function to check if a color is too similar to recently used ones
function isColorTooSimilar(newColor, recentColorList) {
    if (!Array.isArray(recentColorList) || recentColorList.length === 0) {
        return false; // No recent colors to compare with
    }
    
    // Convert hex colors to HSL for better similarity detection
    function hexToHSL(hex) {
        // Remove the hash if present
        hex = hex.replace(/^#/, '');
        
        // Parse r, g, b values
        let r = parseInt(hex.substring(0, 2), 16) / 255;
        let g = parseInt(hex.substring(2, 4), 16) / 255;
        let b = parseInt(hex.substring(4, 6), 16) / 255;
        
        // Find the minimum and maximum values
        let max = Math.max(r, g, b);
        let min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        return { h: h * 360, s: s * 100, l: l * 100 };
    }
    
    const newHSL = hexToHSL(newColor);
    
    for (const recentColor of recentColorList) {
        const recentHSL = hexToHSL(recentColor);
        
        // Check if the colors are too similar based on HSL values
        const hueDiff = Math.min(
            Math.abs(newHSL.h - recentHSL.h),
            360 - Math.abs(newHSL.h - recentHSL.h)
        );
        const satDiff = Math.abs(newHSL.s - recentHSL.s);
        const lumDiff = Math.abs(newHSL.l - recentHSL.l);
        
        // Adjust these thresholds as needed
        if (hueDiff < 20 && satDiff < 20 && lumDiff < 20) {
            return true; // Colors are too similar
        }
    }
    
    return false; // Colors are sufficiently different
}

// Variables to track generated flowers and related functions
let generationCounter = 0;
const generatedFlowers = [];

// Function to add to recent flowers queue to ensure neighbor diversity
function addToRecentFlowers(flower) {
    // This could implement logic to track recently generated flowers
    // and ensure diversity in the game grid
}

// Function to reset generated flowers
function resetGeneratedFlowers() {
    generatedFlowers.length = 0; // Clear the array
    generationCounter = 0; // Reset the counter
    
    // Also reset recent colors tracking
    for (const category in recentColors) {
        recentColors[category] = [];
    }
    
    // Reset palette uniqueness tracking if it exists
    if (window.resetUsedPalettes) {
        window.resetUsedPalettes();
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

/**
 * Generate bee-attractive colors with given variation
 * @param {number} variation - base hue variation
 * @returns {object} color palette
 */
function generateBeeAttractiveColors(variation = 0) {
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
                    scheme: 'bee-attractive'
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
        // Bees are particularly attracted to blue, purple, violet, and yellow
        const baseHue = variation % 360;
        const bluesAndPurples = [240, 270, 300]; // Blue to violet range
        const yellows = [45, 60]; // Yellow range
        
        const hue = Math.random() > 0.5 ? 
            bluesAndPurples[Math.floor(Math.random() * bluesAndPurples.length)] : 
            yellows[Math.floor(Math.random() * yellows.length)];
        
        const primary = hslToHex(hue, 85, 50);
        const secondary = hslToHex((hue + 30) % 360, 75, 60);
        const accent = hslToHex((hue + 150) % 360, 80, 45);
        const accentDark = hslToHex((hue + 150) % 360, 85, 35);
        const stem = hslToHex(120, 50, 30);
        const leaf = hslToHex(100, 55, 35);
        const stamen = hslToHex((hue + 180) % 360, 90, 70);
        
        const colors = {
            primary,
            secondary,
            accent,
            accentDark,
            stem,
            leaf,
            stamen,
            scheme: 'bee-attractive'
        };
        
        // Check if this exact palette has been used before
        if (!isPaletteUsed(colors)) {
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
                // Mark palette as used before returning
                markPaletteAsUsed(colors);
                
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
        }
        
        attempts++;
    }
    
    // If all attempts fail, return a standard harmonious palette
    return generateHarmoniousColors();
}

/**
 * Generate butterfly-attractive colors with given variation
 * @param {number} variation - base hue variation
 * @returns {object} color palette
 */
function generateButterflyAttractiveColors(variation = 0) {
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
                    scheme: 'butterfly-attractive'
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
        // Butterflies are particularly attracted to bright red, orange, yellow, pink, and purple
        const warmHues = [0, 15, 30, 45, 60]; // Red to yellow range
        const coolHues = [270, 285, 300, 315, 330]; // Pink to purple range
        
        const hue = Math.random() > 0.5 ? 
            warmHues[Math.floor(Math.random() * warmHues.length)] : 
            coolHues[Math.floor(Math.random() * coolHues.length)];
        
        const primary = hslToHex(hue, 90, 60);
        const secondary = hslToHex((hue + 30) % 360, 80, 70);
        const accent = hslToHex((hue + 150) % 360, 85, 55);
        const accentDark = hslToHex((hue + 150) % 360, 90, 45);
        const stem = hslToHex(120, 50, 30);
        const leaf = hslToHex(100, 55, 35);
        const stamen = hslToHex((hue + 180) % 360, 95, 75);
        
        const colors = {
            primary,
            secondary,
            accent,
            accentDark,
            stem,
            leaf,
            stamen,
            scheme: 'butterfly-attractive'
        };
        
        // Check if this exact palette has been used before
        if (!isPaletteUsed(colors)) {
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
                // Mark palette as used before returning
                markPaletteAsUsed(colors);
                
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
        }
        
        attempts++;
    }
    
    // If all attempts fail, return a standard harmonious palette
    return generateHarmoniousColors();
}

/**
 * Generate aggressive colors with given variation
 * @param {number} variation - base hue variation
 * @returns {object} color palette
 */
function generateAggressiveColors(variation = 0) {
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
                    scheme: 'aggressive'
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
        // Aggressive colors tend to be high contrast - reds, oranges, darks
        const redHues = [0, 15, 30]; // Red to orange-red range
        
        const hue = redHues[Math.floor(Math.random() * redHues.length)];
        
        const primary = hslToHex(hue, 95, 50);
        const secondary = hslToHex((hue + 30) % 360, 85, 40);
        const accent = hslToHex((hue + 180) % 360, 90, 30); // Complementary for contrast
        const accentDark = hslToHex((hue + 180) % 360, 95, 20);
        const stem = hslToHex(120, 40, 25); // More muted stem
        const leaf = hslToHex(100, 45, 30);
        const stamen = hslToHex((hue + 180) % 360, 100, 60); // Bright contrasting stamen
        
        const colors = {
            primary,
            secondary,
            accent,
            accentDark,
            stem,
            leaf,
            stamen,
            scheme: 'aggressive'
        };
        
        // Check if this exact palette has been used before
        if (!isPaletteUsed(colors)) {
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
                // Mark palette as used before returning
                markPaletteAsUsed(colors);
                
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
        }
        
        attempts++;
    }
    
    // If all attempts fail, return a standard harmonious palette
    return generateHarmoniousColors();
}

/**
 * Generate insect-attractive colors with given variation
 * @param {number} variation - base hue variation
 * @returns {object} color palette
 */
function generateInsectAttractiveColors(variation = 0) {
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
                    scheme: 'insect-attractive'
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
        // Combination of bee and butterfly attractive colors
        const hue = (variation + (Math.random() > 0.5 ? 0 : 180)) % 360;
        
        const primary = hslToHex(hue, 85, 55);
        const secondary = hslToHex((hue + 30) % 360, 75, 65);
        const accent = hslToHex((hue + 150) % 360, 80, 50);
        const accentDark = hslToHex((hue + 150) % 360, 85, 40);
        const stem = hslToHex(120, 50, 30);
        const leaf = hslToHex(100, 55, 35);
        const stamen = hslToHex((hue + 180) % 360, 90, 70);
        
        const colors = {
            primary,
            secondary,
            accent,
            accentDark,
            stem,
            leaf,
            stamen,
            scheme: 'insect-attractive'
        };
        
        // Check if this exact palette has been used before
        if (!isPaletteUsed(colors)) {
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
                // Mark palette as used before returning
                markPaletteAsUsed(colors);
                
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
        }
        
        attempts++;
    }
    
    // If all attempts fail, return a standard harmonious palette
    return generateHarmoniousColors();
}

// Palette uniqueness functions (these would normally be imported from palette-manager.js)
// For now, define basic implementations
function isPaletteUsed(colors) {
    // Placeholder implementation - in actual code this would check against a set of used palettes
    return false;
}

function markPaletteAsUsed(colors) {
    // Placeholder implementation - in actual code this would record the palette as used
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
 * Check if colors pass diversity requirements
 * @param {object} colors - Object containing color properties
 * @returns {boolean} True if colors pass diversity check
 */
function passesDiversityCheck(colors) {
    // Check if any two colors are too similar
    const colorKeys = ['primary', 'secondary', 'accent', 'accentDark', 'stem', 'leaf', 'stamen'];
    for (let i = 0; i < colorKeys.length; i++) {
        for (let j = i + 1; j < colorKeys.length; j++) {
            // Create a temporary array with one color to compare against
            if (isColorTooSimilar(colors[colorKeys[i]], [colors[colorKeys[j]]])) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Get all generated flowers
 * @returns {Array} Array of generated flower objects
 */
function getAllFlowersWithGenerated() {
    return [...generatedFlowers];
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
        generateRandomFlowerBatch(count); // Call the named function
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