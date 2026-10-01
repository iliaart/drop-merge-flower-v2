// Render Loop Module - drawing and rendering functions
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { getAllFlowersWithGenerated } from '../random-flowers.js';
import { drawFlower } from '../game-ui.js';
import { visualEffects } from '../visual-effects.js';
import { clamp, TAU, rgba, hexToRgb, hslToHex } from '../utils.js';

const { VASE, DROP_Y } = CONFIG;

/**
 * Update the flower tail positions when dragging
 * @param {object} flower - The flower object
 * @param {number} currentTime - Current timestamp
 */
export function updateFlowerTail(flower, currentTime) {
    // Проверяем, что тело существует
    if (!flower || !flower.body) return;
    
    // Update the tail if the flower is selected and being dragged OR if it's kinematic (physics-driven motion)
    // According to specification: kinematic state is determined by Matter.Body.getStatic returning false
    const hasMatterBody = state.Matter && state.Matter.Body && typeof state.Matter.Body.getStatic === 'function';
    const isKinematic = flower.body && hasMatterBody && !state.Matter.Body.getStatic(flower.body);
    const isDragging = state.selectedFlower === flower && state.isDragging;
    
    if (isDragging || isKinematic) {
        // Limit the frequency of tail updates (use 25ms as specified in spec instead of 50ms)
        if (currentTime - flower.lastTailUpdate > 25) {
            const pos = flower.body.position;
            // Add current position to history
            flower.tailPositions.push({
                x: pos.x,
                y: pos.y,
                timestamp: currentTime
            });
            
            // Limit tail length to 40 as specified in spec instead of 20
            const maxTailLength = 40;
            if (flower.tailPositions.length > maxTailLength) {
                flower.tailPositions = flower.tailPositions.slice(-maxTailLength);
            }
            
            flower.lastTailUpdate = currentTime;
        }
    } else {
        // If flower is not being dragged or moving kinematically, clear position history
        flower.tailPositions = [];
    }
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [h * 360, s * 100, l * 100];
}

/**
 * Draw the tail for a flower being dragged
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {object} flower - The flower object
 * @param {object} flowerData - The flower data containing color info
 */
export function drawFlowerTail(ctx, flower, flowerData) {
    if (!flower || !flower.tailPositions || flower.tailPositions.length < 2) return;
    
    const tailPoints = flower.tailPositions;
    const tailLength = tailPoints.length;
    
    // Draw tail as a smooth curve with fading opacity and thickness
    ctx.save();
    ctx.beginPath();
    
    // Start at the earliest point with low opacity/thickness
    const startPoint = tailPoints[0];
    ctx.moveTo(startPoint.x, startPoint.y);
    
    // Draw line to each subsequent point
    for (let i = 1; i < tailLength; i++) {
        const point = tailPoints[i];
        ctx.lineTo(point.x, point.y);
    }

    // Extract 5 colors from the flower's palette
    const colors = [];
    // We'll use the main petal color and derive 4 more colors by adjusting hue/lightness
    const baseColor = flowerData.petalColor || '#f5a0c0';
    const [r, g, b] = hexToRgb(baseColor);
    const hsl = rgbToHsl(r, g, b);
    const [h, s, l] = hsl;
    
    // Generate 5 color variations based on the base color
    for (let i = 0; i < 5; i++) {
        const hueShift = (h + i * 72) % 360; // Spread around the color wheel (360/5 = 72)
        const lightnessShift = l + (i - 2) * 10; // Vary lightness slightly
        const newColor = hslToHex(hueShift, s, Math.max(10, Math.min(90, lightnessShift)));
        colors.push(newColor);
    }

    // Draw 5 parallel colored stripes instead of a single line
    const originalLineWidth = 30; // Changed from 6 to 10 pixels as requested (was 6, originally 3)
    const stripeWidth = originalLineWidth;
    
    for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        for (let j = 1; j < tailLength; j++) {
            const point = tailPoints[j];
            ctx.lineTo(point.x, point.y);
        }
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = stripeWidth;
        // Offset each stripe perpendicular to the path to create parallel effect
        // We'll achieve this by setting line width and using different drawing offsets
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over';
        ctx.stroke();
        ctx.restore();
    }

    // Additionally, draw the original gradient stroke for depth/fading effect
    const endPoint = tailPoints[tailLength - 1];
    const gradient = ctx.createLinearGradient(
        startPoint.x, startPoint.y, 
        endPoint.x, endPoint.y
    );
    gradient.addColorStop(0, rgba(flowerData.petalColor || '#f5a0c0', 0.0)); // Fully transparent at start
    gradient.addColorStop(0.5, rgba(flowerData.petalColor || '#f5a0c0', 0.4)); // More opaque in middle
    gradient.addColorStop(1, rgba(flowerData.petalColor || '#f5a0c0', 0.7)); // Most opaque at end near flower

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 35; // Changed to 1/4 of total width to maintain balance
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    ctx.stroke();

    // Optionally, draw fading circles along the tail for a particle effect
    for (let i = 0; i < tailLength; i++) {
        const point = tailPoints[i];
        const progress = i / (tailLength - 1); // From 0 to 1
        const alpha = progress * 0.7; // Fade from transparent to semi-opaque
        const size = 2 * (0.3 + 0.7 * progress); // Smaller at start, larger near flower
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, TAU);
        ctx.fillStyle = rgba(flowerData.petalColor || '#f5a0c0', alpha);
        ctx.fill();
    }
    
    ctx.restore();
}

// FPS OPTIMIZATION: game-ui used to be pulled in via a dynamic import() INSIDE
// renderFrame on every single frame. That scheduled a promise microtask chain
// per frame and deferred all drawing asynchronously — combined with the rest of
// the cinematic effects it tanked FPS toward 0. Static imports remove that cost
// entirely (game-ui does not import this module, so there is no cycle).
import * as uiModule from '../game-ui.js';

export function renderFrame(MatterLib) {
    // Render
    const ctx = state.ctx;
    // Vignette must be drawn at most once per frame (see drawFlower)
    state.vignetteDrawnThisFrame = false;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);

    uiModule.drawBackground(ctx);
    uiModule.drawVase(ctx);

    // Draw tails ONLY for the dragged / just-dropped flower.
    // Rendering a full multi-stroke tail for every moving body was O(bodies ×
    // 40 points × 6 strokes) per frame — a massive hidden cost. Static flowers
    // keep empty tails anyway, so one targeted pass is visually identical.
    const dragF = state.selectedFlower;
    if (dragF && state.isDragging && dragF.tailPositions && dragF.tailPositions.length > 1) {
        const allFlowers = getAllFlowersWithGenerated();
        drawFlowerTail(ctx, dragF, allFlowers[dragF.level]);
    }

    // Draw unselected flowers first, then the selected one on top.
    // Single loop, zero per-frame array allocations.
    let selectedFlowerToRender = null;
    for (let i = 0; i < state.flowers.length; i++) {
        const f = state.flowers[i];
        if (!f) continue;
        if (state.selectedFlower === f) {
            selectedFlowerToRender = f;
        } else {
            drawFlower(ctx, f, state.time);
        }
    }
    if (selectedFlowerToRender) {
        drawFlower(ctx, selectedFlowerToRender, state.time);
    }

    // Cinematic vignette drawn ONCE per frame right after the scene (before UI),
    // never per-flower — avoids stacked-alpha dark circles and saves fill rate.
    uiModule.drawCinematicVignetteOnce(ctx);

    // Draw visual effects
    visualEffects.draw(ctx);

    // Draw particle system with performance check
    if (state.particles) {
        state.particles.draw(ctx);
    }

    uiModule.drawPreviewFlower(ctx, state.time);
    uiModule.drawNextPreview(ctx, state.time);
    uiModule.drawHighestLevel(ctx);
    uiModule.drawGameOverWarning(ctx);
    uiModule.drawGameOver(ctx, state.time > 0 ? 0.016 : 0); // Используем state.time или фиксированное значение вместо dt

    // Добавляем отображение прогресса уровня
    uiModule.drawLevelProgress(ctx);

    // Добавляем отображение FPS
    uiModule.drawFPS(ctx);

    ctx.restore();
}