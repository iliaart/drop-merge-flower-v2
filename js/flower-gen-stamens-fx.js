// Special-effect stamen types: glass (lens) and jewel (reflective)

/**
 * Draw glass stamens - transparent anthers with magnifying lens effect.
 * Each anther acts as a tiny glass sphere: refractive rim, inner caustic,
 * bright specular highlight.
 */
function drawGlassStamens(ctx, f, r, t, count, length, color, antherSize) {
    const baseR = length * 0.22;
    for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU + Math.sin(t * 0.6 + i * 0.7) * 0.04;
        const sway = Math.sin(t * 0.85 + i * 0.9) * 1.8;

        ctx.save();
        ctx.rotate(a);
        ctx.translate(0, -baseR);

        // filament
        ctx.strokeStyle = rgba(darken(color, 0.1), 0.55);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway * 0.4, -length * 0.4, sway, -length * 0.8);
        ctx.stroke();

        const ax = sway;
        const ay = -length * 0.8;
        const aR = 3.5 * antherSize;

        // lens body - semi-transparent fill
        const lensGrad = ctx.createRadialGradient(ax, ay, 0, ax, ay, aR);
        lensGrad.addColorStop(0, rgba(lighten(color, 0.7), 0.25));
        lensGrad.addColorStop(0.5, rgba(lighten(color, 0.4), 0.18));
        lensGrad.addColorStop(0.8, rgba(color, 0.35));
        lensGrad.addColorStop(1, rgba(darken(color, 0.2), 0.55));
        ctx.fillStyle = lensGrad;
        ctx.beginPath();
        ctx.arc(ax, ay, aR, 0, TAU);
        ctx.fill();

        // refraction ring (lens rim)
        ctx.strokeStyle = rgba(lighten(color, 0.5), 0.7);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(ax, ay, aR * 0.92, 0, TAU);
        ctx.stroke();

        // inner caustic - slightly off-center bright spot
        const cx = ax - aR * 0.25;
        const cy = ay - aR * 0.25;
        const caustGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, aR * 0.55);
        caustGrad.addColorStop(0, 'rgba(255,255,255,0.85)');
        caustGrad.addColorStop(0.4, 'rgba(255,255,255,0.35)');
        caustGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = caustGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, aR * 0.55, 0, TAU);
        ctx.fill();

        // outer refraction arc (bottom-right crescent)
        ctx.strokeStyle = rgba(255, 255, 255, 0.3);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(ax + aR * 0.15, ay + aR * 0.15, aR * 0.8, 0.8, 2.3);
        ctx.stroke();

        ctx.restore();
    }
    drawPistil(ctx, f, r, t, length * 1.0, lighten(color, 0.2));
}

/**
 * Draw jewel stamens - polished gemstone anthers with sharp specular
 * highlights, faceted shimmer, and prismatic colour fringing.
 */
function drawJewelStamens(ctx, f, r, t, count, length, color, antherSize) {
    const baseR = length * 0.25;
    for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU;
        const sway = Math.sin(t * 0.75 + i * 0.8) * 2;

        ctx.save();
        ctx.rotate(a);
        ctx.translate(0, -baseR);

        // filament - slightly thicker for the "weight" of a gem
        ctx.strokeStyle = rgba(darken(color, 0.25), 0.75);
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway * 0.5, -length * 0.4, sway, -length * 0.82);
        ctx.stroke();

        const ax = sway;
        const ay = -length * 0.82;
        const aR = 3.2 * antherSize;

        // gem body - multi-stop gradient for faceted look
        const gemGrad = ctx.createRadialGradient(ax - aR * 0.3, ay - aR * 0.3, 0, ax, ay, aR);
        gemGrad.addColorStop(0, lighten(color, 0.7));
        gemGrad.addColorStop(0.25, lighten(color, 0.35));
        gemGrad.addColorStop(0.55, color);
        gemGrad.addColorStop(0.8, darken(color, 0.15));
        gemGrad.addColorStop(1, darken(color, 0.4));
        ctx.fillStyle = gemGrad;
        ctx.beginPath();
        ctx.arc(ax, ay, aR, 0, TAU);
        ctx.fill();

        // prismatic color fringe (thin iridescent ring)
        const fringeAngle = t * 0.5 + i;
        const fringeR = aR * 0.95;
        ctx.lineWidth = 0.6;
        for (let s = 0; s < 3; s++) {
            const hue = (fringeAngle * 60 + s * 120) % 360;
            ctx.strokeStyle = `hsla(${hue},80%,70%,0.45)`;
            const startA = s * 2.1;
            ctx.beginPath();
            ctx.arc(ax, ay, fringeR, startA, startA + 1.4);
            ctx.stroke();
        }

        // sharp specular highlight (top-left)
        const hx = ax - aR * 0.3;
        const hy = ay - aR * 0.35;
        const specGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, aR * 0.35);
        specGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
        specGrad.addColorStop(0.3, 'rgba(255,255,255,0.5)');
        specGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = specGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, aR * 0.35, 0, TAU);
        ctx.fill();

        // secondary small specular (bottom-right)
        const h2x = ax + aR * 0.25;
        const h2y = ay + aR * 0.2;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(h2x, h2y, aR * 0.15, 0, TAU);
        ctx.fill();

        ctx.restore();
    }
    drawPistil(ctx, f, r, t, length * 1.2, lighten(color, 0.3));
}

// Make functions available globally
window.drawGlassStamens = drawGlassStamens;
window.drawJewelStamens = drawJewelStamens;