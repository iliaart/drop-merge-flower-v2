// Utility functions for flower generator
const TAU = Math.PI * 2;

/**
 * Clamp a value between min and max
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

/**
 * Generate random number between min and max
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function rand(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Convert color to rgba format
 * @param {string} color - hex or rgb color
 * @param {number} alpha - opacity 0-1
 * @returns {string} rgba color string
 */
function rgba(color, alpha) {
    if (!color || typeof color !== 'string') {
        return `rgba(128,128,128,${alpha})`;
    }
    if (color.startsWith('rgba')) return color;
    if (color.startsWith('rgb')) {
        const match = color.match(/(\d+)/g);
        if (!match || match.length < 3) return `rgba(128,128,128,${alpha})`;
        return `rgba(${match[0]},${match[1]},${match[2]},${alpha})`;
    }
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Lighten a color by amount
 * @param {string} color - hex or rgb color
 * @param {number} amount - 0-1 lightening factor
 * @returns {string} rgb color string
 */
function lighten(color, amount) {
    if (!color || typeof color !== 'string') {
        return '#808080';
    }
    let r, g, b;
    if (color.startsWith('rgb')) {
        const match = color.match(/(\d+)/g);
        if (!match || match.length < 3) return color;
        r = parseInt(match[0]);
        g = parseInt(match[1]);
        b = parseInt(match[2]);
    } else {
        const hex = color.replace('#', '');
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }
    r = Math.min(255, r + Math.round((255 - r) * amount));
    g = Math.min(255, g + Math.round((255 - g) * amount));
    b = Math.min(255, b + Math.round((255 - b) * amount));
    return `rgb(${r},${g},${b})`;
}

/**
 * Darken a color by amount
 * @param {string} color - hex or rgb color
 * @param {number} amount - 0-1 darkening factor
 * @returns {string} rgb color string
 */
function darken(color, amount) {
    if (!color || typeof color !== 'string') {
        return '#808080';
    }
    let r, g, b;
    if (color.startsWith('rgb')) {
        const match = color.match(/(\d+)/g);
        if (!match || match.length < 3) return color;
        r = parseInt(match[0]);
        g = parseInt(match[1]);
        b = parseInt(match[2]);
    } else {
        const hex = color.replace('#', '');
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }
    r = Math.max(0, r - Math.round(r * amount));
    g = Math.max(0, g - Math.round(g * amount));
    b = Math.max(0, b - Math.round(b * amount));
    return `rgb(${r},${g},${b})`;
}

/**
 * Simple Perlin-like noise using sine waves
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function simplexNoise(x, y) {
    return (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
}

/**
 * Convert HSL to hex color
 * @param {number} h - hue 0-360
 * @param {number} s - saturation 0-100
 * @param {number} l - lightness 0-100
 * @returns {string} hex color
 */
function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Convert RGB to HSL
 * @param {number} r - red 0-255
 * @param {number} g - green 0-255
 * @param {number} b - blue 0-255
 * @returns {Array} [h, s, l] where h is 0-360, s and l are 0-100
 */
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [h * 360, s * 100, l * 100];
}

// Make functions available globally
window.TAU = TAU;
window.clamp = clamp;
window.rand = rand;
window.rgba = rgba;
window.lighten = lighten;
window.darken = darken;
window.simplexNoise = simplexNoise;
window.hslToHex = hslToHex;
window.rgbToHsl = rgbToHsl;