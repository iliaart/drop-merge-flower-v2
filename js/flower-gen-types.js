// Basic flower type drawing functions (simple, double, multi, cluster, spiral)

/**
 * Simple flower - single layer
 */
function drawSimpleFlower(ctx, cx, cy, f, r, n, t, fractalDepth = 0) {
    for (let i = 0; i < n; i++) {
        let a, length, width;
        
        if (f.petalData && f.petalData[i]) {
            const pd = f.petalData[i];
            const windSway = Math.sin(t * 0.4 + i * 0.3) * 0.008 * (pd.windSensitivity || 1);
            a = (pd.angleOffset || 0) + (i / n) * TAU - Math.PI / 2 + windSway;
            length = r * (pd.heightMultiplier || f.petalH || 0.75);
            width = pd.widthMultiplier || f.petalW || 0.4;
        } else {
            const windSway = Math.sin(t * 0.4 + i * 0.3) * 0.008;
            a = (i / n) * TAU - Math.PI / 2 + windSway;
            length = r * (f.petalH || 0.75);
            width = f.petalW || 0.4;
        }
        
        drawPetalShape(ctx, cx, cy, a, length, width,
            f.petalColor, f.petalColor2, true, fractalDepth, i % 2 === 0);
    }
}

/**
 * Double flower - two layers
 */
function drawDoubleFlower(ctx, cx, cy, f, r, n, t, fractalDepth = 0) {
    const outerN = Math.ceil(n * 0.6);
    const innerN = n - outerN;
    
    for (let i = 0; i < outerN; i++) {
        let a, length, width;
        if (f.petalData && f.petalData[i]) {
            const pd = f.petalData[i];
            const windSway = Math.sin(t * 0.35 + i * 0.25) * 0.007 * (pd.windSensitivity || 1);
            a = (pd.angleOffset || 0) + (i / outerN) * TAU - Math.PI / 2 + windSway;
            length = r * (pd.heightMultiplier || f.petalH || 0.75) * 1.1;
            width = pd.widthMultiplier || f.petalW || 0.4;
        } else {
            const windSway = Math.sin(t * 0.35 + i * 0.25) * 0.007;
            a = (i / outerN) * TAU - Math.PI / 2 + windSway;
            length = r * (f.petalH || 0.75) * 1.1;
            width = f.petalW || 0.4;
        }
        drawPetalShape(ctx, cx, cy, a, length, width,
            darken(f.petalColor, 0.15), darken(f.petalColor2, 0.1), false, fractalDepth, i % 3 === 0);
    }
    
    for (let i = 0; i < innerN; i++) {
        let a, length, width;
        const idx = outerN + i;
        if (f.petalData && f.petalData[idx]) {
            const pd = f.petalData[idx];
            const windSway = Math.sin(t * 0.4 + i * 0.35) * 0.01 * (pd.windSensitivity || 1);
            a = (pd.angleOffset || 0) + (i / innerN) * TAU - Math.PI / 2 + TAU / (innerN * 2) + windSway;
            length = r * (pd.heightMultiplier || f.petalH || 0.75) * 0.85;
            width = pd.widthMultiplier || f.petalW || 0.4;
        } else {
            const windSway = Math.sin(t * 0.4 + i * 0.35) * 0.01;
            a = (i / innerN) * TAU - Math.PI / 2 + TAU / (innerN * 2) + windSway;
            length = r * (f.petalH || 0.75) * 0.85;
            width = f.petalW || 0.4;
        }
        drawPetalShape(ctx, cx, cy, a, length, width,
            f.petalColor, f.petalColor2, true, fractalDepth, i % 2 === 0);
    }
}

/**
 * Multi-layer flower - 3+ layers with gentle wind
 */
function drawMultiLayerFlower(ctx, cx, cy, f, r, n, t, fractalDepth = 0) {
    const layers = [
        { count: Math.ceil(n * 0.4), radiusMul: 1.1, sizeMul: 1.0, offset: 0, colorMul: 0.85 },
        { count: Math.ceil(n * 0.35), radiusMul: 0.8, sizeMul: 0.75, offset: 0.3, colorMul: 1.0 },
        { count: n - Math.ceil(n * 0.4) - Math.ceil(n * 0.35), radiusMul: 0.5, sizeMul: 0.5, offset: 0.15, colorMul: 1.15 }
    ];
    
    let petalIdx = 0;
    layers.forEach((layer, li) => {
        for (let i = 0; i < layer.count; i++) {
            let a, length, width;
            if (f.petalData && f.petalData[petalIdx]) {
                const pd = f.petalData[petalIdx];
                const windSway = Math.sin(t * (0.35 + li * 0.1) + i * 0.3) * (0.005 + li * 0.003) * (pd.windSensitivity || 1);
                a = (pd.angleOffset || 0) + (i / layer.count) * TAU + layer.offset + windSway;
                length = r * (pd.heightMultiplier || f.petalH || 0.75) * layer.sizeMul;
                width = pd.widthMultiplier || f.petalW || 0.4;
            } else {
                const windSway = Math.sin(t * (0.35 + li * 0.1) + i * 0.3) * (0.005 + li * 0.003);
                a = (i / layer.count) * TAU + layer.offset + windSway;
                length = r * (f.petalH || 0.75) * layer.sizeMul;
                width = f.petalW || 0.4;
            }
            const col = li === 0 ? darken(f.petalColor, 0.15) : lighten(f.petalColor, li * 0.1);
            drawPetalShape(ctx, cx, cy, a, length, width,
                col, lighten(col, 0.15), li < 2, fractalDepth, li === 0 && i % 2 === 0);
            petalIdx++;
        }
    });
}

/**
 * Cluster flower - grouped petals with calm wind
 */
function drawClusterFlower(ctx, cx, cy, f, r, n, t, fractalDepth = 0) {
    const clusterCount = Math.max(3, Math.floor(n / 4));
    const petalsPerCluster = Math.floor(n / clusterCount);
    
    for (let c = 0; c < clusterCount; c++) {
        const clusterAngle = (c / clusterCount) * TAU - Math.PI / 2;
        const clusterWindSway = Math.sin(t * 0.5 + c * 0.6) * 0.012;
        
        for (let i = 0; i < petalsPerCluster; i++) {
            let a, length, width;
            const idx = c * petalsPerCluster + i;
            if (f.petalData && f.petalData[idx]) {
                const pd = f.petalData[idx];
                const petalSway = Math.sin(t * 0.35 + i * 0.4) * 0.007 * (pd.windSensitivity || 1);
                a = clusterAngle + clusterWindSway + (i / petalsPerCluster - 0.5) * 0.5 + petalSway + (pd.angleOffset || 0);
                const lenVar = 0.7 + ((Math.sin(idx * 7.3) * 0.5 + 0.5) * 0.3);
                length = r * (pd.heightMultiplier || f.petalH || 0.75) * lenVar;
                width = pd.widthMultiplier || f.petalW || 0.4;
            } else {
                const petalSway = Math.sin(t * 0.35 + i * 0.4) * 0.007;
                a = clusterAngle + clusterWindSway + (i / petalsPerCluster - 0.5) * 0.5 + petalSway;
                const lenVar = 0.7 + ((Math.sin(idx * 7.3) * 0.5 + 0.5) * 0.3);
                length = r * (f.petalH || 0.75) * lenVar;
                width = f.petalW || 0.4;
            }
            drawPetalShape(ctx, cx, cy, a, length, width,
                f.petalColor, f.petalColor2, true, 0, i === 0);
        }
    }
}

/**
 * Spiral flower - petals in spiral pattern with gentle wind
 */
function drawSpiralFlower(ctx, cx, cy, f, r, n, t, fractalDepth = 0) {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    
    for (let i = 0; i < n; i++) {
        let a, length, width;
        if (f.petalData && f.petalData[i]) {
            const pd = f.petalData[i];
            const spiralAngle = i * goldenAngle;
            const windSway = Math.sin(t * 0.35 + i * 0.2) * 0.008 * (pd.windSensitivity || 1);
            a = spiralAngle + windSway + (pd.angleOffset || 0);
            const distFromCenter = Math.sqrt(i / n);
            length = r * (pd.heightMultiplier || f.petalH || 0.75) * (0.4 + distFromCenter * 0.6);
            width = pd.widthMultiplier || f.petalW || 0.4;
        } else {
            const spiralAngle = i * goldenAngle;
            const windSway = Math.sin(t * 0.35 + i * 0.2) * 0.008;
            a = spiralAngle + windSway;
            const distFromCenter = Math.sqrt(i / n);
            length = r * (f.petalH || 0.75) * (0.4 + distFromCenter * 0.6);
            width = f.petalW || 0.4;
        }
        drawPetalShape(ctx, cx, cy, a, length, width,
            f.petalColor, f.petalColor2, true, fractalDepth, i % 3 === 0);
    }
}

// Make functions available globally
window.drawSimpleFlower = drawSimpleFlower;
window.drawDoubleFlower = drawDoubleFlower;
window.drawMultiLayerFlower = drawMultiLayerFlower;
window.drawClusterFlower = drawClusterFlower;
window.drawSpiralFlower = drawSpiralFlower;