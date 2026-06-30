// Advanced flower types (rose, orchid) + generic dispatcher

/**
 * Rose flower - concentric overlapping layers
 */
function drawRoseFlower(ctx, cx, cy, f, r, n, t, fractalDepth = 0) {
    const layers = [
        { count: 5, radiusMul: 1.0, sizeMul: 0.55, offset: 0, colorMul: 0.7 },
        { count: 5, radiusMul: 0.85, sizeMul: 0.65, offset: 0.35, colorMul: 0.85 },
        { count: 6, radiusMul: 0.65, sizeMul: 0.75, offset: 0.15, colorMul: 1.0 },
        { count: 5, radiusMul: 0.45, sizeMul: 0.85, offset: 0.4, colorMul: 1.15 },
        { count: 4, radiusMul: 0.25, sizeMul: 0.95, offset: 0.2, colorMul: 1.3 }
    ];
    
    let petalIdx = 0;
    layers.forEach((layer, li) => {
        for (let i = 0; i < layer.count; i++) {
            let a, length, width;
            
            if (f.petalData && f.petalData[petalIdx]) {
                const pd = f.petalData[petalIdx];
                const windSway = Math.sin(t * (0.35 + li * 0.08) + i * 0.4) * (0.007 + li * 0.002) * (pd.windSensitivity || 1);
                a = (pd.angleOffset || 0) + (i / layer.count) * TAU + layer.offset + windSway;
                length = r * (pd.heightMultiplier || f.petalH || 0.75) * layer.sizeMul;
                width = pd.widthMultiplier || f.petalW || 0.4;
            } else {
                const windSway = Math.sin(t * (0.35 + li * 0.08) + i * 0.4) * (0.007 + li * 0.002);
                a = (i / layer.count) * TAU + layer.offset + windSway;
                length = r * (f.petalH || 0.75) * layer.sizeMul;
                width = f.petalW || 0.4;
            }
            
            const col = darken(f.petalColor, 0.3 * (1 - layer.colorMul));
            drawPetalShape(ctx, cx, cy, a, length, width,
                col, lighten(col, 0.15), li < 3, fractalDepth, li < 2 && i % 2 === 0);
            
            petalIdx++;
        }
    });
    
    ctx.strokeStyle = rgba(f.centerColor, 0.15);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let angle = 0; angle < 4 * TAU; angle += 0.1) {
        const spiralR = angle * 0.8;
        const x = cx + Math.cos(angle) * spiralR;
        const y = cy + Math.sin(angle) * spiralR;
        if (angle === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

/**
 * Orchid flower - asymmetric with distinctive shape
 */
function drawOrchidFlower(ctx, cx, cy, f, r, n, t, fractalDepth = 0) {
    const windSwayGlobal = Math.sin(t * 0.3) * 0.01;
    
    // 3 Sepals (outer narrow petals)
    for (let i = 0; i < 3; i++) {
        let a, length, width;
        const baseAngle = (i / 3) * TAU - Math.PI / 2;
        
        if (f.petalData && f.petalData[i]) {
            const pd = f.petalData[i];
            const sepalSway = Math.sin(t * 0.35 + i * 0.5) * 0.008 * (pd.windSensitivity || 1);
            a = baseAngle + sepalSway + windSwayGlobal + (pd.angleOffset || 0);
            length = r * (pd.heightMultiplier || f.petalH || 0.75) * 1.1;
            width = pd.widthMultiplier || f.petalW || 0.4;
        } else {
            const sepalSway = Math.sin(t * 0.35 + i * 0.5) * 0.008;
            a = baseAngle + sepalSway + windSwayGlobal;
            length = r * (f.petalH || 0.75) * 1.1;
            width = f.petalW || 0.4;
        }
        
        drawPetalShape(ctx, cx, cy, a, length, width * 0.7,
            darken(f.petalColor, 0.2), darken(f.petalColor2, 0.15), false, 0, i === 0);
    }
    
    // 2 Side petals (wider, lighter)
    for (let i = 0; i < 2; i++) {
        let a, length, width;
        const idx = 3 + i;
        const baseAngle = (i / 2) * TAU - Math.PI / 2 + TAU / 4;
        
        if (f.petalData && f.petalData[idx]) {
            const pd = f.petalData[idx];
            const petalSway = Math.sin(t * 0.4 + i * 0.6) * 0.01 * (pd.windSensitivity || 1);
            a = baseAngle + petalSway + windSwayGlobal + (pd.angleOffset || 0);
            length = r * (pd.heightMultiplier || f.petalH || 0.75) * 0.9;
            width = pd.widthMultiplier || f.petalW || 0.4;
        } else {
            const petalSway = Math.sin(t * 0.4 + i * 0.6) * 0.01;
            a = baseAngle + petalSway + windSwayGlobal;
            length = r * (f.petalH || 0.75) * 0.9;
            width = f.petalW || 0.4;
        }
        
        drawPetalShape(ctx, cx, cy, a, length, width,
            f.petalColor, f.petalColor2, true, fractalDepth, i === 0);
    }
    
    // 1 Lip (labellum) - distinctive large petal at bottom
    const lipIdx = 5;
    let lipA, lipLength, lipWidth;
    const lipBaseAngle = Math.PI / 2;
    
    if (f.petalData && f.petalData[lipIdx]) {
        const pd = f.petalData[lipIdx];
        const lipSway = Math.sin(t * 0.4) * 0.012 * (pd.windSensitivity || 1);
        lipA = lipBaseAngle + lipSway + windSwayGlobal + (pd.angleOffset || 0);
        lipLength = r * (pd.heightMultiplier || f.petalH || 0.75) * 1.2;
        lipWidth = pd.widthMultiplier || f.petalW || 0.4;
    } else {
        const lipSway = Math.sin(t * 0.4) * 0.012;
        lipA = lipBaseAngle + lipSway + windSwayGlobal;
        lipLength = r * (f.petalH || 0.75) * 1.2;
        lipWidth = f.petalW || 0.4;
    }
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(lipA);
    
    const lipGrad = ctx.createLinearGradient(0, 0, 0, -lipLength);
    lipGrad.addColorStop(0, lighten(f.centerColor, 0.3));
    lipGrad.addColorStop(0.5, f.centerColor);
    lipGrad.addColorStop(1, f.petalColor);
    ctx.fillStyle = lipGrad;
    
    const lipHW = lipLength * lipWidth * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-lipHW, -lipLength * 0.3, -lipHW * 1.2, -lipLength * 0.8, 0, -lipLength);
    ctx.bezierCurveTo(lipHW * 1.2, -lipLength * 0.8, lipHW, -lipLength * 0.3, 0, 0);
    ctx.fill();
    
    ctx.restore();
}

/**
 * Generic flower drawing for custom flowers with wind animation, fractals and 3D
 * @deprecated - 3D tilt functionality has been removed
 */
function drawGenericFlower(ctx, cx, cy, f, r) {
    const n = f.petals;
    const flowerType = f.flowerType || 'simple';
    const fractalDepth = f.fractalDepth || 0;
    const t = performance.now() / 1000;
    const tilt3D = 0;

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

// Make functions available globally
window.drawRoseFlower = drawRoseFlower;
window.drawOrchidFlower = drawOrchidFlower;
window.drawGenericFlower = drawGenericFlower;