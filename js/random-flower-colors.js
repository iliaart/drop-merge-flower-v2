// Random Flower Colors Module for the game
import { hslToHex } from './utils-wrapper.mjs';

// Track recently used colors to ensure diversity
let recentColors = {
    primary: [],
    secondary: [],
    accent: [],
    accentDark: [],
    stem: [],
    leaf: [],
    stamen: []
};

// Maximum number of recent colors to track for diversity
const MAX_RECENT_COLORS = 10;

/**
 * Check if a color is too similar to recently used colors
 */
function isColorTooSimilar(newColor, recentColorsList) {
    // Add recursion depth protection
    if (isColorTooSimilar.callCount === undefined) {
        isColorTooSimilar.callCount = 0;
    }
    
    isColorTooSimilar.callCount++;
    if (isColorTooSimilar.callCount > 100) { // Prevent stack overflow
        console.error('Recursion depth exceeded in isColorTooSimilar');
        isColorTooSimilar.callCount = 0;
        return false; // Return safe value to prevent infinite loop
    }
    
    // Use centralized function if available
    if (typeof window.isColorTooSimilar === 'function' && isColorTooSimilar.callCount <= 1) {
        // This function expects the centralized version which compares one color against a list
        const result = window.isColorTooSimilar(newColor, recentColorsList);
        isColorTooSimilar.callCount--; // Decrement counter when returning
        return result;
    }
    
    // Fallback local implementation
    if (recentColorsList.length === 0) {
        isColorTooSimilar.callCount--; // Decrement counter when returning
        return false;
    }
    
    // Convert hex to RGB for comparison
    const hex = newColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    for (const color of recentColorsList) {
        const recentHex = color.replace('#', '');
        const recentR = parseInt(recentHex.substring(0, 2), 16);
        const recentG = parseInt(recentHex.substring(2, 4), 16);
        const recentB = parseInt(recentHex.substring(4, 6), 16);
        
        // Calculate color distance (Euclidean distance in RGB space)
        const distance = Math.sqrt(
            Math.pow(r - recentR, 2) +
            Math.pow(g - recentG, 2) +
            Math.pow(b - recentB, 2)
        );
        
        // If distance is small, colors are too similar
        if (distance < 40) { // Reduced threshold for better variety
            isColorTooSimilar.callCount--; // Decrement counter when returning
            return true;
        }
    }
    
    isColorTooSimilar.callCount--; // Decrement counter when returning
    return false;
}

/**
 * Add color to recent colors tracking
 */
function addToRecentColors(colorType, color) {
    // Use centralized function if available
    if (typeof window.addToRecentColors === 'function') {
        window.addToRecentColors(colorType, color);
        return;
    }
    
    // Fallback local implementation
    recentColors[colorType].unshift(color);
    if (recentColors[colorType].length > MAX_RECENT_COLORS) {
        recentColors[colorType].pop();
    }
}

/**
 * Generate random colors
 */
function generateRandomColors() {
    // Use centralized function if available
    if (typeof window.generateRandomColors === 'function') {
        return window.generateRandomColors();
    }
    
    // Fallback local implementation
    const colors = {
        primary: hslToHex(Math.random() * 360, 70 + Math.random() * 30, 40 + Math.random() * 30),
        secondary: hslToHex(Math.random() * 360, 60 + Math.random() * 35, 45 + Math.random() * 25),
        accent: hslToHex(Math.random() * 360, 65 + Math.random() * 30, 50 + Math.random() * 20),
        accentDark: hslToHex(Math.random() * 360, 70 + Math.random() * 25, 30 + Math.random() * 20),
        stem: hslToHex(120, 40 + Math.random() * 20, 25 + Math.random() * 15),
        leaf: hslToHex(100, 45 + Math.random() * 20, 30 + Math.random() * 15),
        stamen: hslToHex(Math.random() * 360, 80 + Math.random() * 15, 60 + Math.random() * 20)
    };
    
    // Add to recent colors
    addToRecentColors('primary', colors.primary);
    addToRecentColors('secondary', colors.secondary);
    addToRecentColors('accent', colors.accent);
    addToRecentColors('accentDark', colors.accentDark);
    addToRecentColors('stem', colors.stem);
    addToRecentColors('leaf', colors.leaf);
    addToRecentColors('stamen', colors.stamen);
    
    return colors;
}

/**
 * Generate complementary color
 */
function generateComplementaryColor(color1, color2, type = 'stem') {
    // Use centralized function if available
    if (typeof window.generateComplementaryColor === 'function') {
        return window.generateComplementaryColor(color1, color2, type);
    }
    
    // Fallback local implementation
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    let r, g, b;
    
    if (type === 'stem') {
        // Generate greenish tone based on average values
        r = Math.min(100, Math.floor((r1 + r2) / 2 * 0.3));
        g = Math.min(255, Math.floor((g1 + g2) / 2 * 1.2));
        b = Math.min(100, Math.floor((b1 + b2) / 2 * 0.3));
    } else if (type === 'leaf') {
        // Generate another green tone with variations
        r = Math.min(80, Math.floor((r1 + r2) / 2 * 0.4));
        g = Math.min(255, Math.floor((g1 + g2) / 2 * 1.1));
        b = Math.min(80, Math.floor((b1 + b2) / 2 * 0.4));
    } else { // stamen
        // Generate bright color contrasting with main colors
        r = Math.min(255, 255 - Math.floor(r1 * 0.7));
        g = Math.min(255, 255 - Math.floor(g1 * 0.5));
        b = Math.min(255, 255 - Math.floor(b1 * 0.7));
    }
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Calculate color harmony
 */
function calculateColorHarmony(colors) {
    // This is a simplified implementation
    // In a real application, this would implement more sophisticated color harmony calculations
    return 50; // Return a middle value as a placeholder
}

/**
 * Evaluate palette harmony
 */
function evaluatePaletteHarmony(colors) {
    // This is a simplified implementation
    // In a real application, this would analyze the relationships between colors in the palette
    return 60; // Return a middle value as a placeholder
}

/**
 * Check if colors pass diversity requirements
 */
function passesDiversityCheck(colors) {
    // Add recursion depth protection
    if (passesDiversityCheck.callCount === undefined) {
        passesDiversityCheck.callCount = 0;
    }
    
    passesDiversityCheck.callCount++;
    if (passesDiversityCheck.callCount > 100) { // Prevent stack overflow
        console.error('Recursion depth exceeded in passesDiversityCheck');
        passesDiversityCheck.callCount = 0;
        return true; // Allow the color to prevent infinite loop
    }
    
    // Use centralized function if available
    if (typeof window.passesDiversityCheck === 'function') {
        const result = window.passesDiversityCheck(colors);
        passesDiversityCheck.callCount--; // Decrement counter when returning
        return result;
    }
    
    // Fallback local implementation
    // Check if any two colors are too similar
    const colorKeys = ['primary', 'secondary', 'accent', 'accentDark', 'stem', 'leaf', 'stamen'];
    for (let i = 0; i < colorKeys.length; i++) {
        for (let j = i + 1; j < colorKeys.length; j++) {
            if (isColorTooSimilar(colors[colorKeys[i]], [colors[colorKeys[j]]])) {
                passesDiversityCheck.callCount--; // Decrement counter when returning
                return false;
            }
        }
    }
    
    passesDiversityCheck.callCount--; // Decrement counter when returning
    return true;
}

/**
 * Generate enhanced colors with extra diversity
 */
function generateEnhancedColors() {
    // Use centralized function if available
    if (typeof window.getUniquePaletteFromJson === 'function') {
        try {
            return window.getUniquePaletteFromJson();
        } catch (e) {
            console.warn('Centralized palette manager failed, falling back to local algorithm:', e);
        }
    }
    
    // Fallback local implementation
    return generateRandomColors();
}

/**
 * Generate bee-attractive colors
 */
function generateBeeAttractiveColors() {
    // Use centralized function if available
    if (typeof window.getUniquePaletteFromJson === 'function') {
        try {
            return window.getUniquePaletteFromJson();
        } catch (e) {
            console.warn('Centralized palette manager failed, falling back to local algorithm:', e);
        }
    }
    
    // Fallback local implementation
    // Bees are particularly attracted to blue, purple, violet, and yellow
    const baseHue = Math.random() > 0.5 ? 240 : 60; // Blues/purples or yellows
    
    const primary = hslToHex(baseHue, 85, 50);
    const secondary = hslToHex((baseHue + 30) % 360, 75, 60);
    const accent = hslToHex((baseHue + 150) % 360, 80, 45);
    const accentDark = hslToHex((baseHue + 150) % 360, 85, 35);
    const stem = hslToHex(120, 50, 30);
    const leaf = hslToHex(100, 55, 35);
    const stamen = hslToHex((baseHue + 180) % 360, 90, 70);
    
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
    
    // Add to recent colors
    addToRecentColors('primary', colors.primary);
    addToRecentColors('secondary', colors.secondary);
    addToRecentColors('accent', colors.accent);
    addToRecentColors('accentDark', colors.accentDark);
    addToRecentColors('stem', colors.stem);
    addToRecentColors('leaf', colors.leaf);
    addToRecentColors('stamen', colors.stamen);
    
    return colors;
}

/**
 * Generate butterfly-attractive colors
 */
function generateButterflyAttractiveColors() {
    // Use centralized function if available
    if (typeof window.getUniquePaletteFromJson === 'function') {
        try {
            return window.getUniquePaletteFromJson();
        } catch (e) {
            console.warn('Centralized palette manager failed, falling back to local algorithm:', e);
        }
    }
    
    // Fallback local implementation
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
    
    // Add to recent colors
    addToRecentColors('primary', colors.primary);
    addToRecentColors('secondary', colors.secondary);
    addToRecentColors('accent', colors.accent);
    addToRecentColors('accentDark', colors.accentDark);
    addToRecentColors('stem', colors.stem);
    addToRecentColors('leaf', colors.leaf);
    addToRecentColors('stamen', colors.stamen);
    
    return colors;
}

/**
 * Generate aggressive colors
 */
function generateAggressiveColors() {
    // Use centralized function if available
    if (typeof window.getUniquePaletteFromJson === 'function') {
        try {
            return window.getUniquePaletteFromJson();
        } catch (e) {
            console.warn('Centralized palette manager failed, falling back to local algorithm:', e);
        }
    }
    
    // Fallback local implementation
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
    
    // Add to recent colors
    addToRecentColors('primary', colors.primary);
    addToRecentColors('secondary', colors.secondary);
    addToRecentColors('accent', colors.accent);
    addToRecentColors('accentDark', colors.accentDark);
    addToRecentColors('stem', colors.stem);
    addToRecentColors('leaf', colors.leaf);
    addToRecentColors('stamen', colors.stamen);
    
    return colors;
}

/**
 * Generate insect-attractive colors
 */
function generateInsectAttractiveColors() {
    // Use centralized function if available
    if (typeof window.getUniquePaletteFromJson === 'function') {
        try {
            return window.getUniquePaletteFromJson();
        } catch (e) {
            console.warn('Centralized palette manager failed, falling back to local algorithm:', e);
        }
    }
    
    // Fallback local implementation
    // Combination of bee and butterfly attractive colors
    const hue = Math.random() > 0.5 ? 240 : 60; // Blues/purples or yellows
    
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
    
    // Add to recent colors
    addToRecentColors('primary', colors.primary);
    addToRecentColors('secondary', colors.secondary);
    addToRecentColors('accent', colors.accent);
    addToRecentColors('accentDark', colors.accentDark);
    addToRecentColors('stem', colors.stem);
    addToRecentColors('leaf', colors.leaf);
    addToRecentColors('stamen', colors.stamen);
    
    return colors;
}

// Export functions
export {
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
};