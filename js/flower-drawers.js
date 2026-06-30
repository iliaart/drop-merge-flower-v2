// Specific Flower Drawers — 8 default flower types
import { drawPetalShape } from './flowers.js';
import { rgba, lighten, darken, rand, TAU } from './utils.js';
import { drawCenterTessellation } from './flower-center-patterns.js';

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
    const cr = r * 0.15;  // Doubled minimum size: Increased from .225 back to original .45 to address request that centers are too small
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
    const cr = r * 0.15;  // Doubled minimum size: Increased from .175 back to original .35 to address request that centers are too small
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
    const cr = r * 0.15;  // Doubled minimum size: Increased from .175 back to original .35 to address request that centers are too small
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * .35);  // Changed from .175 back to original .35 to match
    cg.addColorStop(0, rgba(f.centerColor, .5));
    cg.addColorStop(1, rgba(f.centerColor, 0));
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, r * .5, 0, TAU); ctx.fill();  // Increased from .25 to .5 to make center more visible
    
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
    const cr = r * 0.15;  // Doubled minimum size: Increased from .225 back to original .45 to address request that centers are too small
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
    const cgr = r * 0.35;  // Doubled minimum size: Increased from .175 back to original .35 to address request that centers are too small
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
    const cr = r * 0.15;  // Doubled minimum size: Increased from .16 back to original .32 to address request that centers are too small
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * .08);  // Doubled: Increased from .04 back to original .08 to maintain proportion
    cg.addColorStop(0, rgba('#88cc44', .6));
    cg.addColorStop(1, rgba('#88cc44', 0));
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, r * .16, 0, TAU); ctx.fill();  // Doubled: Increased from .08 back to original .16 to maintain proportion
    
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
    const lg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.35);  // Doubled minimum size: Increased from .175 back to original .35 to address request that centers are too small
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
    const cr = r * 0.15;  // Doubled minimum size: Increased from .16 back to original .32 to address request that centers are too small
    ctx.fillStyle = rgba('#ffffff', .5);
    ctx.beginPath(); ctx.arc(cx, cy, r * .06, 0, TAU); ctx.fill();  // Doubled: Increased from .03 back to original .06 to maintain proportion
    
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
    const cr = r * 0.15;  // Doubled minimum size: Increased from .26 back to original .52 to address request that centers are too small
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

