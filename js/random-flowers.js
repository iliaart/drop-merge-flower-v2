// Random Flower Generation Module for the game
import { rand } from './utils.js';
import { getAllFlowers } from './flowers.js';

// Store generated flowers during gameplay
let generatedFlowers = [];

// Track recently used colors to ensure diversity - теперь используем из менеджера
let recentColors = {
    primary: [],
    secondary: [],
    accent: [],
    accentDark: [],
    stem: [],
    leaf: [],
    stamen: []
};

// Queue of recently generated flowers to ensure neighbor diversity
let recentFlowersQueue = [];

// Counter for tracking generation order
let generationCounter = 0;

// Maximum number of recent colors to track for diversity
const MAX_RECENT_COLORS = 10;

// Maximum number of flowers to track in the queue for neighbor diversity
const MAX_RECENT_FLOWERS = 3;

/**
 * Check if a color is too similar to recently used colors
 */
function isColorTooSimilar(newColor, recentColorsList) {
    // Local implementation since we can't rely on centralized manager to avoid recursion
    if (recentColorsList.length === 0) return false;
    
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
        if (distance < 40) return true; // Reduced threshold for better variety
    }
    
    return false;
}

/**
 * Check if a flower's color palette is too similar to any of the recent flowers in the queue
 * @param {object} newFlower - The new flower to check
 * @param {Array} recentFlowers - Array of recent flowers to compare against
 * @returns {boolean} - True if the new flower is too similar to any recent flower, false otherwise
 */
function isFlowerTooSimilarToNeighbors(newFlower, recentFlowers) {
    if (recentFlowers.length === 0) return false;
    
    // Define a tolerance for color similarity (lower = more diverse)
    const similarityThreshold = 120; // Lower value means stricter diversity requirement
    
    for (const recentFlower of recentFlowers) {
        // Calculate the overall similarity between the two flowers' color palettes
        const similarityScore = calculateFlowerColorSimilarity(newFlower, recentFlower);
        if (similarityScore > similarityThreshold) {
            return true; // Flowers are too similar
        }
    }
    
    return false;
}

/**
 * Calculate similarity between two flower color palettes
 * @param {object} flower1 - First flower
 * @param {object} flower2 - Second flower
 * @returns {number} - Similarity score (higher means more similar)
 */
function calculateFlowerColorSimilarity(flower1, flower2) {
    // Calculate distances between corresponding colors in both flowers
    const primaryDistance = getColorDistance(flower1.petalColor, flower2.petalColor);
    const secondaryDistance = getColorDistance(flower1.petalColor2, flower2.petalColor2);
    const accentDistance = getColorDistance(flower1.centerColor, flower2.centerColor);
    const accentDarkDistance = getColorDistance(flower1.centerColor2, flower2.centerColor2);
    const stemDistance = getColorDistance(flower1.stemColor, flower2.stemColor);
    const leafDistance = getColorDistance(flower1.leafColor, flower2.leafColor);
    const stamenDistance = getColorDistance(flower1.stamenColor, flower2.stamenColor);
    
    // Return the average distance - lower average means more similar flowers
    return (primaryDistance + secondaryDistance + accentDistance + accentDarkDistance + 
            stemDistance + leafDistance + stamenDistance) / 7;
}

/**
 * Calculate Euclidean distance between two hex colors
 * @param {string} color1 - First color in hex format
 * @param {string} color2 - Second color in hex format
 * @returns {number} - Distance between colors
 */
function getColorDistance(color1, color2) {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    // Calculate Euclidean distance in RGB space
    return Math.sqrt(
        Math.pow(r1 - r2, 2) +
        Math.pow(g1 - g2, 2) +
        Math.pow(b1 - b2, 2)
    );
}

/**
 * Add flower to recent flowers queue for neighbor diversity tracking
 * @param {object} flower - The flower to add to the queue
 */
function addToRecentFlowers(flower) {
    recentFlowersQueue.unshift({
        petalColor: flower.petalColor,
        petalColor2: flower.petalColor2,
        centerColor: flower.centerColor,
        centerColor2: flower.centerColor2,
        stemColor: flower.stemColor,
        leafColor: flower.leafColor,
        stamenColor: flower.stamenColor
    });
    if (recentFlowersQueue.length > MAX_RECENT_FLOWERS) {
        recentFlowersQueue.pop();
    }
}

/**
 * Add color to recent colors list
 */
function addToRecentColors(colorType, color) {
    // Local implementation to avoid recursion issues
    recentColors[colorType].unshift(color);
    if (recentColors[colorType].length > MAX_RECENT_COLORS) {
        recentColors[colorType].pop();
    }
}

/**
 * Generate harmonious color palette from loaded 1000.json palettes
 * @returns {object} color palette with primary, secondary, accent, etc.
 */
function generateHarmoniousColorsFromPalette() {
    // Use the centralized palette manager to get unique palette
    if (typeof window.getUniquePaletteFromJson === 'function') {
        try {
            return window.getUniquePaletteFromJson();
        } catch (e) {
            console.warn('Centralized palette manager failed, falling back to local algorithm:', e);
            // Continue with local algorithm below
        }
    }
    
    // Fallback to old generation if no centralized manager or if it fails
    // Try multiple times to find a palette with diverse colors
    let attempts = 0;
    const maxAttempts = 15; // Increased attempts to find diverse palette
    
    while (attempts < maxAttempts) {
        // Pick a random palette from the loaded ones (fallback - not using centralized manager)
        if (typeof window.colorPalettes !== 'undefined' && window.colorPalettes.length > 0) {
            const palette = [...window.colorPalettes[Math.floor(Math.random() * window.colorPalettes.length)]];
            
            // Ensure we have at least 5 colors, repeat if needed
            while (palette.length < 5) {
                palette.push(palette[Math.floor(Math.random() * palette.length)]);
            }
            
            // Assign colors to different parts of the flower
            const primary = palette[0];
            const secondary = palette[1];
            const accent = palette[2];
            const accentDark = palette[3];
            // Generate complementary stem and leaf colors based on the palette
            const stem = generateComplementaryColor(primary, secondary, 'stem');
            const leaf = generateComplementaryColor(secondary, accent, 'leaf');
            const stamen = generateComplementaryColor(accent, primary, 'stamen');
            
            // Check if any of these colors are too similar to recently used ones
            if (
                !isColorTooSimilar(primary, recentColors.primary) &&
                !isColorTooSimilar(secondary, recentColors.secondary) &&
                !isColorTooSimilar(accent, recentColors.accent) &&
                !isColorTooSimilar(accentDark, recentColors.accentDark) &&
                !isColorTooSimilar(stem, recentColors.stem) &&
                !isColorTooSimilar(leaf, recentColors.leaf) &&
                !isColorTooSimilar(stamen, recentColors.stamen)
            ) {
                // Create a temporary flower object to check neighbor diversity
                const tempFlower = {
                    petalColor: primary,
                    petalColor2: secondary,
                    centerColor: accent,
                    centerColor2: accentDark,
                    stemColor: stem,
                    leafColor: leaf,
                    stamenColor: stamen
                };
                
                // Check if this flower is too similar to recent neighbors
                if (!isFlowerTooSimilarToNeighbors(tempFlower, recentFlowersQueue)) {
                    // Add these colors to recent colors tracking
                    addToRecentColors('primary', primary);
                    addToRecentColors('secondary', secondary);
                    addToRecentColors('accent', accent);
                    addToRecentColors('accentDark', accentDark);
                    addToRecentColors('stem', stem);
                    addToRecentColors('leaf', leaf);
                    addToRecentColors('stamen', stamen);
                    
                    return {
                        primary,
                        secondary,
                        accent,
                        accentDark,
                        stem,
                        leaf,
                        stamen,
                        scheme: 'harmonious-from-palette'
                    };
                }
            }
        } else {
            // If no palettes loaded, use algorithmic generation
            return generateHarmoniousColors();
        }
        
        attempts++;
    }
    
    // If we couldn't find a diverse palette, generate a new one algorithmically
    return generateHarmoniousColors();
}

/**
 * Generate harmonious color palette based on color theory (fallback)
 * @returns {object} color palette with primary, secondary, accent, etc.
 */
function generateHarmoniousColors() {
    // Use centralized palette manager if available, otherwise use local algorithm
    if (typeof window.getUniquePaletteFromJson === 'function') {
        try {
            return window.getUniquePaletteFromJson();
        } catch (e) {
            console.warn('Centralized palette manager failed, falling back to local algorithm:', e);
            // Continue with local algorithm below
        }
    }
    
    // Otherwise use the original algorithm
    // Try multiple times to find diverse colors
    let attempts = 0;
    const maxAttempts = 15; // Increased attempts to find diverse palette

    while (attempts < maxAttempts) {
        // Generate a base hue for the flower
        const baseHue = Math.floor(Math.random() * 360);
        
        // Create harmonious colors using color theory
        const primary = hslToHex(baseHue, 70 + Math.random() * 30, 40 + Math.random() * 30); // Base color
        const secondary = hslToHex((baseHue + 30) % 360, 60 + Math.random() * 35, 45 + Math.random() * 25); // Analogous
        const accent = hslToHex((baseHue + 180) % 360, 65 + Math.random() * 30, 50 + Math.random() * 20); // Complementary
        const accentDark = hslToHex((baseHue + 180) % 360, 70 + Math.random() * 25, 30 + Math.random() * 20); // Darker complement
        const stem = hslToHex(120, 40 + Math.random() * 20, 25 + Math.random() * 15); // Green tones for stem
        const leaf = hslToHex(100, 45 + Math.random() * 20, 30 + Math.random() * 15); // Green tones for leaves
        const stamen = hslToHex((baseHue + 150) % 360, 80 + Math.random() * 15, 60 + Math.random() * 20); // Contrasting stamen
        
        // Check if any of these colors are too similar to recently used ones
        if (
            !isColorTooSimilar(primary, recentColors.primary) &&
            !isColorTooSimilar(secondary, recentColors.secondary) &&
            !isColorTooSimilar(accent, recentColors.accent) &&
            !isColorTooSimilar(accentDark, recentColors.accentDark) &&
            !isColorTooSimilar(stem, recentColors.stem) &&
            !isColorTooSimilar(leaf, recentColors.leaf) &&
            !isColorTooSimilar(stamen, recentColors.stamen)
        ) {
            // Create a temporary flower object to check neighbor diversity
            const tempFlower = {
                petalColor: primary,
                petalColor2: secondary,
                centerColor: accent,
                centerColor2: accentDark,
                stemColor: stem,
                leafColor: leaf,
                stamenColor: stamen
            };
            
            // Check if this flower is too similar to recent neighbors
            if (!isFlowerTooSimilarToNeighbors(tempFlower, recentFlowersQueue)) {
                // Add these colors to recent colors tracking
                addToRecentColors('primary', primary);
                addToRecentColors('secondary', secondary);
                addToRecentColors('accent', accent);
                addToRecentColors('accentDark', accentDark);
                addToRecentColors('stem', stem);
                addToRecentColors('leaf', leaf);
                addToRecentColors('stamen', stamen);
                
                return {
                    primary,
                    secondary,
                    accent,
                    accentDark,
                    stem,
                    leaf,
                    stamen,
                    scheme: 'harmonious-theory'
                };
            }
        }
        
        attempts++;
    }
    
    // If all else fails, return completely random colors
    return generateRandomColors();
}

/**
 * Generate random colors as a last resort
 * @returns {object} color palette with primary, secondary, accent, etc.
 */
function generateRandomColors() {
    const colors = {
        primary: hslToHex(Math.random() * 360, 70 + Math.random() * 30, 40 + Math.random() * 30),
        secondary: hslToHex(Math.random() * 360, 60 + Math.random() * 35, 45 + Math.random() * 25),
        accent: hslToHex(Math.random() * 360, 65 + Math.random() * 30, 50 + Math.random() * 20),
        accentDark: hslToHex(Math.random() * 360, 70 + Math.random() * 25, 30 + Math.random() * 20),
        stem: hslToHex(120, 40 + Math.random() * 20, 25 + Math.random() * 15),
        leaf: hslToHex(100, 45 + Math.random() * 20, 30 + Math.random() * 15),
        stamen: hslToHex(Math.random() * 360, 80 + Math.random() * 15, 60 + Math.random() * 20)
    };
    
    // Use local implementation to add colors to recent colors tracking
    addToRecentColors('primary', colors.primary);
    addToRecentColors('secondary', colors.secondary);
    addToRecentColors('accent', colors.accent);
    addToRecentColors('accentDark', colors.accentDark);
    addToRecentColors('stem', colors.stem);
    addToRecentColors('leaf', colors.leaf);
    addToRecentColors('stamen', colors.stamen);
    
    return {
        ...colors,
        scheme: 'random'
    };
}

/**
 * Convert HSL to Hex color
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Hex color string
 */
function hslToHex(h, s, l) {
    // Local implementation to avoid potential recursion issues
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate a random hex color
 * @returns {string} Random hex color
 */
function randomHexColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

/**
 * Generate complementary color based on two input colors
 * @param {string} color1 - First color in HEX format
 * @param {string} color2 - Second color in HEX format
 * @param {string} type - Type of color to generate ('stem', 'leaf', 'stamen')
 * @returns {string} Generated complementary color
 */
function generateComplementaryColor(color1, color2, type = 'stem') {
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
        // Generate a greenish tone based on average values
        r = Math.min(100, Math.floor((r1 + r2) / 2 * 0.3));
        g = Math.min(255, Math.floor((g1 + g2) / 2 * 1.2));
        b = Math.min(100, Math.floor((b1 + b2) / 2 * 0.3));
    } else if (type === 'leaf') {
        // Generate another green tone with variation
        r = Math.min(80, Math.floor((r1 + r2) / 2 * 0.4));
        g = Math.min(255, Math.floor((g1 + g2) / 2 * 1.1));
        b = Math.min(80, Math.floor((b1 + b2) / 2 * 0.4));
    } else { // stamen
        // Generate a bright color that contrasts with the main colors
        r = Math.min(255, 255 - Math.floor(r1 * 0.7));
        g = Math.min(255, 255 - Math.floor(g1 * 0.5));
        b = Math.min(255, 255 - Math.floor(b1 * 0.7));
    }
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Calculate harmony between two colors
 * @param {string} color1 - First color in HEX format
 * @param {string} color2 - Second color in HEX format
 * @returns {number} Harmony score (0-100)
 */
function calculateColorHarmony(color1, color2) {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    // Calculate Euclidean distance in RGB space
    const distance = Math.sqrt(
        Math.pow(r1 - r2, 2) +
        Math.pow(g1 - g2, 2) +
        Math.pow(b1 - b2, 2)
    );
    
    // Normalize to 0-100 scale where 100 is maximum harmony (minimum distance)
    const maxDistance = Math.sqrt(3 * Math.pow(255, 2)); // ~441.67
    return 100 - (distance / maxDistance * 100);
}

/**
 * Evaluate overall harmony of a color palette
 * @param {object} colors - color object with primary, secondary, accent, etc.
 * @returns {number} - harmony score (0-100)
 */
function evaluatePaletteHarmony(colors) {
    const colorArray = [colors.primary, colors.secondary, colors.accent, colors.accentDark];
    let totalScore = 0;
    let comparisons = 0;
    
    // Compare each color with every other color
    for (let i = 0; i < colorArray.length; i++) {
        for (let j = i + 1; j < colorArray.length; j++) {
            const harmony = calculateColorHarmony(colorArray[i], colorArray[j]);
            totalScore += harmony;
            comparisons++;
        }
    }
    
    return comparisons > 0 ? totalScore / comparisons : 0;
}

/**
 * Check if color combination passes diversity criteria
 * @param {object} colors - color object with primary, secondary, accent, etc.
 * @returns {boolean} - true if passes, false otherwise
 */
function passesDiversityCheck(colors) {
    // Check if the palette has good overall harmony score
    const harmonyScore = evaluatePaletteHarmony(colors);
    
    // We want moderately diverse but harmonious colors
    if (harmonyScore < 30 || harmonyScore > 80) {
        return false; // Too similar or too different
    }
    
    // Check if any colors are too close to black or white (extreme values)
    const extremeColors = [colors.primary, colors.secondary, colors.accent, colors.accentDark]
        .map(color => {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            // Check if color is too close to black (all values < 30) or white (all values > 225)
            return (r < 30 && g < 30 && b < 30) || (r > 225 && g > 225 && b > 225);
        })
        .some(isExtreme => isExtreme);
    
    return !extremeColors;
}

/**
 * Generate enhanced colors for flowers with different methods
 * @param {object} options - options for color generation
 * @returns {object} color palette with primary, secondary, accent, etc.
 */
function generateEnhancedColors(options = {}) {
    // Default to insect-attractive colors
    const method = options.method || 'insect-attractive';
    const intensity = options.intensity || 'medium';
    const variation = options.variation || Math.random() * 360;
    
    switch(method) {
        case 'bee-friendly':
            return generateBeeAttractiveColors(variation);
        case 'butterfly-friendly':
            return generateButterflyAttractiveColors(variation);
        case 'aggressive':
            return generateAggressiveColors(variation);
        case 'insect-attractive':
        default:
            if (intensity === 'high') {
                return generateAggressiveColors(variation);
            } else {
                return generateInsectAttractiveColors(variation);
            }
    }
}

/**
 * Generate bee-attractive colors with given variation
 * @param {number} variation - base hue variation
 * @returns {object} color palette
 */
function generateBeeAttractiveColors(variation = 0) {
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
    
    return {
        primary,
        secondary,
        accent,
        accentDark,
        stem,
        leaf,
        stamen,
        scheme: 'bee-attractive'
    };
}

/**
 * Generate butterfly-attractive colors with given variation
 * @param {number} variation - base hue variation
 * @returns {object} color palette
 */
function generateButterflyAttractiveColors(variation = 0) {
    // Butterflies are attracted to red, orange, yellow, pink, and purple
    const redsAndOranges = [0, 15, 30]; // Red to orange range
    const pinksAndPurples = [330, 345, 300]; // Pink to purple range
    
    const hue = Math.random() > 0.5 ? 
        redsAndOranges[Math.floor(Math.random() * redsAndOranges.length)] : 
        pinksAndPurples[Math.floor(Math.random() * pinksAndPurples.length)];
    
    const primary = hslToHex(hue, 80, 55);
    const secondary = hslToHex((hue + 45) % 360, 70, 65);
    const accent = hslToHex((hue + 120) % 360, 85, 50);
    const accentDark = hslToHex((hue + 120) % 360, 90, 40);
    const stem = hslToHex(120, 45, 25);
    const leaf = hslToHex(100, 50, 30);
    const stamen = hslToHex((hue + 180) % 360, 95, 75);
    
    return {
        primary,
        secondary,
        accent,
        accentDark,
        stem,
        leaf,
        stamen,
        scheme: 'butterfly-attractive'
    };
}

/**
 * Generate aggressive/vibrant colors with given variation
 * @param {number} variation - base hue variation
 * @returns {object} color palette
 */
function generateAggressiveColors(variation = 0) {
    // High saturation and contrast colors
    const hue = variation % 360;
    
    const primary = hslToHex(hue, 95, 60);
    const secondary = hslToHex((hue + 60) % 360, 90, 70);
    const accent = hslToHex((hue + 180) % 360, 95, 50);
    const accentDark = hslToHex((hue + 180) % 360, 100, 35);
    const stem = hslToHex(120, 60, 20);
    const leaf = hslToHex(100, 65, 25);
    const stamen = hslToHex((hue + 30) % 360, 100, 80);
    
    return {
        primary,
        secondary,
        accent,
        accentDark,
        stem,
        leaf,
        stamen,
        scheme: 'aggressive'
    };
}

/**
 * Generate insect-attractive colors with given variation
 * @param {number} variation - base hue variation
 * @returns {object} color palette
 */
function generateInsectAttractiveColors(variation = 0) {
    // Combination of bee and butterfly attractive colors
    const hue = (variation + (Math.random() > 0.5 ? 0 : 180)) % 360;
    
    const primary = hslToHex(hue, 85, 55);
    const secondary = hslToHex((hue + 30) % 360, 75, 65);
    const accent = hslToHex((hue + 150) % 360, 80, 50);
    const accentDark = hslToHex((hue + 150) % 360, 85, 40);
    const stem = hslToHex(120, 50, 30);
    const leaf = hslToHex(100, 55, 35);
    const stamen = hslToHex((hue + 180) % 360, 90, 70);
    
    return {
        primary,
        secondary,
        accent,
        accentDark,
        stem,
        leaf,
        stamen,
        scheme: 'insect-attractive'
    };
}

/**
 * Get a random center pattern for flowers
 * @returns {string} Pattern name
 */
function getRandomCenterPattern() {
    const patterns = ['none', 'triangles', 'squares', 'pentagons', 'diamonds', 'cells', 'stars'];
    return patterns[Math.floor(Math.random() * patterns.length)];
}

/**
 * Generate a random flower with harmonious colors from 1000.json palettes
 * @returns {object} Random flower object
 */
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

    const petalColor = colors.primary;
    const petalColor2 = colors.secondary;
    const centerColor = colors.accent;
    const centerColor2 = colors.accentDark;
    const stemColor = colors.stem;
    const leafColor = colors.leaf;
    
    const stamenTypes = ['simple', 'filament', 'clustered', 'spiral', 'brush', 'prominent', 'minimal', 'exotic', 'glass', 'jewel'];
    const stamenType = stamenTypes[Math.floor(Math.random() * stamenTypes.length)];
    
    // Randomly decide whether to include stamens or not (20% chance to have no stamens)
    const hasStamens = Math.random() > 0.2;
    const stamenCount = hasStamens ? Math.floor(rand(3, 16)) : 0;
    const stamenLen = hasStamens ? parseFloat(rand(0.15, 0.5).toFixed(2)) : 0;
    const stamenColor = hasStamens ? colors.stamen : colors.accent; // Use accent color if no stamens
    
    const antherSize = hasStamens ? parseFloat(rand(0.7, 1.5).toFixed(1)) : 1.0;

    // Define available center patterns including our new ones
    const centerPatterns = ['none', 'triangles', 'squares', 'pentagons', 'diamonds', 'cells', 'stars'];
    let centerPattern;
    
    // For insectoid type, always use 'none' pattern (no tessellation)
    if (flowerType === 'insectoid') {
        centerPattern = 'none';
    } else {
        centerPattern = centerPatterns[Math.floor(Math.random() * centerPatterns.length)];
    }

    // Randomly determine if this flower should have outlines on some petals (60% chance)
    const hasOutlines = Math.random() < 0.6;
    // Randomly determine if this flower should have center tessellation (70% chance)
    const hasTessellation = Math.random() < 0.7;

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
        hasStamens,
        centerPattern,      // Add the center pattern property
        hasTessellation,    // Add the tessellation flag
        hasOutlines,        // Add the outlines flag
        generationNumber: ++generationCounter  // Add the generation number
    };

    return flower;
}

/**
 * Generate a batch of random flowers
 * @param {number} count - Number of flowers to generate
 */
function generateRandomFlowerBatch(count) {
    for (let i = 0; i < count; i++) {
        const flower = generateRandomFlower();
        generatedFlowers.push(flower);
        // Add to recent flowers queue to ensure neighbor diversity
        addToRecentFlowers(flower);
    }
    
    // Automatically log flower info if we've generated 50 flowers
    if (count === 50) {
        setTimeout(() => {
            logGeneratedFlowers();
        }, 100); // Delay to ensure all flowers are processed
    }
}

/**
 * Get all generated flowers
 * @returns {Array} Array of generated flower objects
 */
function getAllFlowersWithGenerated() {
    return [...generatedFlowers];
}

/**
 * Log all generated flowers with their tessellation patterns and palettes to console
 */
function logGeneratedFlowers() {
    const allFlowers = getAllFlowersWithGenerated();
    
    console.log(`%c=== Сгенерированные цветы (${allFlowers.length} шт.) ===`, 'color: #4CAF50; font-weight: bold; font-size: 16px;');
    
    allFlowers.forEach((flower, index) => {
        const patternNames = {
            'none': 'Без замощения',
            'triangles': 'Треугольники',
            'squares': 'Квадраты',
            'pentagons': 'Пятиугольники',
            'diamonds': 'Ромбы',
            'cells': 'Клетки',
            'stars': 'Звезды'
        };
        
        const patternName = patternNames[flower.centerPattern] || flower.centerPattern;
        const flowerTypeName = flower.type;
        const paletteInfo = {
            'Цвет лепестков 1': flower.petalColor,
            'Цвет лепестков 2': flower.petalColor2,
            'Цвет центра 1': flower.centerColor,
            'Цвет центра 2': flower.centerColor2,
            'Цвет стебля': flower.stemColor,
            'Цвет листьев': flower.leafColor,
            'Цвет тычинок': flower.stamenColor
        };
        
        console.log(`\n%cЦветок #${flower.generationNumber} (Порядковый: ${index + 1})`, 'color: #2196F3; font-weight: bold;');
        console.log(`%c  Тип: ${flowerTypeName}`, 'color: #666;');
        console.log(`%c  Замощение: ${patternName}`, 'color: #666;');
        console.log(`%c  Радиус: ${flower.radius}, Лепестков: ${flower.petals}`, 'color: #666;');
        console.log('%c  Палитра:', 'color: #666;');
        for (const [colorName, colorValue] of Object.entries(paletteInfo)) {
            console.log(`%c    ${colorName}: ${colorValue}`, 'color: #666;');
        }
    });
    
    console.log(`\n%c=== Всего: ${allFlowers.length} цветов ===`, 'color: #4CAF50; font-weight: bold;');
}

/**
 * Reset generated flowers pool and color tracking
 */
function resetGeneratedFlowers() {
    generatedFlowers = [];
    generationCounter = 0; // Reset the generation counter as well
    // Reset the recent colors tracking to allow full color diversity again
    recentColors = {
        primary: [],
        secondary: [],
        accent: [],
        accentDark: [],
        stem: [],
        leaf: [],
        stamen: []
    };
    // Reset the recent flowers queue
    recentFlowersQueue = [];
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
}

// Initialize palettes when the module loads
// loadColorPalettes(); // Now handled by centralized manager

// Make functions available globally
if (typeof window !== 'undefined') {
    window.generateRandomFlower = generateRandomFlower;
    window.generateRandomFlowerBatch = generateRandomFlowerBatch;
    window.getAllFlowersWithGenerated = getAllFlowersWithGenerated;
    window.resetGeneratedFlowers = resetGeneratedFlowers;
    window.logGeneratedFlowers = logGeneratedFlowers; // Add the logging function to global scope
    window.colorPalettes = colorPalettes;
    window.calculateColorHarmony = calculateColorHarmony;
    window.evaluatePaletteHarmony = evaluatePaletteHarmony;
    window.passesDiversityCheck = passesDiversityCheck;
    window.generateComplementaryColor = generateComplementaryColor;
    window.hslToHex = hslToHex;
    window.isColorTooSimilar = isColorTooSimilar;
}

export {
    generateRandomFlower,
    generateRandomFlowerBatch,
    getAllFlowersWithGenerated,
    resetGeneratedFlowers,
    logGeneratedFlowers  // Export the logging function
};