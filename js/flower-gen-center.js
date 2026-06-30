// Center rendering: pistil and tessellation patterns

/**
 * Draw pistil (central reproductive part)
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} f - flower data
 * @param {number} r - radius
 * @param {number} t - time
 * @param {number} stLen - stamen length
 * @param {string} stColor - stamen color
 */
function drawPistil(ctx, f, r, t, stLen, stColor) {
    const windX = 0;
    const windY = 0;
    const pistilSway = 0;
    const pistilLen = stLen * 0.35;
    ctx.save();
    ctx.translate(windX, windY);
    ctx.rotate(pistilSway);
    const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, pistilLen);
    pg.addColorStop(0, lighten(f.centerColor, 0.3));
    pg.addColorStop(1, f.centerColor);
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(0, 0, pistilLen, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(-pistilLen * 0.2, -pistilLen * 0.2, pistilLen * 0.4, 0, TAU);
    ctx.fill();
    ctx.restore();
}

/**
 * Draw triangular tessellation in flower center
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} cr - center radius
 * @param {string} color1 - primary center color
 * @param {string} color2 - secondary center color
 * @param {number} t - time for animation (optional)
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
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Calculate fixed position without animation
            const x = ox + col * s + (row % 2) * s * 0.5;
            const y = oy + row * h;
            
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
 * Pythagorean square tessellation — large + small squares.
 * Large squares at grid intersections, small squares filling the gaps
 * between four adjacent large squares (classic two-size tiling).
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
    // Large squares at grid intersections
    for (let i = -extent; i <= extent; i++) {
        for (let j = -extent; j <= extent; j++) {
            // Fixed position without animation
            const lx = cx + i * cell - L / 2;
            const ly = cy + j * cell - L / 2;
            
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
 * @param {number} t - time for animation (optional)
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
    const timePhase = (t || performance.now() / 1000) * waveFreq;

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
 * Draw center tessellation based on pattern type (dispatcher)
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} cr - center radius
 * @param {string} color1
 * @param {string} color2
 * @param {string} pattern - 'none' | 'triangles' | 'squares' | 'pentagons'
 * @param {number} t - time for animation (optional)
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
    if (drawer) drawer(ctx, cx, cy, cr, color1, color2, t || performance.now() / 1000);
}

// Add the new drawCenterCells function
if (typeof drawCenterCells === 'undefined') {
    window.drawCenterCells = function(ctx, cx, cy, cr, color1, color2, t) {
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
        const timePhase = (t || performance.now() / 1000) * waveFreq;

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
    };
}

// Add the new drawCenterStars function
if (typeof drawCenterStars === 'undefined') {
    window.drawCenterStars = function(ctx, cx, cy, cr, color1, color2, t) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, TAU);
        ctx.clip();

        // Draw concentric star patterns
        const numPoints = 5; // Pentagram stars
        const rings = 4;
        const ringSpacing = cr / rings;
        
        // Use time for animation
        const timePhase = t * 0.25;

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
    };
}

// Add the helper drawStar function
if (typeof drawStar === 'undefined') {
    window.drawStar = function(ctx, cx, cy, points, innerRadius, outerRadius, color, t = 0) {
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
    };
}

// Add the new drawCenterDiamonds function
if (typeof drawCenterDiamonds === 'undefined') {
    window.drawCenterDiamonds = function(ctx, cx, cy, cr, color1, color2, t) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, TAU);
        ctx.clip();

        const s = cr * 0.25; // Size of diamonds
        const h = s * Math.sqrt(2) / 2; // Height adjustment for diamond shape
        const rows = Math.ceil(cr * 2 / (h * 2)) + 1;
        const cols = Math.ceil(cr * 2 / (s * 2)) + 1;
        const ox = cx - cr;
        const oy = cy - cr;

        // More complex animation for boiling/wave effect
        const waveFreq = 0.28;
        const waveAmp = s * 0.25;
        const timePhase = (t || performance.now() / 1000) * waveFreq;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Calculate base position for diamond
                const baseX = ox + col * s * 2 + (row % 2) * s;
                const baseY = oy + row * h * 2;
                
                // Wave distortion
                const waveX = Math.sin(timePhase + baseX * 0.025) * waveAmp;
                const waveY = Math.cos(timePhase * 0.8 + baseY * 0.025) * waveAmp;
                
                // Add some noise for organic feel
                const noiseX = Math.sin(timePhase * 1.2 + row * 0.6 + col * 0.4) * s * 0.15;
                const noiseY = Math.cos(timePhase * 0.9 + row * 0.4 + col * 0.6) * h * 0.15;
                
                const x = baseX + waveX + noiseX;
                const y = baseY + waveY + noiseY;

                // Draw diamond (two triangles forming a diamond)
                const alt = (row + col) % 2 === 0;
                const mainColor = alt ? color1 : color2;
                const darkColor = darken(mainColor, 0.25);

                // First triangle of diamond
                ctx.fillStyle = rgba(mainColor, 0.6);
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - s, y + h);
                ctx.lineTo(x, y + h * 2);
                ctx.closePath();
                ctx.fill();

                // Second triangle of diamond
                ctx.fillStyle = rgba(mainColor, 0.6);
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + s, y + h);
                ctx.lineTo(x, y + h * 2);
                ctx.closePath();
                ctx.fill();

                // Draw smaller triangles inside diamonds with darker color
                // Top triangle
                ctx.fillStyle = rgba(darkColor, 0.7);
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - s * 0.5, y + h);
                ctx.lineTo(x + s * 0.5, y + h);
                ctx.closePath();
                ctx.fill();

                // Bottom triangle
                ctx.fillStyle = rgba(darkColor, 0.7);
                ctx.beginPath();
                ctx.moveTo(x, y + h * 2);
                ctx.lineTo(x - s * 0.5, y + h);
                ctx.lineTo(x + s * 0.5, y + h);
                ctx.closePath();
                ctx.fill();

                // Stroke for diamonds
                ctx.strokeStyle = rgba(darken(mainColor, 0.3), 0.25);
                ctx.lineWidth = 0.3;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - s, y + h);
                ctx.lineTo(x, y + h * 2);
                ctx.lineTo(x + s, y + h);
                ctx.closePath();
                ctx.stroke();
            }
        }

        ctx.restore();
    };
}

// Make functions available globally
if (typeof drawPistil === 'undefined') {
    window.drawPistil = function(ctx, f, r, t, stLen, stColor) {
        const windX = 0;
        const windY = 0;
        const pistilSway = 0;
        const pistilLen = stLen * 0.35;
        ctx.save();
        ctx.translate(windX, windY);
        ctx.rotate(pistilSway);
        const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, pistilLen);
        pg.addColorStop(0, lighten(f.centerColor, 0.3));
        pg.addColorStop(1, f.centerColor);
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(0, 0, pistilLen, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(-pistilLen * 0.2, -pistilLen * 0.2, pistilLen * 0.4, 0, TAU);
        ctx.fill();
        ctx.restore();
    };
}
if (typeof drawCenterTriangles === 'undefined') {
    window.drawCenterTriangles = function(ctx, cx, cy, cr, color1, color2) {
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

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = ox + col * s + (row % 2) * s * 0.5;
                const y = oy + row * h;
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
                const x = ox + col * s + (row % 2) * s * 0.5;
                const y = oy + row * h;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + s * 0.5, y - h);
                ctx.lineTo(x + s, y);
                ctx.closePath();
                ctx.stroke();
            }
        }

        ctx.restore();
    };
}
if (typeof drawCenterSquares === 'undefined') {
    window.drawCenterSquares = function(ctx, cx, cy, cr, color1, color2) {
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

        // Large squares at grid intersections
        for (let i = -extent; i <= extent; i++) {
            for (let j = -extent; j <= extent; j++) {
                const lx = cx + i * cell - L / 2;
                const ly = cy + j * cell - L / 2;
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
                const sx = cx + i * cell + halfCell - s / 2;
                const sy = cy + j * cell + halfCell - s / 2;
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
    };
}
if (typeof drawCenterPentagons === 'undefined') {
    window.drawCenterPentagons = function(ctx, cx, cy, cr, color1, color2) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, TAU);
        ctx.clip();

        const pr = cr * 0.22;
        const angleStep = TAU / 5;

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

        // Center pentagon
        drawPentagon(cx, cy, pr, rgba(color1, 0.65));

        // First ring
        const ring1Dist = pr * 1.75;
        for (let i = 0; i < 5; i++) {
            const a = i * angleStep - Math.PI / 2;
            const px = cx + Math.cos(a) * ring1Dist;
            const py = cy + Math.sin(a) * ring1Dist;
            drawPentagon(px, py, pr * 0.85, rgba(color2, 0.6));
        }

        // Second ring
        const ring2Dist = pr * 3.2;
        for (let i = 0; i < 10; i++) {
            const a = i * (TAU / 10) - Math.PI / 2;
            const px = cx + Math.cos(a) * ring2Dist;
            const py = cy + Math.sin(a) * ring2Dist;
            const alt = i % 2 === 0;
            drawPentagon(px, py, pr * 0.7, alt ? rgba(color1, 0.55) : rgba(color2, 0.55));
        }

        ctx.restore();
    };
}
if (typeof drawCenterTessellation === 'undefined') {
    window.drawCenterTessellation = function(ctx, cx, cy, cr, color1, color2, pattern, t) {
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
    };
}
