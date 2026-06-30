// Specific Flower Drawers — 8 default flower types
import { drawPetalShape } from './flowers.js';
import { rgba, lighten, darken, rand, TAU } from './utils.js';

export function drawDaisy(ctx, cx, cy, f, r) {
    const n = f.petals;
    const hasOutlines = f.hasOutlines !== undefined ? f.hasOutlines : true;
    const t = performance.now() / 1000; // Time for animation
    for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU - Math.PI / 2;
        const jitter = Math.sin(i * 7.3) * .06;
        drawPetalShape(ctx, cx, cy, a + jitter, r * f.petalH, f.petalW,
            f.petalColor, f.petalColor2, true, 0, hasOutlines && i % 2 === 0);
    }
    const cr = r * .225;  // Reduced from .45 to .225 to limit center size by half
    const cg = ctx.createRadialGradient(cx - cr * .2, cy - cr * .2, 0, cx, cy, cr);
    cg.addColorStop(0, lighten(f.centerColor, .2));
    cg.addColorStop(.6, f.centerColor);
    cg.addColorStop(1, f.centerColor2);
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, TAU); ctx.fill();
    
    // Draw center tessellation pattern if specified and enabled
    const hasTessellation = f.hasTessellation !== undefined ? f.hasTessellation : true;
    if (hasTessellation) {
        const centerPattern = f.centerPattern || 'none';
        drawCenterTessellation(ctx, cx, cy, cr, f.centerColor, f.centerColor2, centerPattern, t);
    }
    
    for (let i = 0; i < 12; i++) {
        const da = rand(0, TAU), dd = rand(0, cr * .7);
        ctx.fillStyle = rgba(f.centerColor2, .4);
        ctx.beginPath(); ctx.arc(cx + Math.cos(da) * dd, cy + Math.sin(da) * dd, .8, 0, TAU); ctx.fill();
    }
}

export function drawViolet(ctx, cx, cy, f, r) {
    const angles = [-Math.PI * .5, -Math.PI * .25, 0, Math.PI * .25, Math.PI * .5];
    const scales = [.9, 1, 1, 1, .9];
    const hasOutlines = f.hasOutlines !== undefined ? f.hasOutlines : true;
    const t = performance.now() / 1000; // Time for animation
    for (let i = 0; i < 5; i++) {
        drawPetalShape(ctx, cx, cy, angles[i], r * f.petalH * scales[i], f.petalW,
            i === 2 ? lighten(f.petalColor, .1) : f.petalColor, f.petalColor2, true, 0, hasOutlines && i === 2);
    }
    const cr = r * .175;  // Reduced from .35 to .175 to limit center size by half
    ctx.fillStyle = f.centerColor;
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, TAU); ctx.fill();
    
    // Draw center tessellation pattern if specified and enabled
    const hasTessellation = f.hasTessellation !== undefined ? f.hasTessellation : true;
    if (hasTessellation) {
        const centerPattern = f.centerPattern || 'none';
        drawCenterTessellation(ctx, cx, cy, cr, f.centerColor, f.centerColor2, centerPattern, t);
    }
    
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = .5;
    for (let i = 0; i < 5; i++) {
        const a = angles[i];
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * r * .3, cy + Math.sin(a) * r * .3);
        ctx.stroke();
    }
}

export function drawTulip(ctx, cx, cy, f, r) {
    const n = f.petals;
    const hasOutlines = f.hasOutlines !== undefined ? f.hasOutlines : true;
    const t = performance.now() / 1000; // Time for animation
    for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU - Math.PI / 2;
        drawPetalShape(ctx, cx, cy, a, r * f.petalH * .9, f.petalW * .9,
            darken(f.petalColor, .15), darken(f.petalColor2, .1), false, 0, hasOutlines && i === 0);
    }
    for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU - Math.PI / 2 + TAU / 6;
        drawPetalShape(ctx, cx, cy, a, r * f.petalH * .95, f.petalW,
            f.petalColor, f.petalColor2, true, 0, hasOutlines && i === 0);
    }
    const cr = r * .175;  // Reduced from .35 to .175 to limit center size by half
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * .175);  // Changed from .35 to .175 to match
    cg.addColorStop(0, rgba(f.centerColor, .5));
    cg.addColorStop(1, rgba(f.centerColor, 0));
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, r * .25, 0, TAU); ctx.fill();
    
    // Draw center tessellation pattern if specified and enabled
    const hasTessellation = f.hasTessellation !== undefined ? f.hasTessellation : true;
    if (hasTessellation) {
        const centerPattern = f.centerPattern || 'none';
        drawCenterTessellation(ctx, cx, cy, r * .25, f.centerColor, f.centerColor2, centerPattern, t);
    }
}

export function drawRose(ctx, cx, cy, f, r) {
    const layers = [
        { count: 5, radiusMul: .95, sizeMul: 1, offset: 0 },
        { count: 5, radiusMul: .7, sizeMul: .75, offset: .3 },
        { count: 4, radiusMul: .4, sizeMul: .5, offset: .15 },
    ];
    const hasOutlines = f.hasOutlines !== undefined ? f.hasOutlines : true;
    const t = performance.now() / 1000; // Time for animation
    layers.forEach((layer, li) => {
        for (let i = 0; i < layer.count; i++) {
            const a = (i / layer.count) * TAU + layer.offset;
            const len = r * f.petalH * layer.sizeMul;
            const col = li === 0 ? f.petalColor : lighten(f.petalColor, li * .08);
            drawPetalShape(ctx, cx, cy, a, len, f.petalW * (1 + li * .15),
                col, lighten(col, .15), li < 2, 0, hasOutlines && li === 0 && i % 2 === 0);
        }
    });
    const cr = r * .225;  // Reduced from .45 to .225 to limit center size by half
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    cg.addColorStop(0, lighten(f.centerColor, .2));
    cg.addColorStop(.6, f.centerColor);
    cg.addColorStop(1, f.centerColor2);
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, TAU); ctx.fill();
    
    // Draw center tessellation pattern if specified and enabled
    const hasTessellation = f.hasTessellation !== undefined ? f.hasTessellation : true;
    if (hasTessellation) {
        const centerPattern = f.centerPattern || 'none';
        drawCenterTessellation(ctx, cx, cy, cr, f.centerColor, f.centerColor2, centerPattern, t);
    }
    
    ctx.strokeStyle = rgba(f.centerColor, .4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let t = 0; t < 3 * TAU; t += .2) {
        const sr = t * .8;
        const sx = cx + Math.cos(t) * sr;
        const sy = cy + Math.sin(t) * sr;
        t === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.stroke();
}

export function drawPeony(ctx, cx, cy, f, r) {
    const layers = [
        { count: 7, radiusMul: 1, sizeMul: 1, offset: 0 },
        { count: 7, radiusMul: .8, sizeMul: .8, offset: .25 },
        { count: 6, radiusMul: .55, sizeMul: .6, offset: .12 },
        { count: 5, radiusMul: .3, sizeMul: .4, offset: .4 },
    ];
    const hasOutlines = f.hasOutlines !== undefined ? f.hasOutlines : true;
    const t = performance.now() / 1000; // Time for animation
    layers.forEach((layer, li) => {
        for (let i = 0; i < layer.count; i++) {
            const a = (i / layer.count) * TAU + layer.offset;
            const jitter = Math.sin(i * 5.7 + li * 2.1) * .12;
            const len = r * f.petalH * layer.sizeMul;
            const col = lighten(f.petalColor, li * .06);
            drawPetalShape(ctx, cx, cy, a + jitter, len, f.petalW * (1 + li * .1),
                col, lighten(col, .2), li < 3, 0, hasOutlines && li === 0 && i % 2 === 0);
        }
    });
    const cgr = r * .175;  // Reduced from .35 to .175 to limit center size by half
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cgr);
    cg.addColorStop(0, rgba(f.centerColor, .6));
    cg.addColorStop(1, rgba(f.centerColor, 0));
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, cgr, 0, TAU); ctx.fill();
    
    // Draw center tessellation pattern if specified and enabled
    const hasTessellation = f.hasTessellation !== undefined ? f.hasTessellation : true;
    if (hasTessellation) {
        const centerPattern = f.centerPattern || 'none';
        drawCenterTessellation(ctx, cx, cy, cgr, f.centerColor, f.centerColor2, centerPattern, t);
    }
}

export function drawLily(ctx, cx, cy, f, r) {
    const hasOutlines = f.hasOutlines !== undefined ? f.hasOutlines : true;
    const t = performance.now() / 1000; // Time for animation
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU - Math.PI / 2;
        drawPetalShape(ctx, cx, cy, a, r * f.petalH, f.petalW,
            f.petalColor, f.petalColor2, true, 0, hasOutlines && i % 2 === 0);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a);
        ctx.fillStyle = rgba('#cc6644', .3);
        for (let s = 0; s < 5; s++) {
            const sd = rand(r * .2, r * .7);
            const sw = rand(-r * .08, r * .08);
            ctx.beginPath(); ctx.arc(sw, -sd, rand(.5, 1.2), 0, TAU); ctx.fill();
        }
        ctx.restore();
    }
    const cr = r * .16;  // Reduced from .32 to .16 to limit center size by half
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * .04);  // Reduced from .08 to .04 to limit center size by half
    cg.addColorStop(0, rgba('#88cc44', .6));
    cg.addColorStop(1, rgba('#88cc44', 0));
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, r * .08, 0, TAU); ctx.fill();
    
    // Draw center tessellation pattern if specified and enabled
    const hasTessellation = f.hasTessellation !== undefined ? f.hasTessellation : true;
    if (hasTessellation) {
        const centerPattern = f.centerPattern || 'none';
        drawCenterTessellation(ctx, cx, cy, r * .08, '#88cc44', f.centerColor2, centerPattern, t);
    }
}

export function drawOrchid(ctx, cx, cy, f, r) {
    const hasOutlines = f.hasOutlines !== undefined ? f.hasOutlines : true;
    const t = performance.now() / 1000; // Time for animation
    for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU - Math.PI / 2;
        drawPetalShape(ctx, cx, cy, a, r * f.petalH * .9, f.petalW * .6,
            darken(f.petalColor, .1), f.petalColor, true, 0, hasOutlines && i === 0);
    }
    for (let i = 0; i < 2; i++) {
        const a = (i / 2) * TAU + Math.PI * .25;
        drawPetalShape(ctx, cx, cy, a, r * f.petalH * .85, f.petalW * 1.1,
            f.petalColor, f.petalColor2, true, 0, hasOutlines && true);
    }
    ctx.save();
    ctx.translate(cx, cy);
    const lg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * .175);  // Reduced from .35 to .175 to limit center size by half
    lg.addColorStop(0, lighten(f.centerColor, .3));
    lg.addColorStop(.5, f.centerColor);
    lg.addColorStop(1, darken(f.centerColor, .2));
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(0, r * .05);
    ctx.bezierCurveTo(-r * .25, r * .1, -r * .3, r * .35, 0, r * .4);
    ctx.bezierCurveTo(r * .3, r * .35, r * .25, r * .1, 0, r * .05);
    ctx.fill();
    ctx.fillStyle = rgba(darken(f.petalColor, .3), .4);
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(rand(-r * .1, r * .1), rand(r * .15, r * .3), rand(.5, 1.5), 0, TAU); ctx.fill();
    }
    ctx.restore();
    const cr = r * .16;  // Reduced from .32 to .16 to limit center size by half
    ctx.fillStyle = rgba('#ffffff', .5);
    ctx.beginPath(); ctx.arc(cx, cy, r * .03, 0, TAU); ctx.fill();  // Reduced from .06 to .03 to limit center size by half
    
    // Draw center tessellation pattern if specified and enabled
    const hasTessellation = f.hasTessellation !== undefined ? f.hasTessellation : true;
    if (hasTessellation) {
        const centerPattern = f.centerPattern || 'none';
        drawCenterTessellation(ctx, cx, cy, r * .06, f.centerColor, f.centerColor2, centerPattern, t);
    }
}

export function drawSunflower(ctx, cx, cy, f, r) {
    const n = f.petals;
    const hasOutlines = f.hasOutlines !== undefined ? f.hasOutlines : true;
    const t = performance.now() / 1000; // Time for animation
    for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + Math.sin(i * 3.1) * .05;
        drawPetalShape(ctx, cx, cy, a, r * f.petalH, f.petalW,
            f.petalColor, f.petalColor2, i % 2 === 0, 0, hasOutlines && i % 3 === 0);
    }
    for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + TAU / (n * 2);
        drawPetalShape(ctx, cx, cy, a, r * f.petalH * .7, f.petalW * .8,
            darken(f.petalColor, .08), f.petalColor, false, 0, hasOutlines && i % 2 === 0);
    }
    const cr = r * .26;  // Reduced from .52 to .26 to limit center size by half
    const cg = ctx.createRadialGradient(cx - cr * .15, cy - cr * .15, 0, cx, cy, cr);
    cg.addColorStop(0, lighten(f.centerColor, .2));
    cg.addColorStop(.5, f.centerColor);
    cg.addColorStop(1, f.centerColor2);
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, TAU); ctx.fill();
    
    // Draw center tessellation pattern if specified and enabled
    const hasTessellation = f.hasTessellation !== undefined ? f.hasTessellation : true;
    if (hasTessellation) {
        const centerPattern = f.centerPattern || 'none';
        drawCenterTessellation(ctx, cx, cy, cr, f.centerColor, f.centerColor2, centerPattern, t);
    }
    
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < 80; i++) {
        const a = i * golden;
        const d = Math.sqrt(i) * cr * .1;
        if (d > cr * .9) continue;
        const sx = cx + Math.cos(a) * d;
        const sy = cy + Math.sin(a) * d;
        const sz = .5 + (d / cr) * 1.5;
        ctx.fillStyle = i % 2 === 0 ? rgba(lighten(f.centerColor, .15), .5) : rgba(f.centerColor2, .5);
        ctx.beginPath(); ctx.arc(sx, sy, sz, 0, TAU); ctx.fill();
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
    if (!pattern || pattern === 'none') return;

    const drawers = {
        'triangles': drawCenterTriangles,
        'squares': drawCenterSquares,
        'pentagons': drawCenterPentagons,
        'diamonds': drawCenterDiamonds,
        'cells': drawCenterCells,
        'stars': drawCenterStars
    };

    const drawer = drawers[pattern];
    if (drawer) drawer(ctx, cx, cy, cr, color1, color2, t);
}

/**
 * Draw triangular tessellation in flower center
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} cr - center radius
 * @param {string} color1 - primary center color
 * @param {string} color2 - secondary center color
 * @param {number} t - time for animation
 */
function drawCenterTriangles(ctx, cx, cy, cr, color1, color2, t) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, TAU);
    ctx.clip();

    const s = cr * 0.35;
    const h = s * Math.sqrt(3) / 2;
    const rows = Math.ceil(cr * 2 / h) + 1;
    const cols = Math.ceil(cr * 2 / s) + 1;
    const ox = cx - cr;
    const oy = cy - cr;

    // More complex animation for boiling/wave effect
    const waveFreq = 0.25;
    const waveAmp = s * 0.25;
    const timePhase = t * waveFreq;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Calculate position with wave distortion
            const baseX = ox + col * s + (row % 2) * s * 0.5;
            const baseY = oy + row * h;
            
            // Wave distortion
            const waveX = Math.sin(timePhase + baseX * 0.02) * waveAmp;
            const waveY = Math.cos(timePhase * 0.7 + baseY * 0.02) * waveAmp;
            
            // Add some noise for organic feel
            const noiseX = Math.sin(timePhase * 1.3 + row * 0.7 + col * 0.5) * s * 0.1;
            const noiseY = Math.cos(timePhase * 0.9 + row * 0.5 + col * 0.7) * h * 0.1;
            
            const x = baseX + waveX + noiseX;
            const y = baseY + waveY + noiseY;
            
            const alt = (row + col) % 2 === 0;
            ctx.fillStyle = alt ? rgba(color1, 0.6) : rgba(color2, 0.6);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + s * 0.5, y - h);
            ctx.lineTo(x + s, y);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = alt ? rgba(color2, 0.6) : rgba(color1, 0.6);
            ctx.beginPath();
            ctx.moveTo(x + s * 0.5, y - h);
            ctx.lineTo(x + s, y);
            ctx.lineTo(x + s * 1.5, y - h);
            ctx.closePath();
            ctx.fill();
        }
    }

    ctx.strokeStyle = rgba(darken(color1, 0.3), 0.2);
    ctx.lineWidth = 0.3;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Calculate position with wave distortion
            const baseX = ox + col * s + (row % 2) * s * 0.5;
            const baseY = oy + row * h;
            
            // Wave distortion
            const waveX = Math.sin(timePhase + baseX * 0.02) * waveAmp;
            const waveY = Math.cos(timePhase * 0.7 + baseY * 0.02) * waveAmp;
            
            // Add some noise for organic feel
            const noiseX = Math.sin(timePhase * 1.3 + row * 0.7 + col * 0.5) * s * 0.1;
            const noiseY = Math.cos(timePhase * 0.9 + row * 0.5 + col * 0.7) * h * 0.1;
            
            const x = baseX + waveX + noiseX;
            const y = baseY + waveY + noiseY;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + s * 0.5, y - h);
            ctx.lineTo(x + s, y);
            ctx.closePath();
            ctx.stroke();
        }
    }

    ctx.restore();
}

/**
 * Draw square tessellation in flower center
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} cr - center radius
 * @param {string} color1 - primary center color
 * @param {string} color2 - secondary center color
 * @param {number} t - time for animation
 */
function drawCenterSquares(ctx, cx, cy, cr, color1, color2, t) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, TAU);
    ctx.clip();

    const L = cr * 0.38;
    const s = L * (Math.SQRT2 - 1);  // ≈ 0.414 * L
    const cell = L + s;
    const halfCell = cell / 2;
    const extent = Math.ceil(cr / cell) + 2;

    const strokeCol = rgba(darken(color1, 0.3), 0.2);
    ctx.lineWidth = 0.3;

    // More complex animation for boiling/wave effect
    const waveFreq = 0.2;
    const waveAmp = cell * 0.2;
    const timePhase = t * waveFreq;

    // Large squares at grid intersections
    for (let i = -extent; i <= extent; i++) {
        for (let j = -extent; j <= extent; j++) {
            // Calculate base position
            const baseLx = cx + i * cell - L / 2;
            const baseLy = cy + j * cell - L / 2;
            
            // Wave distortion
            const waveX = Math.sin(timePhase + baseLx * 0.015) * waveAmp;
            const waveY = Math.cos(timePhase * 0.8 + baseLy * 0.015) * waveAmp;
            
            // Add some noise for organic feel
            const noiseX = Math.sin(timePhase * 1.1 + i * 0.5 + j * 0.3) * cell * 0.1;
            const noiseY = Math.cos(timePhase * 0.9 + i * 0.3 + j * 0.5) * cell * 0.1;
            
            const lx = baseLx + waveX + noiseX;
            const ly = baseLy + waveY + noiseY;
            
            const alt = (i + j) % 2 === 0;
            const base = alt ? color1 : color2;
            const g = ctx.createLinearGradient(lx, ly, lx + L, ly + L);
            g.addColorStop(0, rgba(lighten(base, 0.1), 0.65));
            g.addColorStop(1, rgba(darken(base, 0.05), 0.55));
            ctx.fillStyle = g;
            ctx.fillRect(lx, ly, L, L);
            ctx.strokeStyle = strokeCol;
            ctx.strokeRect(lx, ly, L, L);
        }
    }

    // Small squares between large ones (at half-cell offsets)
    for (let i = -extent; i <= extent; i++) {
        for (let j = -extent; j <= extent; j++) {
            // Calculate base position
            const baseSx = cx + i * cell + halfCell - s / 2;
            const baseSy = cy + j * cell + halfCell - s / 2;
            
            // Wave distortion
            const waveX = Math.sin(timePhase + baseSx * 0.015) * waveAmp;
            const waveY = Math.cos(timePhase * 0.8 + baseSy * 0.015) * waveAmp;
            
            // Add some noise for organic feel
            const noiseX = Math.sin(timePhase * 1.1 + i * 0.5 + j * 0.3) * cell * 0.1;
            const noiseY = Math.cos(timePhase * 0.9 + i * 0.3 + j * 0.5) * cell * 0.1;
            
            const sx = baseSx + waveX + noiseX;
            const sy = baseSy + waveY + noiseY;
            
            const alt = (i + j) % 2 === 0;
            const base = alt ? color2 : color1;
            const g = ctx.createLinearGradient(sx, sy, sx + s, sy + s);
            g.addColorStop(0, rgba(lighten(base, 0.15), 0.7));
            g.addColorStop(1, rgba(darken(base, 0.1), 0.6));
            ctx.fillStyle = g;
            ctx.fillRect(sx, sy, s, s);
            ctx.strokeStyle = strokeCol;
            ctx.strokeRect(sx, sy, s, s);
        }
    }

    ctx.restore();
}

/**
 * Draw pentagonal tessellation in flower center
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} cr - center radius
 * @param {string} color1 - primary center color
 * @param {string} color2 - secondary center color
 * @param {number} t - time for animation
 */
function drawCenterPentagons(ctx, cx, cy, cr, color1, color2, t) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, TAU);
    ctx.clip();

    const pr = cr * 0.22;
    const angleStep = TAU / 5;

    // More complex animation for boiling/wave effect
    const waveFreq = 0.22;
    const waveAmp = pr * 0.4;
    const timePhase = t * waveFreq;

    function drawPentagon(px, py, r, fill) {
        ctx.fillStyle = fill;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = i * angleStep - Math.PI / 2;
            const x = px + Math.cos(a) * r;
            const y = py + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = rgba(darken(color1, 0.3), 0.2);
        ctx.lineWidth = 0.3;
        ctx.stroke();
    }

    // Calculate center position with wave distortion
    const centerWaveX = Math.sin(timePhase * 0.5) * waveAmp * 0.3;
    const centerWaveY = Math.cos(timePhase * 0.5) * waveAmp * 0.3;
    
    // Center pentagon
    drawPentagon(cx + centerWaveX, cy + centerWaveY, pr, rgba(color1, 0.65));

    // First ring - with wave distortion
    const ring1Dist = pr * 1.75;
    for (let i = 0; i < 5; i++) {
        const a = i * angleStep - Math.PI / 2;
        // Apply wave distortion to each pentagon in the ring
        const waveX = Math.sin(timePhase + a) * waveAmp * 0.5;
        const waveY = Math.cos(timePhase * 0.7 + a) * waveAmp * 0.5;
        const px = cx + Math.cos(a) * ring1Dist + waveX;
        const py = cy + Math.sin(a) * ring1Dist + waveY;
        drawPentagon(px, py, pr * 0.85, rgba(color2, 0.6));
    }

    // Second ring - with wave distortion
    const ring2Dist = pr * 3.2;
    for (let i = 0; i < 10; i++) {
        const a = i * (TAU / 10) - Math.PI / 2;
        // Apply wave distortion to each pentagon in the ring
        const waveX = Math.sin(timePhase * 0.8 + a * 1.2) * waveAmp * 0.7;
        const waveY = Math.cos(timePhase * 1.1 + a * 1.2) * waveAmp * 0.7;
        const px = cx + Math.cos(a) * ring2Dist + waveX;
        const py = cy + Math.sin(a) * ring2Dist + waveY;
        const alt = i % 2 === 0;
        drawPentagon(px, py, pr * 0.7, alt ? rgba(color1, 0.55) : rgba(color2, 0.55));
    }

    ctx.restore();
}

/**
 * Draw diamond tessellation with triangles in flower center
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} cr - center radius
 * @param {string} color1 - primary center color
 * @param {string} color2 - secondary center color
 * @param {number} t - time for animation
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
 * Draw cellular (hexagon/square) tessellation in flower center
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} cr - center radius
 * @param {string} color1 - primary center color
 * @param {string} color2 - secondary center color
 * @param {number} t - time for animation
 */
function drawCenterCells(ctx, cx, cy, cr, color1, color2, t) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, TAU);
    ctx.clip();

    // Hexagonal cells (honeycomb pattern)
    const hexRadius = cr * 0.12;
    const hexHeight = Math.sqrt(3) * hexRadius;
    const hexWidth = 2 * hexRadius;
    
    // Calculate number of rows and columns needed to fill the circle
    const rows = Math.ceil(cr * 2 / (hexHeight * 0.75)) + 1;
    const cols = Math.ceil(cr * 2 / (hexWidth * 0.75)) + 1;
    
    const offsetX = cx - (cols * hexWidth * 0.75) / 2;
    const offsetY = cy - (rows * hexHeight) / 2;

    // Animation parameters
    const waveFreq = 0.18;
    const waveAmp = hexRadius * 0.3;
    const timePhase = t * waveFreq;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Offset every other row for honeycomb pattern
            const x = offsetX + col * hexWidth * 0.75 + (row % 2) * (hexWidth * 0.75 / 2);
            const y = offsetY + row * hexHeight * 0.75;
            
            // Check if this hexagon is within our circular clipping area
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist > cr * 1.2) continue;
            
            // Apply wave distortion
            const waveX = Math.sin(timePhase + x * 0.02) * waveAmp;
            const waveY = Math.cos(timePhase * 0.7 + y * 0.02) * waveAmp;
            
            // Add some noise for organic feel
            const noiseX = Math.sin(timePhase * 1.3 + row * 0.7 + col * 0.5) * hexRadius * 0.1;
            const noiseY = Math.cos(timePhase * 0.9 + row * 0.5 + col * 0.7) * hexHeight * 0.1;
            
            const finalX = x + waveX + noiseX;
            const finalY = y + waveY + noiseY;
            
            const alt = (row + col) % 2 === 0;
            ctx.fillStyle = alt ? rgba(color1, 0.6) : rgba(color2, 0.6);
            
            // Draw hexagon
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = i * Math.PI / 3;
                const hx = finalX + hexRadius * Math.cos(angle);
                const hy = finalY + hexRadius * Math.sin(angle);
                
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.fill();
            
            // Draw outline
            ctx.strokeStyle = rgba(darken(alt ? color1 : color2, 0.3), 0.3);
            ctx.lineWidth = 0.3;
            ctx.stroke();
        }
    }

    ctx.restore();
}

/**
 * Draw star-shaped pattern in flower center
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} cr - center radius
 * @param {string} color1 - primary center color
 * @param {string} color2 - secondary center color
 * @param {number} t - time for animation
 */
function drawCenterStars(ctx, cx, cy, cr, color1, color2, t) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, TAU);
    ctx.clip();

    // Draw concentric star patterns
    const numPoints = 5; // Pentagram stars
    const rings = 4;
    const ringSpacing = cr / rings;
    
    // Animation parameters
    const waveFreq = 0.25;
    const timePhase = t * waveFreq;

    for (let ring = 1; ring <= rings; ring++) {
        const ringRadius = ring * ringSpacing * 0.8;
        
        // Draw a star at each position in the ring
        const numStars = Math.max(3, Math.floor(numPoints * ring * 1.2)); // Increased minimum to 3 and multiplier to make stars more visible
        
        for (let i = 0; i < numStars; i++) {
            const angle = (i / numStars) * TAU;
            
            // Position with slight randomization for organic feel
            const starX = cx + Math.cos(angle) * ringRadius + Math.sin(t * 0.7 + i) * 2;
            const starY = cy + Math.sin(angle) * ringRadius + Math.cos(t * 0.7 + i) * 2;
            
            const starSize = (cr * 0.1) * (1.2 - ring * 0.15); // Increased star size from 0.05 to 0.1
            const alt = (ring + i) % 2 === 0;
            const baseColor = alt ? color1 : color2;
            
            // Apply wave distortion
            const waveX = Math.sin(timePhase + starX * 0.03) * 1.5;
            const waveY = Math.cos(timePhase * 0.8 + starY * 0.03) * 1.5;
            
            // Add pulsing effect to stars
            const pulse = 0.8 + 0.2 * Math.sin(t * 2.5 + ring + i);
            const pulsingColor = rgba(baseColor, 0.7 * pulse); // Increased opacity from 0.5 to 0.7
            
            drawStar(ctx, starX + waveX, starY + waveY, numPoints, starSize * 0.5, starSize, pulsingColor, t + ring + i);
        }
    }
    
    // Draw a central star with pulsing animation
    const centerStarSize = cr * 0.25; // Increased from 0.15 to 0.25 to make it more prominent
    const centerPulse = 0.9 + 0.15 * Math.sin(t * 2.0);
    const pulsingCenterColor = rgba(color1, 0.85 * centerPulse); // Increased opacity from 0.7 to 0.85
    drawStar(ctx, cx, cy, numPoints, centerStarSize * 0.5, centerStarSize, pulsingCenterColor, t + 100);
    
    ctx.restore();
}

/**
 * Helper function to draw a star
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx - center X
 * @param {number} cy - center Y
 * @param {number} points - number of points
 * @param {number} innerRadius - inner radius
 * @param {number} outerRadius - outer radius
 * @param {string} color - fill color
 * @param {number} t - time for animation
 */
function drawStar(ctx, cx, cy, points, innerRadius, outerRadius, color, t = 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    
    // Add subtle rotation to each star for dynamic effect
    const rotation = t * 0.3;
    
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (points * 2)) * TAU - Math.PI / 2 + rotation;
        
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.fill();
    
    // Draw outline with varying opacity for shimmer effect - making it more visible
    const outlineOpacity = 0.4 + 0.2 * Math.sin(t * 1.5); // Increased from 0.2 + 0.1 to 0.4 + 0.2
    ctx.strokeStyle = `rgba(0,0,0,${outlineOpacity})`;
    ctx.lineWidth = 0.4; // Increased from 0.2 to 0.4 for better visibility
    ctx.stroke();
}
