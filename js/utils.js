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

// Convert HSL color to HEX
export function hslToHex(h, s, l) {
    h = h / 360;
    s = s / 100;
    l = l / 100;
    
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
    
    return '#' + toHex(r) + toHex(g) + toHex(b);
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