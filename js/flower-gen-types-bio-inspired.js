// Bio-inspired flower types - underwater life forms, microorganisms, insects, cosmic clusters

/**
 * Jellyfish flower - inspired by deep-sea jellyfish with flowing tentacles
 */
function drawJellyfishFlower(ctx, cx, cy, f, r, n, t, fractalDepth = 0) {
    // Central bell shape
    const bellR = r * 0.6;
    const bellGrad = ctx.createRadialGradient(
        cx, cy - bellR * 0.3, 0,
        cx, cy, bellR
    );
    bellGrad.addColorStop(0, lighten(f.petalColor, 0.3));
    bellGrad.addColorStop(0.7, f.petalColor);
    bellGrad.addColorStop(1, darken(f.petalColor, 0.3));
    ctx.fillStyle = bellGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, bellR * 1.2, bellR, 0, 0, TAU);
    ctx.fill();

    // Flowing tentacles
    const tentacleCount = Math.max(8, Math.floor(n * 0.8));
    const waveFreq = 0.05;
    const waveAmp = 0.15;

    for (let i = 0; i < tentacleCount; i++) {
        const angle = (i / tentacleCount) * TAU;
        const waveOffset = Math.sin(t * waveFreq + i * 0.3) * waveAmp;
        const tentacleLength = r * (0.6 + 0.4 * Math.sin(i * 0.7));

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        ctx.strokeStyle = rgba(f.petalColor2, 0.7);
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';

        // Draw curved tentacle with wave motion
        ctx.beginPath();
        ctx.moveTo(0, bellR);
        for (let j = 1; j <= 10; j++) {
            const progress = j / 10;
            const x = waveOffset * r * 0.3 * Math.sin(progress * TAU * 2);
            const y = progress * tentacleLength;
            ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.restore();
    }

    // Inner pulsating core
    const pulse = 0.8 + 0.2 * Math.sin(t * 0.8);
    const coreR = r * 0.2 * pulse;
    const coreGrad = ctx.createRadialGradient(
        cx, cy, 0,
        cx, cy, coreR
    );
    coreGrad.addColorStop(0, lighten(f.centerColor, 0.5));
    coreGrad.addColorStop(1, f.centerColor);
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, TAU);
    ctx.fill();
}

/**
 * Coral flower - inspired by coral reef formations with branching structures
 */
function drawCoralFlower(ctx, cx, cy, f, r, n, t, fractalDepth = 0) {
    // Central core
    const coreR = r * 0.15;
    ctx.fillStyle = f.centerColor;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, TAU);
    ctx.fill();

    // Branch-like petals
    const branchCount = Math.max(6, Math.floor(n * 0.7));
    const growthSpeed = 0.5;
    const swayFactor = 0.02;

    for (let i = 0; i < branchCount; i++) {
        const angle = (i / branchCount) * TAU + Math.sin(t * growthSpeed + i * 0.5) * swayFactor;
        const branchLength = r * (0.5 + 0.4 * Math.sin(i * 1.3));

        // Calculate endpoint with slight movement
        const endX = cx + Math.cos(angle) * branchLength;
        const endY = cy + Math.sin(angle) * branchLength;

        // Draw branch with gradient
        const grad = ctx.createLinearGradient(cx, cy, endX, endY);
        grad.addColorStop(0, f.petalColor);
        grad.addColorStop(1, darken(f.petalColor2, 0.2));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Add smaller branches at the end
        for (let j = 0; j < 3; j++) {
            const subAngle = angle + (Math.random() - 0.5) * 0.8;
            const subLength = branchLength * (0.3 + 0.2 * Math.random());
            const subEndX = endX + Math.cos(subAngle) * subLength;
            const subEndY = endY + Math.sin(subAngle) * subLength;

            ctx.strokeStyle = rgba(darken(f.petalColor2, 0.3), 0.7);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(subEndX, subEndY);
            ctx.stroke();
        }

        // Blooms at branch ends
        ctx.fillStyle = rgba(lighten(f.petalColor, 0.2), 0.8);
        ctx.beginPath();
        ctx.arc(endX, endY, 3, 0, TAU);
        ctx.fill();
    }
}

/**
 * Microorganism flower - inspired by cellular structures and microscopic life
 */
function drawMicroorganismFlower(ctx, cx, cy, f, r, n, t, fractalDepth = 0) {
    // Central nucleus
    const nucleusR = r * 0.2;
    const nucleusGlow = ctx.createRadialGradient(
        cx - nucleusR * 0.2, cy - nucleusR * 0.2, 0,
        cx, cy, nucleusR
    );
    nucleusGlow.addColorStop(0, lighten(f.centerColor, 0.4));
    nucleusGlow.addColorStop(0.7, f.centerColor);
    nucleusGlow.addColorStop(1, darken(f.centerColor, 0.2));
    ctx.fillStyle = nucleusGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, nucleusR, 0, TAU);
    ctx.fill();

    // Cellular membrane with undulating edge
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * TAU;
        const variation = 1 + 0.1 * Math.sin(t * 0.3 + i * 0.5);
        const distance = r * 0.8 * variation;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const membraneGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.8);
    membraneGrad.addColorStop(0, rgba(f.petalColor, 0.1));
    membraneGrad.addColorStop(0.7, rgba(f.petalColor, 0.3));
    membraneGrad.addColorStop(1, rgba(darken(f.petalColor, 0.2), 0.5));
    ctx.fillStyle = membraneGrad;
    ctx.fill();

    // Cell organelles
    const organellePositions = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * TAU + t * 0.1;
        const distance = r * 0.5;
        const orgX = Math.cos(angle) * distance;
        const orgY = Math.sin(angle) * distance;
        organellePositions.push({x: orgX, y: orgY});
    }

    // Draw organelles with movement
    organellePositions.forEach((pos, i) => {
        const pulse = 0.8 + 0.2 * Math.sin(t * 0.7 + i);
        const orgR = 4 * pulse;
        ctx.fillStyle = rgba(lighten(f.petalColor2, 0.3), 0.7);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, orgR, 0, TAU);
        ctx.fill();
    });

    ctx.restore();

    // Floating particles inside
    for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * TAU + t * 0.2;
        const distance = r * 0.3 * (0.5 + 0.5 * Math.sin(i * 0.7));
        const floatX = cx + Math.cos(angle) * distance;
        const floatY = cy + Math.sin(angle) * distance;
        const floatSize = 1.5 + 1 * Math.sin(t * 3 + i);
        ctx.fillStyle = rgba(f.centerColor, 0.4);
        ctx.beginPath();
        ctx.arc(floatX, floatY, floatSize, 0, TAU);
        ctx.fill();
    }
}

/**
 * Insectoid flower - inspired by insect anatomy with segmented structures
 */
function drawInsectoidFlower(ctx, cx, cy, f, r, n, t, fractalDepth = 0) {
    // Head segment
    const headR = r * 0.25;
    ctx.fillStyle = f.centerColor;
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.3, headR, 0, TAU);
    ctx.fill();

    // Antennae
    for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        const antX = cx + side * headR * 0.7;
        const antY = cy - r * 0.3;
        const sway = Math.sin(t * 0.6 + i) * 0.1;
        ctx.strokeStyle = f.stemColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(antX, antY);
        ctx.bezierCurveTo(
            antX + side * r * 0.2, antY - r * 0.3,
            antX + side * r * 0.3 * Math.sin(t * 0.4), antY - r * 0.5 + sway * r * 0.2,
            antX + side * r * 0.3, antY - r * 0.5
        );
        ctx.stroke();
    }

    // Thorax
    const thoraxW = r * 0.4;
    const thoraxH = r * 0.3;
    const thoraxGrad = ctx.createLinearGradient(
        cx - thoraxW/2, cy, cx + thoraxW/2, cy
    );
    thoraxGrad.addColorStop(0, f.petalColor);
    thoraxGrad.addColorStop(0.5, lighten(f.petalColor, 0.2));
    thoraxGrad.addColorStop(1, f.petalColor);
    ctx.fillStyle = thoraxGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, thoraxW, thoraxH, 0, 0, TAU);
    ctx.fill();

    // Abdomen
    const abdSegCount = 5;
    for (let i = 0; i < abdSegCount; i++) {
        const segR = r * (0.25 - i * 0.03);
        const segY = cy + r * 0.2 + i * segR * 1.5;
        const pulse = 0.9 + 0.1 * Math.sin(t * 0.5 + i);
        ctx.fillStyle = rgba(darken(f.petalColor2, 0.2 * i), 0.8 * pulse);
        ctx.beginPath();
        ctx.arc(cx, segY, segR, 0, TAU);
        ctx.fill();
    }

    // Wings
    for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(side * 0.2 * Math.sin(t * 0.8));

        const wingGrad = ctx.createRadialGradient(0, 0, 0, side * r * 0.6, 0, r * 0.7);
        wingGrad.addColorStop(0, rgba(f.petalColor, 0.7));
        wingGrad.addColorStop(1, rgba(darken(f.petalColor, 0.3), 0.2));
        ctx.fillStyle = wingGrad;
        ctx.beginPath();
        ctx.ellipse(side * r * 0.3, 0, r * 0.6, r * 0.4, 0, 0, TAU);
        ctx.fill();

        // Wing veins
        ctx.strokeStyle = rgba(darken(f.petalColor, 0.4), 0.5);
        ctx.lineWidth = 1;
        for (let v = 0; v < 5; v++) {
            const vAngle = (v / 4) * Math.PI;
            const vLength = r * 0.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(vAngle) * side * vLength, Math.sin(vAngle) * vLength - r * 0.1);
            ctx.stroke();
        }

        ctx.restore();
    }

    // Legs
    for (let i = 0; i < 6; i++) {
        const legSide = i < 3 ? -1 : 1;
        const legIndex = i % 3;
        const legY = cy - r * 0.1 + legIndex * r * 0.15;
        const legAngle = legSide * 0.3 + 0.1 * Math.sin(t * 0.7 + legIndex);
        const kneeAngle = legSide * 0.4 - 0.1 * Math.sin(t * 0.7 + legIndex + 1);

        ctx.strokeStyle = f.stemColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(cx, legY);
        ctx.lineTo(
            cx + Math.cos(legAngle) * r * 0.4,
            legY + Math.sin(legAngle) * r * 0.3
        );
        ctx.lineTo(
            cx + Math.cos(legAngle) * r * 0.4 + Math.cos(kneeAngle) * r * 0.3,
            legY + Math.sin(legAngle) * r * 0.3 + Math.sin(kneeAngle) * r * 0.2
        );
        ctx.stroke();
    }
}

/**
 * Cosmic Cluster flower - inspired by star clusters and galaxies
 */
function drawCosmicClusterFlower(ctx, cx, cy, f, r, n, t, fractalDepth = 0) {
    // Ensure radius is positive
    const absR = Math.abs(r);
    
    // Central bright core
    const coreR = Math.max(0, absR * 0.2);
    const coreGlow = ctx.createRadialGradient(
        cx, cy, 0,
        cx, cy, coreR
    );
    coreGlow.addColorStop(0, lighten(f.centerColor, 0.6));
    coreGlow.addColorStop(0.5, lighten(f.centerColor, 0.3));
    coreGlow.addColorStop(1, f.centerColor);
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, TAU);
    ctx.fill();

    // Spiral arms
    const armCount = 3;
    const starsPerArm = Math.floor(n * 0.7 / armCount);
    const rotation = t * 0.05; // Slow rotation to simulate galaxy movement

    for (let arm = 0; arm < armCount; arm++) {
        for (let i = 0; i < starsPerArm; i++) {
            const progress = i / starsPerArm;
            const distance = absR * 0.3 + absR * 0.7 * progress;
            const angle = arm * (TAU / armCount) + progress * 3 * TAU + rotation;
            const x = cx + Math.cos(angle) * distance;
            const y = cy + Math.sin(angle) * distance;

            // Star glow effect
            const starSize = Math.max(0, 1 + 3 * (1 - progress));
            const glowSize = Math.max(0, starSize * (2 + Math.sin(t * 2 + arm * 2 + i) * 0.5));
            const starGlow = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
            starGlow.addColorStop(0, rgba(lighten(f.petalColor, 0.5), 0.8));
            starGlow.addColorStop(0.7, rgba(f.petalColor, 0.5));
            starGlow.addColorStop(1, 'transparent');

            ctx.fillStyle = starGlow;
            ctx.beginPath();
            ctx.arc(x, y, glowSize, 0, TAU);
            ctx.fill();

            // Star body
            ctx.fillStyle = f.petalColor;
            ctx.beginPath();
            ctx.arc(x, y, starSize, 0, TAU);
            ctx.fill();
        }
    }

    // Nebula clouds
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * TAU + rotation * 0.5;
        const distance = absR * 0.6;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const size = Math.max(0, absR * 0.4 * (0.7 + 0.3 * Math.sin(t * 0.3 + i)));

        const nebulaGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
        nebulaGrad.addColorStop(0, rgba(lighten(f.petalColor2, 0.5), 0.2));
        nebulaGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = nebulaGrad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, TAU);
        ctx.fill();
    }
    ctx.restore();

    // Orbiting particles
    for (let i = 0; i < 15; i++) {
        const orbitRadius = absR * (0.4 + 0.5 * (i / 15));
        const angle = (i / 15) * TAU * 4 + t * 0.4;
        const x = cx + Math.cos(angle) * orbitRadius;
        const y = cy + Math.sin(angle) * orbitRadius;
        const size = Math.max(0, 0.5 + 1.5 * Math.sin(t * 3 + i));
        ctx.fillStyle = rgba(f.centerColor2, 0.6);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, TAU);
        ctx.fill();
    }
}

/**
 * Add new bio-inspired flower types to the generic drawer
 */
function extendFlowerDrawer() {
    // Store original function
    const originalDrawer = window.drawGenericFlower || drawGenericFlower;
    
    // Create extended drawer
    window.drawGenericFlower = function(ctx, cx, cy, f, t) {
        const r = f.radius;
        const n = f.petals;
        const flowerType = f.flowerType || 'simple';
        const fractalDepth = f.fractalDepth || 0;
        const tilt3D = f.tilt3D || 0;
        
        if (tilt3D > 0) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(1, Math.cos(tilt3D * Math.PI / 180));
            ctx.translate(-cx, -cy);
        }
        
        const flowerDrawers = {
            'simple': drawSimpleFlower,
            'double': drawDoubleFlower,
            'multi': drawMultiLayerFlower,
            'cluster': drawClusterFlower,
            'spiral': drawSpiralFlower,
            'rose': drawRoseFlower,
            'orchid': drawOrchidFlower,
            // New bio-inspired types
            'jellyfish': drawJellyfishFlower,
            'coral': drawCoralFlower,
            'microorganism': drawMicroorganismFlower,
            'insectoid': drawInsectoidFlower,
            'cosmic-cluster': drawCosmicClusterFlower
        };
        
        const drawer = flowerDrawers[flowerType] || drawSimpleFlower;
        drawer(ctx, cx, cy, f, r, n, t, fractalDepth);
        
        // Draw center
        const cr = r * .225; // Reduced from .45 to .225 to limit center size by half
        const cg = ctx.createRadialGradient(cx - cr*.2, cy - cr*.2, 0, cx, cy, cr);
        cg.addColorStop(0, lighten(f.centerColor, .2));
        cg.addColorStop(.6, f.centerColor);
        cg.addColorStop(1, f.centerColor2);
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, TAU);
        ctx.fill();
        
        drawCenterTessellation(ctx, cx, cy, cr, f.centerColor, f.centerColor2, f.centerPattern, t);
        
        // Skip stamen drawing in this context because the drawGenericFlower function
        // in the main game expects to handle stamens separately via the game's own stamen drawing logic
        // Stamens are drawn separately in the main game based on flower level, not flower object
        
        if (tilt3D > 0) {
            ctx.restore();
        }
    };
}

// Make functions available globally
window.drawJellyfishFlower = drawJellyfishFlower;
window.drawCoralFlower = drawCoralFlower;
window.drawMicroorganismFlower = drawMicroorganismFlower;
window.drawInsectoidFlower = drawInsectoidFlower;
window.drawCosmicClusterFlower = drawCosmicClusterFlower;
window.extendFlowerDrawer = extendFlowerDrawer;