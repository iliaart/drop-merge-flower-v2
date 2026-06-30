// Центральные мозаичные узоры для цветов
import { rgba, lighten, darken, rand, TAU } from './utils.js';

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
export function drawCenterTessellation(ctx, cx, cy, cr, color1, color2, pattern, t) {
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
 * Draw triangular tessellation in flower center - kaleidoscopic pattern
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

    // Create kaleidoscopic triangular pattern with many small triangles
    const triSize = cr * 0.05; // Smaller triangles for dense pattern
    const rings = Math.ceil(cr / triSize); // Number of rings to fill the center
    
    // Animation parameters
    const waveFreq = 0.25;
    const waveAmp = triSize * 0.2;
    const timePhase = t * waveFreq;

    // Draw triangles in a radial pattern around the center
    for (let ring = 1; ring <= rings; ring++) {
        const ringRadius = ring * triSize;
        // Calculate number of triangles in this ring based on circumference
        const numTriangles = Math.max(6 * ring, Math.floor((TAU * ringRadius) / (triSize * 0.8)));
        
        for (let i = 0; i < numTriangles; i++) {
            const angle = (i / numTriangles) * TAU;
            const angleStep = TAU / numTriangles;
            
            // Calculate position with wave distortion
            const waveX = Math.sin(timePhase + ring * 0.5 + i * 0.3) * waveAmp;
            const waveY = Math.cos(timePhase * 0.7 + ring * 0.3 + i * 0.5) * waveAmp;
            
            // Base position on the ring
            const baseX = cx + Math.cos(angle) * ringRadius + waveX;
            const baseY = cy + Math.sin(angle) * ringRadius + waveY;
            
            // Determine triangle orientation and colors
            const alt = (ring + i) % 2 === 0;
            const fillColor = alt ? rgba(color1, 0.6) : rgba(color2, 0.6);
            
            // Draw multiple small triangles per position for fuller kaleidoscopic effect
            for (let subTri = 0; subTri < 3; subTri++) {
                const subAngle = angle + (subTri * angleStep / 3);
                const subX = baseX + Math.cos(subAngle) * triSize * 0.3;
                const subY = baseY + Math.sin(subAngle) * triSize * 0.3;
                
                // Draw a small triangle
                ctx.fillStyle = fillColor;
                ctx.beginPath();
                ctx.moveTo(subX, subY);
                
                // Create triangle points in different directions for kaleidoscopic effect
                const dirAngle = subAngle + (subTri * TAU / 6);
                const p1x = subX + Math.cos(dirAngle) * triSize;
                const p1y = subY + Math.sin(dirAngle) * triSize;
                const p2x = subX + Math.cos(dirAngle + (TAU/3)) * triSize;
                const p2y = subY + Math.sin(dirAngle + (TAU/3)) * triSize;
                
                ctx.lineTo(p1x, p1y);
                ctx.lineTo(p2x, p2y);
                ctx.closePath();
                ctx.fill();
                
                // Draw subtle outline
                ctx.strokeStyle = rgba(darken(alt ? color1 : color2, 0.3), 0.2);
                ctx.lineWidth = 0.2;
                ctx.stroke();
            }
        }
    }
    
    // Add additional triangles in between for denser pattern
    for (let ring = 0.5; ring < rings; ring++) {
        if (ring === Math.floor(ring)) continue; // Skip integer rings as they're already processed
        
        const ringRadius = ring * triSize;
        const numTriangles = Math.max(6 * Math.floor(ring), Math.floor((TAU * ringRadius) / (triSize * 0.7)));
        
        for (let i = 0; i < numTriangles; i++) {
            const angle = (i / numTriangles) * TAU + (TAU / (numTriangles * 2)); // Offset angle
            const angleStep = TAU / numTriangles;
            
            // Calculate position with wave distortion
            const waveX = Math.sin(timePhase * 0.8 + ring * 0.7 + i * 0.4) * waveAmp * 0.7;
            const waveY = Math.cos(timePhase * 0.5 + ring * 0.4 + i * 0.7) * waveAmp * 0.7;
            
            const baseX = cx + Math.cos(angle) * ringRadius + waveX;
            const baseY = cy + Math.sin(angle) * ringRadius + waveY;
            
            const alt = (Math.floor(ring) + i) % 2 !== 0;
            const fillColor = alt ? rgba(color2, 0.55) : rgba(color1, 0.55);
            
            // Draw triangle with slightly different orientation
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            
            const dirAngle = angle + TAU/4;
            const p1x = baseX + Math.cos(dirAngle) * triSize * 0.8;
            const p1y = baseY + Math.sin(dirAngle) * triSize * 0.8;
            const p2x = baseX + Math.cos(dirAngle + (TAU/3)) * triSize * 0.8;
            const p2y = baseY + Math.sin(dirAngle + (TAU/3)) * triSize * 0.8;
            
            ctx.lineTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.closePath();
            ctx.fill();
            
            // Draw subtle outline
            ctx.strokeStyle = rgba(darken(alt ? color1 : color2, 0.3), 0.15);
            ctx.lineWidth = 0.15;
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

    const L = cr * 0.38 * 0.7; // Reduced size by 30%
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
            const waveY = Math.cos(timePhase * 0.7 + baseLy * 0.015) * waveAmp;
            
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
            
            // Save context before transformation to avoid rotation accumulation
            ctx.save();
            ctx.translate(lx + L/2, ly + L/2); // Move to center of square
            // Apply a subtle, smooth rotation instead of sharp twisting
            const rotation = Math.sin(timePhase * 0.5 + i * 0.1 + j * 0.1) * 0.2; // Much more subtle rotation
            ctx.rotate(rotation);
            ctx.translate(-(lx + L/2), -(ly + L/2)); // Move back
            
            ctx.fillRect(lx, ly, L, L);
            ctx.strokeStyle = strokeCol;
            ctx.strokeRect(lx, ly, L, L);
            
            // Restore context
            ctx.restore();
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
            const waveY = Math.cos(timePhase * 0.7 + baseSy * 0.015) * waveAmp;
            
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
            
            // Save context before transformation for small squares
            ctx.save();
            ctx.translate(sx + s/2, sy + s/2); // Move to center of square
            // Apply a subtle, smooth rotation instead of sharp twisting
            const smallRotation = Math.cos(timePhase * 0.4 + i * 0.15 + j * 0.15) * 0.15; // Even subtler rotation for small squares
            ctx.rotate(smallRotation);
            ctx.translate(-(sx + s/2), -(sy + s/2)); // Move back
            
            ctx.fillRect(sx, sy, s, s);
            ctx.strokeStyle = strokeCol;
            ctx.strokeRect(sx, sy, s, s);
            
            // Restore context
            ctx.restore();
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

    const pr = cr * 0.12; // Уменьшили базовый размер пятиугольника для большего количества элементов
    const angleStep = TAU / 5;
    
    // Calculate the number of rings needed to fill the center area
    // Each ring roughly takes up 2*pr*1.75 space (accounting for overlap and spacing)
    const estimatedPentagonWidth = pr * 1.6; // Approximate width of a pentagon
    const ringsNeeded = Math.max(1, Math.ceil(cr / (estimatedPentagonWidth * 1.8))); // Increased spacing factor
    const maxRings = Math.min(ringsNeeded, 10); // Limit max rings to prevent excessive computation

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
    if (pr * 1.2 < cr) { // Проверяем, что пятиугольник помещается в центр
        drawPentagon(cx + centerWaveX, cy + centerWaveY, pr * 1.2, rgba(color1, 0.65));
    }

    // Рисуем кольца пятиугольников до достижения границы центрального радиуса
    for (let ring = 1; ring <= maxRings; ring++) {
        // Calculate distance for this ring - using a tighter packing algorithm
        const ringDistance = pr * 1.6 * ring; // Reduced spacing to allow denser packing
        
        // Calculate number of pentagons in this ring based on circumference
        const circumference = TAU * ringDistance;
        let numPentagonsInRing = Math.floor(circumference / (estimatedPentagonWidth * 1.4)); // Factor to account for spacing
        
        // Ensure we have at least the minimum number of pentagons for this ring
        numPentagonsInRing = Math.max(5 * ring, numPentagonsInRing);
        
        // Adjust ring distance slightly to better fit the calculated number of pentagons
        // This creates a more even distribution
        const adjustedRingDistance = ringDistance;
        
        for (let i = 0; i < numPentagonsInRing; i++) {
            const a = (i / numPentagonsInRing) * TAU - Math.PI / 2;
            
            // Apply wave distortion to each pentagon in the ring
            const waveX = Math.sin(timePhase * (0.5 + ring * 0.2) + a * (1 + ring * 0.1)) * waveAmp * (0.3 + ring * 0.2);
            const waveY = Math.cos(timePhase * (0.7 + ring * 0.15) + a * (1 + ring * 0.15)) * waveAmp * (0.3 + ring * 0.2);
            
            const px = cx + Math.cos(a) * adjustedRingDistance + waveX;
            const py = cy + Math.sin(a) * adjustedRingDistance + waveY;
            
            // Проверяем, что пятиугольник находится внутри границы центра
            const distFromCenter = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
            if (distFromCenter + pr * 0.8 < cr) {
                const alt = (ring + i) % 2 === 0;
                drawPentagon(px, py, pr * (1.1 - ring * 0.05), alt ? rgba(color1, 0.6 - ring * 0.05) : rgba(color2, 0.6 - ring * 0.05));
            }
        }
    }

    // Additional pass to fill in any remaining gaps near the edges
    // This adds pentagons in intermediate positions between rings for better coverage
    for (let ring = 0.5; ring < maxRings; ring += 1) {
        if (ring === Math.floor(ring)) continue; // Skip integer rings as they're already drawn
        
        const ringDistance = pr * 1.6 * ring;
        const circumference = TAU * ringDistance;
        let numPentagonsInRing = Math.floor(circumference / (estimatedPentagonWidth * 1.6));
        numPentagonsInRing = Math.max(5 * Math.floor(ring), numPentagonsInRing);
        
        for (let i = 0; i < numPentagonsInRing; i++) {
            const a = (i / numPentagonsInRing) * TAU - Math.PI / 2;
            
            const waveX = Math.sin(timePhase * (0.4 + ring * 0.15) + a * (0.9 + ring * 0.08)) * waveAmp * (0.2 + ring * 0.15);
            const waveY = Math.cos(timePhase * (0.6 + ring * 0.12) + a * (0.8 + ring * 0.12)) * waveAmp * (0.2 + ring * 0.15);
            
            const px = cx + Math.cos(a) * ringDistance + waveX;
            const py = cy + Math.sin(a) * ringDistance + waveY;
            
            const distFromCenter = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
            if (distFromCenter + pr * 0.7 < cr) {
                const alt = (Math.floor(ring) + i) % 2 !== 0;
                drawPentagon(px, py, pr * (0.9 - ring * 0.05), alt ? rgba(color1, 0.5 - ring * 0.04) : rgba(color2, 0.5 - ring * 0.04));
            }
        }
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
 * Draw cellular (distorted circle) tessellation in flower center
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

    // Distorted circles (cell-like appearance)
    const cellRadius = cr * 0.08;
    const cellDiameter = cellRadius * 2;
    
    // Calculate number of rows and columns needed to fill the circle
    const rows = Math.ceil(cr * 2 / cellDiameter) + 1;
    const cols = Math.ceil(cr * 2 / cellDiameter) + 1;
    
    const offsetX = cx - (cols * cellDiameter) / 2;
    const offsetY = cy - (rows * cellDiameter) / 2;

    // Animation parameters
    const waveFreq = 0.18;
    const waveAmp = cellRadius * 0.3;
    const timePhase = t * waveFreq;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = offsetX + col * cellDiameter;
            const y = offsetY + row * cellDiameter;
            
            // Check if this circle is within our circular clipping area
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist > cr * 1.1) continue;
            
            // Apply wave distortion
            const waveX = Math.sin(timePhase + x * 0.02) * waveAmp;
            const waveY = Math.cos(timePhase * 0.7 + y * 0.02) * waveAmp;
            
            // Add some noise for organic feel
            const noiseX = Math.sin(timePhase * 1.3 + row * 0.7 + col * 0.5) * cellRadius * 0.1;
            const noiseY = Math.cos(timePhase * 0.9 + row * 0.5 + col * 0.7) * cellRadius * 0.1;
            
            const finalX = x + waveX + noiseX;
            const finalY = y + waveY + noiseY;
            
            const alt = (row + col) % 2 === 0;
            const baseColor = alt ? color1 : color2;
            
            // Create distortion effect to make circles appear more organic/cell-like
            const distortionFactor = 0.8 + 0.2 * Math.sin(timePhase + row + col);
            
            ctx.save();
            ctx.translate(finalX, finalY);
            ctx.scale(distortionFactor, 1/distortionFactor); // Apply distortion
            
            ctx.beginPath();
            ctx.arc(0, 0, cellRadius, 0, TAU);
            ctx.closePath();
            
            // Create a gradient for more organic look
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cellRadius);
            gradient.addColorStop(0, rgba(lighten(baseColor, 0.1), 0.7));
            gradient.addColorStop(1, rgba(darken(baseColor, 0.1), 0.5));
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Draw subtle outline
            ctx.strokeStyle = rgba(darken(baseColor, 0.3), 0.3);
            ctx.lineWidth = 0.3;
            ctx.stroke();
            
            ctx.restore();
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