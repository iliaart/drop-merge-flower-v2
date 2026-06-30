// Utility Functions Module

export const TAU = Math.PI * 2;

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

export function rand(a, b) {
    return Math.random() * (b - a) + a;
}

export function hexToRgb(hex) {
    // Handle undefined, null, or non-string inputs
    if (!hex || typeof hex !== 'string') {
        return [128, 128, 128];
    }
    
    // Handle rgb/rgba format
    if (hex.startsWith('rgb')) {
        const match = hex.match(/(\d+)/g);
        if (!match || match.length < 3) return [128, 128, 128];
        return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
    }
    
    // Handle hex format
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex, a) {
    // Handle undefined, null, or non-string inputs
    if (!hex || typeof hex !== 'string') {
        return `rgba(128,128,128,${a})`;
    }
    
    // Already rgba format
    if (hex.startsWith('rgba')) return hex;
    
    // RGB format
    if (hex.startsWith('rgb')) {
        const match = hex.match(/(\d+)/g);
        if (!match || match.length < 3) return `rgba(128,128,128,${a})`;
        return `rgba(${match[0]},${match[1]},${match[2]},${a})`;
    }
    
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
}

export function lighten(hex, amt) {
    // Handle undefined, null, or non-string inputs
    if (!hex || typeof hex !== 'string') {
        return 'rgb(128,128,128)';
    }
    const [r, g, b] = hexToRgb(hex);
    return `rgb(${clamp(r + (255 - r) * amt, 0, 255)|0},${clamp(g + (255 - g) * amt, 0, 255)|0},${clamp(b + (255 - b) * amt, 0, 255)|0})`;
}

export function darken(hex, amt) {
    // Handle undefined, null, or non-string inputs
    if (!hex || typeof hex !== 'string') {
        return 'rgb(128,128,128)';
    }
    const [r, g, b] = hexToRgb(hex);
    return `rgb(${clamp(r * (1 - amt), 0, 255)|0},${clamp(g * (1 - amt), 0, 255)|0},${clamp(b * (1 - amt), 0, 255)|0})`;
}

// Easing functions
export const ease = {
    inOutQuad: t => t < .5 ? 2*t*t : -1+(4-2*t)*t,
    outCubic:  t => 1 - Math.pow(1 - t, 3),
    outElastic: t => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10*t) * Math.sin((t - .075) * TAU / .3) + 1;
    },
    outBack: t => { const s = 1.70158; return 1 + (--t) * t * ((s+1)*t + s); },
    inQuad: t => t * t,
    outQuad: t => t * (2 - t),
};
