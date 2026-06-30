// Flower Cache Module — offscreen rendering with bloom dispatch
import { getAllFlowersWithGenerated } from './random-flowers.js';
import { rgba, lighten, darken, rand, TAU } from './utils.js';
import {
    drawDaisy, drawViolet, drawTulip, drawRose, drawPeony,
    drawLily, drawOrchid, drawSunflower
} from './flower-drawers.js';
import {
    drawSimpleFlower, drawDoubleFlower, drawMultiLayerFlower,
    drawClusterFlower, drawSpiralFlower, drawRoseFlower, drawOrchidFlower
} from './custom-flower-drawers.js';

// Flower cache for offscreen rendering
const flowerCache = new Map();

/** Get or create cached offscreen canvas for a flower level */
export function getFlowerCache(level) {
    if (flowerCache.has(level)) return flowerCache.get(level);

    const allFlowers = getAllFlowersWithGenerated();
    const f = allFlowers[level];
    if (!f) return null;

    const r = f.radius;
    const pad = r * 0.4;
    const totalW = (r + pad) * 2;
    const totalH = (r + pad) * 2;
    const cx = totalW / 2, cy = totalH / 2;

    const oc = document.createElement('canvas');
    oc.width = totalW * 2;  // 2x for retina
    oc.height = totalH * 2;
    const c = oc.getContext('2d');
    c.scale(2, 2);

    // Draw bloom shadow (soft)
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.18)';
    c.shadowBlur = r * .35;
    c.shadowOffsetY = r * .08;
    c.fillStyle = 'rgba(0,0,0,0.01)';
    c.beginPath();
    c.arc(cx, cy, r * .5, 0, TAU);
    c.fill();
    c.restore();

    // Draw bloom
    drawFlowerBloom(c, cx, cy, level, f);

    const data = { canvas: oc, w: totalW, h: totalH, cx, cy };
    flowerCache.set(level, data);
    return data;
}

function drawFlowerBloom(ctx, cx, cy, level, f) {
    const r = f.radius;
    if (level >= 8) {
        drawGenericFlower(ctx, cx, cy, f, r);
        return;
    }
    switch (level) {
        case 0: drawDaisy(ctx, cx, cy, f, r); break;
        case 1: drawViolet(ctx, cx, cy, f, r); break;
        case 2: drawTulip(ctx, cx, cy, f, r); break;
        case 3: drawRose(ctx, cx, cy, f, r); break;
        case 4: drawPeony(ctx, cx, cy, f, r); break;
        case 5: drawLily(ctx, cx, cy, f, r); break;
        case 6: drawOrchid(ctx, cx, cy, f, r); break;
        case 7: drawSunflower(ctx, cx, cy, f, r); break;
    }
}

// Generic flower drawing for custom flowers with wind animation, fractals and 3D
function drawGenericFlower(ctx, cx, cy, f, r) {
    const n = f.petals;
    const flowerType = f.flowerType || 'simple';
    const fractalDepth = f.fractalDepth || 0;
    const t = performance.now() / 1000;
    // Удаляем 3D наклон - теперь всегда 0
    const tilt3D = 0;

    // Не применяем трансформацию наклона, так как tilt3D всегда 0

    // Dispatch to type-specific drawer
    const typeMap = {
        simple: drawSimpleFlower, double: drawDoubleFlower,
        multi: drawMultiLayerFlower, cluster: drawClusterFlower,
        spiral: drawSpiralFlower, rose: drawRoseFlower, orchid: drawOrchidFlower,
    };
    const drawer = typeMap[flowerType] || drawSimpleFlower;
    drawer(ctx, cx, cy, f, r, n, t, fractalDepth);

    // Draw center
    const cr = r * .225;  // Reduced from .45 to .225 to limit center size by half
    const cg = ctx.createRadialGradient(cx - cr * .2, cy - cr * .2, 0, cx, cy, cr);
    cg.addColorStop(0, lighten(f.centerColor, .2));
    cg.addColorStop(.6, f.centerColor);
    cg.addColorStop(1, f.centerColor2);
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, TAU); ctx.fill();
    
    drawCenterTessellation(ctx, cx, cy, cr, f.centerColor, f.centerColor2, f.centerPattern, t);
    
    // Draw stamens only if the flower has them and we're not in merge mode
    if (f.hasStamens && !inMergeMode) {
        drawStamens(ctx, cx, cy, cr, f.stamenColor, f.stamenCount, f.stamenLen, t);
    }
}

/**
 * Draw center tessellation based on pattern type (dispatcher)
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} cr - center radius
 * @param {string} color1 - primary center color
 * @param {string} color2 - secondary center color
 * @param {string} pattern - 'none' | 'triangles' | 'squares' | 'pentagons' | 'diamonds' | 'cells' | 'stars'
 * @param {number} t - time for animation
 */
function drawCenterTessellation(ctx, cx, cy, cr, color1, color2, pattern, t) {
    if (pattern === 'none') return;
    
    const patterns = {
        triangles: drawCenterTriangles,
        squares: drawCenterSquares,
        pentagons: drawCenterPentagons,
        diamonds: drawCenterDiamonds,
        cells: drawCenterCells,
        stars: drawCenterStars
    };
    
    const drawer = patterns[pattern] || drawCenterTriangles;
    drawer(ctx, cx, cy, cr, color1, color2, t);
}

/**
 * Draw triangular center tessellation
 */
function drawCenterTriangles(ctx, cx, cy, cr, color1, color2, t) {
    const triangles = 6;
    const timeOffset = t * 0.5; // Different animation speed for triangles
    
    for (let i = 0; i < triangles; i++) {
        const angle = (i / triangles) * TAU + timeOffset;
        const size = cr * 0.3 * (0.9 + 0.1 * Math.sin(t * 2 + i));
        
        const x1 = cx;
        const y1 = cy;
        const x2 = cx + Math.cos(angle) * size;
        const y2 = cy + Math.sin(angle) * size;
        const x3 = cx + Math.cos(angle + TAU/3) * size;
        const y3 = cy + Math.sin(angle + TAU/3) * size;
        
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = rgba(darken(color1, 0.3), 0.7);
        ctx.lineWidth = 0.5;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

/**
 * Draw square center tessellation
 */
function drawCenterSquares(ctx, cx, cy, cr, color1, color2, t) {
    const rings = 2;
    const timeOffset = t * 0.7; // Different animation speed for squares
    
    for (let ring = 1; ring <= rings; ring++) {
        const squaresPerRing = 8 * ring;
        const ringRadius = (cr * 0.7) * (ring / rings);
        
        for (let i = 0; i < squaresPerRing; i++) {
            const angle = (i / squaresPerRing) * TAU + timeOffset;
            const size = (cr * 0.2 / ring) * (0.85 + 0.15 * Math.sin(t * 3 + i));
            
            const x = cx + Math.cos(angle) * ringRadius;
            const y = cy + Math.sin(angle) * ringRadius;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle + t * 0.3);
            
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);
            
            ctx.fillStyle = gradient;
            ctx.strokeStyle = rgba(darken(color1, 0.3), 0.6);
            ctx.lineWidth = 0.4;
            
            ctx.fillRect(-size/2, -size/2, size, size);
            ctx.strokeRect(-size/2, -size/2, size, size);
            
            ctx.restore();
        }
    }
}

/**
 * Draw pentagonal center tessellation
 */
function drawCenterPentagons(ctx, cx, cy, cr, color1, color2, t) {
    const pentagons = 5;
    const timeOffset = t * 0.4; // Different animation speed for pentagons
    
    for (let i = 0; i < pentagons; i++) {
        const angle = (i / pentagons) * TAU + timeOffset;
        const size = cr * 0.25 * (0.92 + 0.08 * Math.sin(t * 2.5 + i));
        const distance = cr * 0.4;
        
        const centerX = cx + Math.cos(angle) * distance;
        const centerY = cy + Math.sin(angle) * distance;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(t * 0.2 + i);
        
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
            const vertexAngle = (j / 5) * TAU - Math.PI / 2;
            const x = Math.cos(vertexAngle) * size;
            const y = Math.sin(vertexAngle) * size;
            
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = rgba(darken(color1, 0.3), 0.75);
        ctx.lineWidth = 0.6;
        
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Center pentagon
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.3);
    
    ctx.beginPath();
    for (let j = 0; j < 5; j++) {
        const vertexAngle = (j / 5) * TAU - Math.PI / 2;
        const x = Math.cos(vertexAngle) * (cr * 0.15);
        const y = Math.sin(vertexAngle) * (cr * 0.15);
        
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    ctx.fillStyle = color2;
    ctx.strokeStyle = rgba(darken(color1, 0.4), 0.8);
    ctx.lineWidth = 0.8;
    
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
}

/**
 * Draw diamond center tessellation
 */
function drawCenterDiamonds(ctx, cx, cy, cr, color1, color2, t) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, TAU);
    ctx.clip();

    // Use random number of rays (3, 5, 6, 7, 8, or 9) to avoid 4-ray symmetry that resembles swastika
    const rayOptions = [3, 5, 6, 7, 8, 9];
    const rays = rayOptions[Math.floor(Math.random() * rayOptions.length)];
    const timeOffset = t * 0.6; // Different animation speed for diamonds
    
    // Draw central diamond
    const centerSize = cr * 0.1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(timeOffset * 0.5);
    
    // Central diamond shape
    ctx.beginPath();
    ctx.moveTo(0, -centerSize/2);
    ctx.lineTo(centerSize/2, 0);
    ctx.lineTo(0, centerSize/2);
    ctx.lineTo(-centerSize/2, 0);
    ctx.closePath();
    
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerSize);
    centerGradient.addColorStop(0, color1);
    centerGradient.addColorStop(1, color2);
    ctx.fillStyle = centerGradient;
    ctx.strokeStyle = rgba(darken(color1, 0.35), 0.7);
    ctx.lineWidth = 0.5;
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
    
    // Draw radial diamonds around center based on the selected number of rays
    for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * TAU + timeOffset;
        const size = cr * 0.18 * (0.95 + 0.05 * Math.sin(t * 4 + i));
        const distance = cr * 0.35;
        
        const centerX = cx + Math.cos(angle) * distance;
        const centerY = cy + Math.sin(angle) * distance;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + t * 0.4);
        
        // Diamond made of 2 triangles
        ctx.beginPath();
        ctx.moveTo(0, -size); // Top point
        ctx.lineTo(size * 0.7, 0); // Right point
        ctx.lineTo(0, size); // Bottom point
        ctx.lineTo(-size * 0.7, 0); // Left point
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, -size, 0, size);
        gradient.addColorStop(0, lighten(color1, 0.2));
        gradient.addColorStop(1, darken(color2, 0.2));
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = rgba(darken(color1, 0.35), 0.7);
        ctx.lineWidth = 0.5;
        
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Draw additional smaller diamonds in intermediate positions
    for (let i = 0; i < rays; i++) {
        const angle = ((i + 0.5) / rays) * TAU + timeOffset * 1.2;
        const size = cr * 0.12 * (0.9 + 0.1 * Math.sin(t * 5 + i));
        const distance = cr * 0.2;
        
        const centerX = cx + Math.cos(angle) * distance;
        const centerY = cy + Math.sin(angle) * distance;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + t * 0.6);
        
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.5, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.5, 0);
        ctx.closePath();
        
        ctx.fillStyle = color2;
        ctx.strokeStyle = rgba(lighten(color2, 0.4), 0.8);
        ctx.lineWidth = 0.4;
        
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Draw outer ring of diamonds
    for (let i = 0; i < rays * 2; i++) { // Double the amount for outer ring
        const angle = (i / (rays * 2)) * TAU + timeOffset * 0.8;
        const size = cr * 0.1 * (0.92 + 0.08 * Math.sin(t * 3 + i));
        const distance = cr * 0.55;
        
        const centerX = cx + Math.cos(angle) * distance;
        const centerY = cy + Math.sin(angle) * distance;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + t * 0.3);
        
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.5, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.5, 0);
        ctx.closePath();
        
        const alt = i % 2 === 0;
        const diamondColor = alt ? color1 : color2;
        ctx.fillStyle = diamondColor;
        ctx.strokeStyle = rgba(darken(diamondColor, 0.4), 0.8);
        ctx.lineWidth = 0.3;
        
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }

    ctx.restore();
}

/**
 * Draw cell-like center tessellation
 */
function drawCenterCells(ctx, cx, cy, cr, color1, color2, t) {
    const rows = 3;
    const cols = 3;
    const cellSize = (cr * 0.8) / Math.max(rows, cols);
    const offsetX = -(cols - 1) * cellSize / 2;
    const offsetY = -(rows - 1) * cellSize / 2;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (row === 1 && col === 1) continue; // Skip center
            
            const x = cx + offsetX + col * cellSize + (row % 2) * cellSize/2;
            const y = cy + offsetY + row * cellSize * 0.8;
            
            const size = cellSize * 0.4 * (0.93 + 0.07 * Math.sin(t * 3 + row * col));
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(t * 0.5 + row + col);
            
            // Hexagon-like shape for cell
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * TAU - Math.PI / 6;
                const px = Math.cos(angle) * size;
                const py = Math.sin(angle) * size;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
            gradient.addColorStop(0, lighten(color1, 0.1 * (row + col)));
            gradient.addColorStop(1, darken(color2, 0.1 * (row + col)));
            
            ctx.fillStyle = gradient;
            ctx.strokeStyle = rgba(darken(color1, 0.4), 0.6);
            ctx.lineWidth = 0.3;
            
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    // Center cell
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.7);
    
    const size = cellSize * 0.5 * (0.97 + 0.03 * Math.sin(t * 2));
    
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * TAU - Math.PI / 6;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    
    ctx.fillStyle = color2;
    ctx.strokeStyle = rgba(lighten(color2, 0.3), 0.9);
    ctx.lineWidth = 0.5;
    
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
}

/**
 * Draw star center tessellation
 */
function drawCenterStars(ctx, cx, cy, cr, color1, color2, t) {
    const stars = 6;
    const timeOffset = t * 0.3; // Different animation speed for stars
    
    for (let i = 0; i < stars; i++) {
        const angle = (i / stars) * TAU + timeOffset;
        const size = cr * 0.15 * (0.9 + 0.1 * Math.sin(t * 4 + i * 1.5));
        const distance = cr * 0.45;
        
        const centerX = cx + Math.cos(angle) * distance;
        const centerY = cy + Math.sin(angle) * distance;
        
        drawStar(ctx, centerX, centerY, 5, size, size * 0.4, color1, color2, t + i);
    }
    
    // Center star
    drawStar(ctx, cx, cy, 5, cr * 0.2 * (0.95 + 0.05 * Math.sin(t)), cr * 0.2 * 0.4 * (0.95 + 0.05 * Math.cos(t)), color2, lighten(color1, 0.3), t);
}

/**
 * Helper to draw a star
 */
function drawStar(ctx, cx, cy, points, outerRadius, innerRadius, fillColor, strokeColor, t) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.4);
    
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (points * 2)) * TAU - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = rgba(strokeColor, 0.8);
    ctx.lineWidth = 0.6;
    
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
}

export function clearFlowerCache() {
    flowerCache.clear();
}