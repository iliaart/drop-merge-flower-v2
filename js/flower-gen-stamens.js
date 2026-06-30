// Stamen drawing functions for flower generator

// Simple stamens - basic dots with filaments
function drawSimpleStamens(ctx, f, r, t, count, length, color, antherSize) {
    const baseR = length * 0.25;
    for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU;
        const bx = Math.cos(a) * baseR;
        const by = Math.sin(a) * baseR;
        const x = bx + Math.cos(a) * length * 0.5;
        const y = by + Math.sin(a) * length * 0.5;
        
        ctx.strokeStyle = rgba(color, 0.6);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 2 * antherSize, 0, TAU);
        ctx.fill();
    }
    drawPistil(ctx, f, r, t, length, color);
}

// Filament stamens - long thin threads
function drawFilamentStamens(ctx, f, r, t, count, length, color, antherSize) {
    const baseR = length * 0.2;
    for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU + Math.sin(t * 0.8 + i) * 0.03;
        const sway = Math.sin(t * 0.9 + i * 0.5) * 1.5;
        
        ctx.save();
        ctx.rotate(a);
        ctx.translate(0, -baseR);
        
        ctx.strokeStyle = rgba(darken(color, 0.2), 0.7);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway, -length * 0.4, sway * 1.5, -length * 0.85);
        ctx.stroke();
        
        ctx.fillStyle = lighten(color, 0.3);
        ctx.beginPath();
        ctx.ellipse(sway * 1.5, -length * 0.85, 1.5 * antherSize, 2.5 * antherSize, 0, 0, TAU);
        ctx.fill();
        
        ctx.restore();
    }
    drawPistil(ctx, f, r, t, length * 1.2, color);
}

// Clustered stamens - grouped in bundles
function drawClusteredStamens(ctx, f, r, t, count, length, color, antherSize) {
    const clusterCount = Math.max(2, Math.floor(count / 3));
    const perCluster = Math.floor(count / clusterCount);
    const baseR = length * 0.2;
    
    for (let c = 0; c < clusterCount; c++) {
        const clusterAngle = (c / clusterCount) * TAU;
        const clusterRadius = length * 0.3;
        const cbx = Math.cos(clusterAngle) * baseR;
        const cby = Math.sin(clusterAngle) * baseR;
        
        for (let i = 0; i < perCluster; i++) {
            const offsetAngle = clusterAngle + (i - perCluster / 2) * 0.15;
            const offsetRadius = clusterRadius + i * 2;
            const x = cbx + Math.cos(offsetAngle) * offsetRadius;
            const y = cby + Math.sin(offsetAngle) * offsetRadius;
            
            ctx.strokeStyle = rgba(color, 0.5);
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(cbx, cby);
            ctx.lineTo(x, y - length * 0.4);
            ctx.stroke();
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y - length * 0.4, 2.5 * antherSize, 0, TAU);
            ctx.fill();
        }
    }
    drawPistil(ctx, f, r, t, length * 0.8, color);
}

// Spiral stamens - arranged in spiral pattern
function drawSpiralStamens(ctx, f, r, t, count, length, color, antherSize) {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const baseR = length * 0.15;
    
    for (let i = 0; i < count; i++) {
        const a = i * goldenAngle;
        const d = baseR + Math.sqrt(i) * length * 0.15;
        const x = Math.cos(a) * d;
        const y = Math.sin(a) * d;
        const bx = Math.cos(a) * baseR;
        const by = Math.sin(a) * baseR;
        
        ctx.strokeStyle = rgba(color, 0.6);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo((bx + x) * 0.5, (by + y) * 0.5 - length * 0.25, x, y - length * 0.5);
        ctx.stroke();
        
        ctx.fillStyle = lighten(color, 0.2);
        ctx.beginPath();
        ctx.arc(x, y - length * 0.5, 1.8 * antherSize, 0, TAU);
        ctx.fill();
    }
    drawPistil(ctx, f, r, t, length * 1.3, color);
}

// Brush stamens - dense brush-like appearance
function drawBrushStamens(ctx, f, r, t, count, length, color, antherSize) {
    const baseR = length * 0.18;
    for (let i = 0; i < count * 2; i++) {
        const a = (i / (count * 2)) * TAU;
        const lenVar = 0.6 + (Math.sin(i * 5.7) * 0.5 + 0.5) * 0.4;
        const len = length * lenVar;
        const sway = Math.sin(t * 0.9 + i) * 2;
        
        ctx.save();
        ctx.rotate(a);
        ctx.translate(0, -baseR);
        
        ctx.strokeStyle = rgba(color, 0.4);
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway * 0.5, -len * 0.4, sway, -len * 0.85);
        ctx.stroke();
        
        if (i % 3 === 0) {
            ctx.fillStyle = lighten(color, 0.4);
            ctx.beginPath();
            ctx.arc(sway, -len * 0.85, 1.2 * antherSize, 0, TAU);
            ctx.fill();
        }
        
        ctx.restore();
    }
    drawPistil(ctx, f, r, t, length * 1.1, color);
}

// Prominent stamens - tall and noticeable
function drawProminentStamens(ctx, f, r, t, count, length, color, antherSize) {
    const baseR = length * 0.25;
    for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU;
        const len = length * 1.1;
        const sway = Math.sin(t * 0.8 + i * 0.8) * 2.5;
        
        ctx.save();
        ctx.rotate(a);
        ctx.translate(0, -baseR);
        
        ctx.strokeStyle = rgba(darken(color, 0.15), 0.8);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway * 0.6, -len * 0.4, sway, -len * 0.85);
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(sway, -len * 0.85, 2.5 * antherSize, 3.5 * antherSize, 0, 0, TAU);
        ctx.fill();
        
        ctx.fillStyle = rgba(255, 255, 255, 0.3);
        ctx.beginPath();
        ctx.arc(sway - 1, -len * 0.85 - 1, 1.5 * antherSize, 0, TAU);
        ctx.fill();
        
        ctx.restore();
    }
    drawPistil(ctx, f, r, t, length * 1.5, lighten(color, 0.3));
}

/**
 * Draw minimal stamens - subtle and delicate
 */
function drawMinimalStamens(ctx, f, r, t, count, length, color, antherSize) {
    for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU;
        const x = Math.cos(a) * length * 0.4;
        const y = Math.sin(a) * length * 0.4;
        
        ctx.fillStyle = rgba(color, 0.5);
        ctx.beginPath();
        ctx.arc(x, y, 1.2 * antherSize, 0, TAU);
        ctx.fill();
    }
    drawPistil(ctx, f, r, t, length * 0.6, color);
}

/**
 * Draw exotic stamens - unique decorative patterns
 */
function drawExoticStamens(ctx, f, r, t, count, length, color, antherSize) {
    const baseR = length * 0.2;
    const pistalLen = length * 1.3;
    ctx.strokeStyle = rgba(lighten(color, 0.3), 0.9);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(0, -pistalLen * 0.5, 0, -pistalLen);
    ctx.stroke();
    
    ctx.fillStyle = lighten(color, 0.5);
    ctx.beginPath();
    ctx.arc(0, -pistalLen, 3 * antherSize, 0, TAU);
    ctx.fill();
    
    for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU;
        const len = length * (0.7 + Math.sin(i * 2) * 0.3);
        const sway = Math.sin(t * 0.8 + i) * 2;
        
        ctx.save();
        ctx.rotate(a);
        ctx.translate(0, -baseR);
        
        ctx.strokeStyle = rgba(color, 0.7);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(sway * 0.3, -len * 0.25, sway * 0.8, -len * 0.6, sway, -len * 0.85);
        ctx.stroke();
        
        const antherGrad = ctx.createRadialGradient(sway, -len * 0.85, 0, sway, -len * 0.85, 2.5 * antherSize);
        antherGrad.addColorStop(0, lighten(color, 0.6));
        antherGrad.addColorStop(0.7, color);
        antherGrad.addColorStop(1, darken(color, 0.2));
        
        ctx.fillStyle = antherGrad;
        ctx.beginPath();
        ctx.arc(sway, -len * 0.85, 2.5 * antherSize, 0, TAU);
        ctx.fill();
        
        ctx.restore();
    }
}

/**
 * Draw stamens with various types (dispatcher)
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} f - flower data
 * @param {number} r - radius
 * @param {number} t - time
 */
function drawStamens(ctx, f, r, t) {
    const stCount = f.stamenCount || 0;
    if (stCount === 0) return;
    
    const stamenType = f.stamenType || 'simple';
    const stLen = r * (f.stamenLen || 0.25);
    const stColor = f.stamenColor || '#ffcc88';
    const antherSize = f.antherSize || 1.0;
    
    const windAngle = Math.sin(t * 0.15) * TAU;
    const windStr = Math.sin(t * 0.7) * 2;
    const windX = Math.cos(windAngle) * windStr;
    const windY = Math.sin(windAngle) * windStr;
    ctx.save();
    ctx.translate(windX, windY);
    
    const stamenDrawers = {
        'simple': drawSimpleStamens,
        'filament': drawFilamentStamens,
        'clustered': drawClusteredStamens,
        'spiral': drawSpiralStamens,
        'brush': drawBrushStamens,
        'prominent': drawProminentStamens,
        'minimal': drawMinimalStamens,
        'exotic': drawExoticStamens,
        'glass': drawGlassStamens,
        'jewel': drawJewelStamens
    };
    
    const drawer = stamenDrawers[stamenType] || drawSimpleStamens;
    drawer(ctx, f, r, t, stCount, stLen, stColor, antherSize);
    
    ctx.restore();
}

// Make functions available globally
window.drawSimpleStamens = drawSimpleStamens;
window.drawFilamentStamens = drawFilamentStamens;
window.drawClusteredStamens = drawClusteredStamens;
window.drawSpiralStamens = drawSpiralStamens;
window.drawBrushStamens = drawBrushStamens;
window.drawProminentStamens = drawProminentStamens;
window.drawMinimalStamens = drawMinimalStamens;
window.drawExoticStamens = drawExoticStamens;
window.drawStamens = drawStamens;