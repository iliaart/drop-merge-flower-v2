// Render Loop Module - drawing and rendering functions
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { getAllFlowersWithGenerated } from '../random-flowers.js';
import * as uiModule from '../game-ui.js';
import { drawFlower } from '../game-ui.js';
import { visualEffects } from '../visual-effects.js';
import { clamp, TAU, rgba, hexToRgb, hslToHex } from '../utils.js';

const { VASE, DROP_Y } = CONFIG;

// Cache of derived tail stripe colors per flower level (see drawFlowerTail)
const tailColorCache = new Map();

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
            // Add current position to history (in-place push — no array copies)
            flower.tailPositions.push({
                x: pos.x,
                y: pos.y,
                timestamp: currentTime
            });
            
            // Limit tail length to 40 as specified in spec instead of 20.
            // shift() keeps the same array instance instead of slice() allocating a new one every 25ms.
            const maxTailLength = 40;
            while (flower.tailPositions.length > maxTailLength) {
                flower.tailPositions.shift();
            }
            
            flower.lastTailUpdate = currentTime;
        }
    } else {
        // If flower is not being dragged or moving kinematically, clear position history
        if (flower.tailPositions.length) flower.tailPositions.length = 0;
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

    // Extract 5 colors from the flower's palette — cached per level because
    // hslToHex/rgbToHsl for 5 variants every frame was pure garbage churn.
    const baseColor = (flowerData && flowerData.petalColor) || '#f5a0c0';
    let colors = tailColorCache.get(flower.level);
    if (!colors) {
        colors = [];
        const [r, g, b] = hexToRgb(baseColor);
        const [h, s, l] = rgbToHsl(r, g, b);
        for (let i = 0; i < 5; i++) {
            const hueShift = (h + i * 72) % 360; // Spread around the color wheel (360/5 = 72)
            const lightnessShift = l + (i - 2) * 10; // Vary lightness slightly
            colors.push(hslToHex(hueShift, s, Math.max(10, Math.min(90, lightnessShift))));
        }
        tailColorCache.set(flower.level, colors);
    }

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

    // Draw 5 parallel colored stripes instead of a single line.
    // One shared path + strokeStyle per stripe (no per-stripe save/beginPath/rebuild).
    const originalLineWidth = 30; // Changed from 6 to 10 pixels as requested (was 6, originally 3)
    const stripeWidth = originalLineWidth;
    
    ctx.lineWidth = stripeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = colors[i];
        ctx.stroke();
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

export function renderFrame(MatterLib) {
    // Render — synchronous (the previous dynamic import() here created a
    // Promise every frame and deferred drawing by a microtask)
    const ctx = state.ctx;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);

    // Static background + vase are pre-rendered into an offscreen canvas
    uiModule.drawStaticScene(ctx);

    // Draw tails for all flowers that are being dragged or in kinematic motion
    // This ensures tails appear underneath flowers according to the specification
    const hasMatterBody = MatterLib && MatterLib.Body && typeof MatterLib.Body.getStatic === 'function';
    if (hasMatterBody || state.selectedFlower) {
        let allFlowers = null; // lazily fetched memoized snapshot
        for (const f of state.flowers) {
            if (!f) continue;
            const isKinematic = f.body && hasMatterBody && !MatterLib.Body.getStatic(f.body);
            const isDragging = state.selectedFlower === f && state.isDragging;

            if (isDragging || isKinematic) {
                if (!allFlowers) allFlowers = getAllFlowersWithGenerated();
                drawFlowerTail(ctx, f, allFlowers[f.level]);
            }
        }
    }

    // Separate the flowers into selected and unselected for rendering order
    const unselectedFlowers = [];
    let selectedFlowerToRender = null;

    // Optimize flower iteration - only process flowers that exist
    for (const f of state.flowers) {
        if (f) {
            if (state.selectedFlower === f) {
                selectedFlowerToRender = f;
            } else {
                unselectedFlowers.push(f);
            }
        }
    }

    // Draw unselected flowers first
    for (const f of unselectedFlowers) {
        drawFlower(ctx, f, state.time);
    }

    // Then draw the selected flower on top
    if (selectedFlowerToRender) {
        drawFlower(ctx, selectedFlowerToRender, state.time);
    }

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