// Petal drawing functions for flower generator

/**
 * Draw fractal details on a petal
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} angle
 * @param {number} size
 * @param {number} depth
 * @param {string} color
 */
function drawFractalDetails(ctx, x, y, angle, size, depth, color) {
    if (depth <= 0 || size < 2) return;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    const branches = Math.min(3, depth + 1);
    for (let i = 0; i < branches; i++) {
        const t = (i + 1) / (branches + 1);
        const branchSize = size * (0.3 + 0.2 * (1 - t));
        const branchAngle = (i - branches / 2) * 0.4;
        
        ctx.save();
        ctx.translate(0, -size * t);
        ctx.rotate(branchAngle);
        
        const alpha = 0.3 + 0.2 * (depth - 1);
        ctx.fillStyle = rgba(color, alpha);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
            -branchSize * 0.3, -branchSize * 0.2,
            -branchSize * 0.4, -branchSize * 0.6,
            0, -branchSize
        );
        ctx.bezierCurveTo(
            branchSize * 0.4, -branchSize * 0.6,
            branchSize * 0.3, -branchSize * 0.2,
            0, 0
        );
        ctx.fill();
        
        if (depth > 1) {
            drawFractalDetails(ctx, 0, -branchSize * 0.5, 0, branchSize * 0.5, depth - 1, color);
        }
        
        ctx.restore();
    }
    
    ctx.restore();
}

/**
 * Apply 3D transform to canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 * @param {number} tiltAngle
 */
function apply3DTransform(ctx, canvas, tiltAngle) {
    if (tiltAngle === 0) return;
    
    const radians = tiltAngle * Math.PI / 180;
    const scaleY = Math.cos(radians);
    
    ctx.save();
    ctx.scale(1, scaleY);
}

/**
 * Add lighting effect for 3D appearance
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @param {number} lightAngle
 */
function drawLightingEffect(ctx, cx, cy, radius, lightAngle) {
    const lightX = cx + Math.cos(lightAngle) * radius * 0.3;
    const lightY = cy + Math.sin(lightAngle) * radius * 0.3;
    
    const specGrad = ctx.createRadialGradient(lightX, lightY, 0, cx, cy, radius);
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    specGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    specGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.fill();
    
    const shadowX = cx - Math.cos(lightAngle) * radius * 0.2;
    const shadowY = cy - Math.sin(lightAngle) * radius * 0.2;
    
    const shadowGrad = ctx.createRadialGradient(shadowX, shadowY, 0, cx, cy, radius);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
    
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.fill();
}

/**
 * Draw petal shape with fractal details and 3D
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} angle
 * @param {number} length
 * @param {number} width
 * @param {string} color1
 * @param {string} color2
 * @param {boolean} highlight
 * @param {number} fractalDepth
 * @param {boolean} outline - draw visible contour on petal
 */
function drawPetalShape(ctx, cx, cy, angle, length, width, color1, color2, highlight, fractalDepth = 0, outline = false) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const hw = length * width;

    const g = ctx.createLinearGradient(0, 0, 0, -length);
    g.addColorStop(0, color1);
    g.addColorStop(.6, color2 || lighten(color1, .25));
    g.addColorStop(1, lighten(color1, .4));
    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-hw * .8, -length * .25, -hw, -length * .7, 0, -length);
    ctx.bezierCurveTo(hw, -length * .7, hw * .8, -length * .25, 0, 0);
    ctx.fill();

    ctx.strokeStyle = rgba(darken(color1, .1), .2);
    ctx.lineWidth = .5;
    ctx.stroke();

    if (outline) {
        ctx.strokeStyle = rgba(darken(color1, .35), .55);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-hw * .8, -length * .25, -hw, -length * .7, 0, -length);
        ctx.bezierCurveTo(hw, -length * .7, hw * .8, -length * .25, 0, 0);
        ctx.stroke();
    }

    if (length > 15) {
        ctx.strokeStyle = rgba(darken(color1, .12), .15);
        ctx.lineWidth = .4;
        ctx.beginPath();
        ctx.moveTo(0, -length * .08);
        ctx.quadraticCurveTo(hw * .1, -length * .5, 0, -length * .88);
        ctx.stroke();
        
        if (length > 25) {
            for (let v = .3; v < .7; v += .2) {
                ctx.beginPath();
                ctx.moveTo(0, -length * v);
                ctx.quadraticCurveTo(hw * .3, -length * (v + .1), hw * .4, -length * (v + .05));
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, -length * v);
                ctx.quadraticCurveTo(-hw * .3, -length * (v + .1), -hw * .4, -length * (v + .05));
                ctx.stroke();
            }
        }
    }

    if (highlight !== false) {
        const hg = ctx.createLinearGradient(-hw * .2, -length * .5, hw * .2, -length * .2);
        hg.addColorStop(0, 'rgba(255,255,255,0.22)');
        hg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-hw * .5, -length * .2, -hw * .6, -length * .6, 0, -length * .85);
        ctx.bezierCurveTo(hw * .3, -length * .5, hw * .2, -length * .15, 0, 0);
        ctx.fill();
    }

    if (fractalDepth > 0) {
        drawFractalDetails(ctx, 0, -length * 0.3, 0, length * 0.6, fractalDepth, color1);
    }

    ctx.restore();
}

// Make functions available globally
window.drawFractalDetails = drawFractalDetails;
window.apply3DTransform = apply3DTransform;
window.drawLightingEffect = drawLightingEffect;
window.drawPetalShape = drawPetalShape;