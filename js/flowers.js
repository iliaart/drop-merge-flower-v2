// Flower Definitions Module
import { clamp, rgba, lighten, darken, rand, TAU } from './utils.js';

// Empty default flowers array since we're using generated flowers only
export const FLOWERS = [];

// Custom flowers loaded from JSON
let customFlowers = [];

// Known JSON flower files in the project root - теперь будет пустым массивом, чтобы не искать несуществующие файлы
const JSON_FILES = [];

// Resolve JSON file paths relative to the game's index.html
function resolveJsonPath(filename) {
    // flowers.js lives in js/, so go up one level to root
    return new URL('../' + filename, import.meta.url).href;
}

// Draw fractal petal details
function drawFractalDetails(ctx, x, y, angle, size, depth, color) {
    if (depth <= 0 || size < 2) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const branches = Math.min(3, depth + 1);
    for (let i = 0; i < branches; i++) {
        const t = (i + 1) / (branches + 1);
        const branchSize = size * (0.3 + 0.2 * (1 - t));
        const branchAngle = (i - branches / 2) * 0.4;
        ctx.save();
        ctx.translate(0, -size * t);
        ctx.rotate(branchAngle);
        const alpha = 0.3 + 0.2 * (depth - 1);
        ctx.fillStyle = rgba(color, alpha);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-branchSize * 0.3, -branchSize * 0.2, -branchSize * 0.4, -branchSize * 0.6, 0, -branchSize);
        ctx.bezierCurveTo(branchSize * 0.4, -branchSize * 0.6, branchSize * 0.3, -branchSize * 0.2, 0, 0);
        ctx.fill();
        if (depth > 1) drawFractalDetails(ctx, 0, -branchSize * 0.5, 0, branchSize * 0.5, depth - 1, color);
        ctx.restore();
    }
    ctx.restore();
}

// Auto-load all JSON flower files from root via fetch() - теперь просто возвращает 0
export async function autoLoadJsonFiles() {
    let totalLoaded = 0;
    console.log(`Skipping JSON flower loading - using only generated flowers from color palettes`);
    return totalLoaded;
}

// Load custom flowers from JSON file (manual path)
export async function loadCustomFlowers(jsonPath) {
    try {
        const response = await fetch(jsonPath);
        const data = await response.json();
        if (data.flowers && Array.isArray(data.flowers)) {
            customFlowers = data.flowers;
            console.log(`Loaded ${customFlowers.length} custom flowers`);
            return customFlowers;
        }
    } catch (error) {
        console.warn('Failed to load custom flowers:', error);
    }
    return [];
}

// Get all flowers (default + custom) - теперь будет возвращать только сгенерированные
export function getAllFlowers() {
    /** @deprecated Use getAllFlowersWithGenerated from random-flowers.js instead */
    console.error("Deprecated: use getAllFlowersWithGenerated from random-flowers.js instead");
    throw new Error("Deprecated: use getAllFlowersWithGenerated from random-flowers.js instead");
}

// Add custom flowers dynamically
export function addCustomFlowers(flowersArray) {
    if (Array.isArray(flowersArray)) {
        customFlowers = flowersArray;
        console.log(`Added ${customFlowers.length} custom flowers`);
    }
}

// Export a function that includes generated flowers as well
export function getAllFlowersWithGenerated() {
    // This function is now deprecated - should use the one from random-flowers.js
    console.error("Deprecated: use getAllFlowersWithGenerated from random-flowers.js instead");
    throw new Error("Deprecated: use getAllFlowersWithGenerated from random-flowers.js instead");
}

// Flower drawing helper functions
export function drawPetalShape(ctx, cx, cy, angle, length, width, color1, color2, highlight, fractalDepth = 0, outline = false) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const hw = length * width;

    // Gradient fill
    const g = ctx.createLinearGradient(0, 0, 0, -length);
    g.addColorStop(0, color1);
    g.addColorStop(.6, color2 || lighten(color1, .25));
    g.addColorStop(1, lighten(color1, .4));
    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-hw * .8, -length * .25, -hw, -length * .7, 0, -length);
    ctx.bezierCurveTo(hw, -length * .7, hw * .8, -length * .25, 0, 0);
    ctx.fill();

    // Subtle edge
    ctx.strokeStyle = rgba(darken(color1, .1), .2);
    ctx.lineWidth = .5;
    ctx.stroke();

    // Draw outline if requested for this petal
    if (outline) {
        ctx.strokeStyle = rgba(darken(color1, .35), .55);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-hw * .8, -length * .25, -hw, -length * .7, 0, -length);
        ctx.bezierCurveTo(hw, -length * .7, hw * .8, -length * .25, 0, 0);
        ctx.stroke();
    }

    // Vein
    if (length > 15) {
        ctx.strokeStyle = rgba(darken(color1, .12), .15);
        ctx.lineWidth = .4;
        ctx.beginPath();
        ctx.moveTo(0, -length * .08);
        ctx.quadraticCurveTo(hw * .1, -length * .5, 0, -length * .88);
        ctx.stroke();
        // Side veins
        if (length > 25) {
            for (let v = .3; v < .7; v += .2) {
                ctx.beginPath();
                ctx.moveTo(0, -length * v);
                ctx.quadraticCurveTo(hw * .3, -length * (v + .1), hw * .4, -length * (v + .05));
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, -length * v);
                ctx.quadraticCurveTo(-hw * .3, -length * (v + .1), -hw * .4, -length * (v + .05));
                ctx.stroke();
            }
        }
    }

    // Highlight
    if (highlight !== false) {
        const hg = ctx.createLinearGradient(-hw * .2, -length * .5, hw * .2, -length * .2);
        hg.addColorStop(0, 'rgba(255,255,255,0.22)');
        hg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-hw * .5, -length * .2, -hw * .6, -length * .6, 0, -length * .85);
        ctx.bezierCurveTo(hw * .3, -length * .5, hw * .2, -length * .15, 0, 0);
        ctx.fill();
    }

    // Draw fractal details if depth > 0
    if (fractalDepth > 0) {
        drawFractalDetails(ctx, 0, -length * 0.3, 0, length * 0.6, fractalDepth, color1);
    }

    ctx.restore();
}

export function drawLeaf(ctx, x, y, angle, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const w = size * .35, h = size;

    const g = ctx.createLinearGradient(0, 0, 0, -h);
    g.addColorStop(0, darken(color, .1));
    g.addColorStop(.5, color);
    g.addColorStop(1, lighten(color, .3));
    ctx.fillStyle = g;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(w, -h * .3, w * .8, -h * .7, 0, -h);
    ctx.bezierCurveTo(-w * .8, -h * .7, -w, -h * .3, 0, 0);
    ctx.fill();
    
    ctx.strokeStyle = rgba(darken(color, .3), .3);
    ctx.lineWidth = .5;
    ctx.stroke();
    
    ctx.restore();
}