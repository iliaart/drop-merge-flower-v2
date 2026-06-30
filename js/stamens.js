// Stamens Drawing Module
import { getAllFlowersWithGenerated } from './random-flowers.js';
import { rgba, lighten, darken, TAU } from './utils.js';

/** Draw animated stamens for a given flower level */
export function drawStamens(ctx, level, r, t, phase, squashS) {
    const allFlowers = getAllFlowersWithGenerated();
    const f = allFlowers[level];
    if (!f) return;

    // Check if flower has stamens or if hasStamens property is false
    if (f.hasStamens === false || (f.stamenCount !== undefined && f.stamenCount === 0)) {
        // Even if no stamens, we might still want to draw star clusters for certain flower types
        if (f.centerPattern === 'stars') {
            drawStarClusters(ctx, f, r, t);
        }
        return;
    }

    const stCount = f.stamenCount || 0;
    if (stCount === 0) return;

    const stamenType = f.stamenType || 'simple';
    const stLen = r * (f.stamenLen || 0.25);
    const stColor = f.stamenColor || f.centerColor2;
    const antherSize = f.antherSize || 1.0;
    // Get animation complexity factor for performance optimization
    const animComplexity = f.animationComplexity !== undefined ? f.animationComplexity : 1.0;

    if (stamenType === 'brush') {
        drawBrushStamens(ctx, stCount, stLen, stColor, antherSize, animComplexity, t, phase);
    } else if (stamenType === 'glass') {
        drawGlassStamens(ctx, stCount, stLen, stColor, antherSize, r, animComplexity, t, phase);
    } else if (stamenType === 'jewel') {
        drawJewelStamens(ctx, stCount, stLen, stColor, antherSize, r, animComplexity, t, phase);
    } else {
        drawSimpleStamens(ctx, stCount, stLen, stColor, antherSize, r, animComplexity, t, phase, squashS);
    }

    // Central pistil
    drawPistil(ctx, f, stLen, t, phase);
    
    // Draw star clusters near stamens if the center pattern is stars
    if (f.centerPattern === 'stars') {
        drawStarClusters(ctx, f, r, t);
    }
}

function drawStarClusters(ctx, f, r, t) {
    // Draw additional star clusters near the center, similar to the center pattern
    const cx = 0;
    const cy = 0;
    const cr = r * 0.1; // Smaller radius for star clusters near stamens
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, TAU);
    ctx.clip();

    // Draw concentric star patterns
    const numPoints = 5; // Pentagram stars
    const rings = 3; // Fewer rings for stamen-area stars
    const ringSpacing = cr / rings;
    
    // Animation parameters
    const waveFreq = 0.25;
    const timePhase = t * waveFreq;

    for (let ring = 1; ring <= rings; ring++) {
        const ringRadius = ring * ringSpacing * 0.8;
        
        // Draw a star at each position in the ring
        const numStars = Math.max(1, Math.floor(numPoints * ring * 0.6)); // Fewer stars
        
        for (let i = 0; i < numStars; i++) {
            const angle = (i / numStars) * TAU;
            
            // Position with slight randomization for organic feel
            const starX = cx + Math.cos(angle) * ringRadius + Math.sin(t * 0.7 + i) * 1.5; // Smaller movement
            const starY = cy + Math.sin(angle) * ringRadius + Math.cos(t * 0.7 + i) * 1.5;
            
            const starSize = (cr * 0.07) * (1.2 - ring * 0.2); // Slightly larger for visibility
            const alt = (ring + i) % 2 === 0;
            const baseColor = alt ? f.centerColor : f.centerColor2;
            
            // Apply wave distortion
            const waveX = Math.sin(timePhase + starX * 0.03) * 1.0; // Less distortion
            const waveY = Math.cos(timePhase * 0.8 + starY * 0.03) * 1.0;
            
            // Add pulsing effect to stars
            const pulse = 0.8 + 0.2 * Math.sin(t * 2.5 + ring + i);
            const pulsingColor = rgba(baseColor, 0.4 * pulse); // Slightly more opaque
            
            drawStar(ctx, starX + waveX, starY + waveY, numPoints, starSize * 0.5, starSize, pulsingColor, t + ring + i);
        }
    }
    
    // Draw a tiny central star
    const centerStarSize = cr * 0.1;
    const centerPulse = 0.9 + 0.15 * Math.sin(t * 2.0);
    const pulsingCenterColor = rgba(f.centerColor, 0.6 * centerPulse);
    drawStar(ctx, cx, cy, numPoints, centerStarSize * 0.5, centerStarSize, pulsingCenterColor, t + 100);
    
    ctx.restore();
}

function drawBrushStamens(ctx, stCount, stLen, stColor, antherSize, animComplexity, t, phase) {
    const globalSway = Math.sin(t * 2.8 + phase) * 0.18;
    // Reduce detail based on animation complexity
    const detailFactor = animComplexity < 0.8 ? 0.7 : 1.0;
    const effectiveCount = Math.max(1, Math.floor(stCount * 2 * detailFactor));
    
    for (let i = 0; i < effectiveCount; i++) {
        const a = (i / (effectiveCount)) * TAU + globalSway;
        const len = stLen * (0.6 + Math.random() * 0.4);

        ctx.save();
        ctx.rotate(a);
        ctx.strokeStyle = rgba(stColor, 0.4);
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -len);
        ctx.stroke();

        if (i % Math.max(1, Math.floor(3 / detailFactor)) === 0) {
            ctx.fillStyle = lighten(stColor, 0.4);
            ctx.beginPath();
            ctx.arc(0, -len, 1.2 * antherSize, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
}

function drawSimpleStamens(ctx, stCount, stLen, stColor, antherSize, r, animComplexity, t, phase, squashS) {
    const globalSway = Math.sin(t * 2.8 + phase) * .18;
    const impactWobble = (squashS || 0) * 1.5;
    // Reduce detail based on animation complexity
    const detailFactor = animComplexity < 0.8 ? 0.7 : 1.0;
    const effectiveCount = Math.max(1, Math.floor(stCount * detailFactor));

    for (let i = 0; i < effectiveCount; i++) {
        const baseAngle = (i / effectiveCount) * TAU;
        const phaseOffset = i * 1.1;
        const individualSway = Math.sin(t * 3.5 + phase + phaseOffset) * .12;
        const totalSway = globalSway + individualSway + impactWobble * Math.sin(baseAngle);

        const stA = baseAngle + totalSway;
        const tipX = Math.cos(stA) * stLen;
        const tipY = Math.sin(stA) * stLen;
        const cpX = Math.cos(stA + .25) * stLen * .5;
        const cpY = Math.sin(stA + .25) * stLen * .5;

        ctx.strokeStyle = rgba(stColor, .65);
        ctx.lineWidth = Math.max(1, r * .025);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
        ctx.stroke();

        const antherR = Math.max(1.2, r * .05) * antherSize;
        const ag = ctx.createRadialGradient(
            tipX - antherR * .2, tipY - antherR * .2, 0, tipX, tipY, antherR);
        ag.addColorStop(0, lighten(stColor, .35));
        ag.addColorStop(.6, stColor);
        ag.addColorStop(1, darken(stColor, .2));
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.arc(tipX, tipY, antherR, 0, TAU);
        ctx.fill();
    }
}

function drawGlassStamens(ctx, stCount, stLen, stColor, antherSize, r, animComplexity, t, phase) {
    const globalSway = Math.sin(t * 2.8 + phase) * .18;
    // Reduce detail based on animation complexity
    const detailFactor = animComplexity < 0.8 ? 0.7 : 1.0;
    const effectiveCount = Math.max(1, Math.floor(stCount * detailFactor));
    const hiDetail = r >= 35 && animComplexity >= 0.8;
    
    for (let i = 0; i < effectiveCount; i++) {
        const baseAngle = (i / effectiveCount) * TAU;
        const sway = Math.sin(t * 3.0 + phase + i * 0.9) * .1;
        const stA = baseAngle + globalSway + sway;
        const tipX = Math.cos(stA) * stLen;
        const tipY = Math.sin(stA) * stLen;
        const aR = Math.max(2.2, r * .08) * antherSize;

        // filament
        ctx.strokeStyle = rgba(darken(stColor, .1), .55);
        ctx.lineWidth = Math.max(.6, r * .018);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // lens body — single 3-stop gradient (merged body+caustic)
        const lg = ctx.createRadialGradient(tipX - aR * .25, tipY - aR * .25, 0, tipX, tipY, aR);
        lg.addColorStop(0, 'rgba(255,255,255,0.8)');
        lg.addColorStop(.35, rgba(lighten(stColor, .5), .3));
        lg.addColorStop(1, rgba(darken(stColor, .2), .5));
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.arc(tipX, tipY, aR, 0, TAU);
        ctx.fill();

        // refraction ring + extra caustic — only when large enough
        if (hiDetail) {
            ctx.strokeStyle = rgba(lighten(stColor, .5), .6);
            ctx.lineWidth = .5;
            ctx.beginPath();
            ctx.arc(tipX, tipY, aR * .9, 0, TAU);
            ctx.stroke();
        }
    }
}

function drawJewelStamens(ctx, stCount, stLen, stColor, antherSize, r, animComplexity, t, phase) {
    const globalSway = Math.sin(t * 2.8 + phase) * .18;
    // Reduce detail based on animation complexity
    const detailFactor = animComplexity < 0.8 ? 0.7 : 1.0;
    const effectiveCount = Math.max(1, Math.floor(stCount * detailFactor));
    const hiDetail = r >= 35 && animComplexity >= 0.8;
    
    for (let i = 0; i < effectiveCount; i++) {
        const baseAngle = (i / effectiveCount) * TAU;
        const sway = Math.sin(t * 3.2 + phase + i * 0.8) * .1;
        const stA = baseAngle + globalSway + sway;
        const tipX = Math.cos(stA) * stLen;
        const tipY = Math.sin(stA) * stLen;
        const aR = Math.max(2.0, r * .075) * antherSize;

        // filament
        ctx.strokeStyle = rgba(darken(stColor, .25), .75);
        ctx.lineWidth = Math.max(.8, r * .022);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // gem body
        const gg = ctx.createRadialGradient(tipX - aR * .3, tipY - aR * .3, 0, tipX, tipY, aR);
        gg.addColorStop(0, lighten(stColor, .7));
        gg.addColorStop(.4, stColor);
        gg.addColorStop(1, darken(stColor, .4));
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(tipX, tipY, aR, 0, TAU);
        ctx.fill();

        if (hiDetail) {
            // prismatic fringe — single arc instead of 3
            const hue = ((t * .5 + i) * 60) % 360;
            ctx.strokeStyle = `hsla(${hue},80%,70%,0.5)`;
            ctx.lineWidth = .5;
            ctx.beginPath();
            ctx.arc(tipX, tipY, aR * .95, 0, 1.8);
            ctx.stroke();
        }

        // specular highlight — simple filled arc (no gradient)
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(tipX - aR * .3, tipY - aR * .3, aR * .3, 0, TAU);
        ctx.fill();
    }
}

function drawPistil(ctx, f, stLen, t, phase) {
    const pistilSway = Math.sin(t * 2.2 + phase + 2) * .06;
    const pistilLen = stLen * .35;
    ctx.save();
    ctx.rotate(pistilSway);
    const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, pistilLen);
    pg.addColorStop(0, lighten(f.centerColor, .3));
    pg.addColorStop(1, f.centerColor);
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(0, 0, pistilLen, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(-pistilLen * .2, -pistilLen * .2, pistilLen * .4, 0, TAU);
    ctx.fill();
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
    
    // Draw outline with varying opacity for shimmer effect
    const outlineOpacity = 0.2 + 0.1 * Math.sin(t * 1.5);
    ctx.strokeStyle = `rgba(0,0,0,${outlineOpacity})`;
    ctx.lineWidth = 0.2;
    ctx.stroke();
}