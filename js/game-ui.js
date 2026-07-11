// Game UI Module — background, vase, flower preview, game over drawing
import { state } from './state.js';
import { CONFIG } from './config.js';
import { getAllFlowersWithGenerated } from './random-flowers.js';
import { clamp, ease, rgba, TAU } from './utils.js';
import { getFlowerCache } from './flower-cache.js';
import { drawStamens } from './stamens.js';
import { visualEffects } from './visual-effects.js';

const { GW, GH, VASE, DANGER_Y, DROP_Y, GAME_OVER_GRACE } = CONFIG;

export function drawBackground(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, GH);
    bg.addColorStop(0, '#2a1f30');
    bg.addColorStop(.3, '#1f1828');
    bg.addColorStop(.7, '#1a1520');
    bg.addColorStop(1, '#15101a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, GW, GH);

    // Draw glow regardless of performance since we removed FPS limitations
    const perfConfig = window.PERFORMANCE_CONFIG || {};
    const glow = ctx.createRadialGradient(GW / 2, GH * .55, 50, GW / 2, GH * .55, 350);
    glow.addColorStop(0, 'rgba(80,50,60,0.25)');
    glow.addColorStop(.5, 'rgba(50,30,40,0.1)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, GW, GH);
}

export function drawVase(ctx) {
    const l = VASE.l, r = VASE.r, t = VASE.t, b = VASE.b;
    const w = r - l, h = b - t;
    const wallW = 8, rimH = 12;

    ctx.save();
    drawVaseWall(ctx, l, r, t, h, wallW, rimH); // walls
    drawVaseBottom(ctx, l, r, b, w, wallW);       // bottom
    drawVaseRim(ctx, l, r, t, wallW, rimH);       // rim stroke

    // Glass reflections - now enabled regardless of performance since we removed FPS limitations
    const perfConfig = window.PERFORMANCE_CONFIG || {};
    ctx.save();
    ctx.globalAlpha = .06;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        const rx = l + 20 + i * 35;
        ctx.beginPath();
        ctx.moveTo(rx, t + 30 + i * 40);
        ctx.lineTo(rx + 8, t + 100 + i * 40);
        ctx.stroke();
    }
    ctx.restore();
    ctx.restore();

    // Danger line
    ctx.save();
    ctx.strokeStyle = 'rgba(255,100,100,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(l + 5, DANGER_Y);
    ctx.lineTo(r - 5, DANGER_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

function drawVaseWall(ctx, l, r, t, h, wallW, rimH) {
    const lwGrad = ctx.createLinearGradient(l - wallW, 0, l + 2, 0);
    lwGrad.addColorStop(0, 'rgba(160,180,200,0.35)');
    lwGrad.addColorStop(.5, 'rgba(200,220,240,0.2)');
    lwGrad.addColorStop(1, 'rgba(160,180,200,0.08)');
    ctx.fillStyle = lwGrad;
    ctx.fillRect(l - wallW, t - rimH, wallW + 2, h + rimH + wallW);

    const rwGrad = ctx.createLinearGradient(r - 2, 0, r + wallW, 0);
    rwGrad.addColorStop(0, 'rgba(160,180,200,0.08)');
    rwGrad.addColorStop(.5, 'rgba(200,220,240,0.2)');
    rwGrad.addColorStop(1, 'rgba(160,180,200,0.35)');
    ctx.fillStyle = rwGrad;
    ctx.fillRect(r - 2, t - rimH, wallW + 2, h + rimH + wallW);
}

function drawVaseBottom(ctx, l, r, b, w, wallW) {
    const bGrad = ctx.createLinearGradient(0, b, 0, b + wallW);
    bGrad.addColorStop(0, 'rgba(160,180,200,0.12)');
    bGrad.addColorStop(1, 'rgba(160,180,200,0.3)');
    ctx.fillStyle = bGrad;
    ctx.fillRect(l - wallW, b, w + wallW * 2, wallW);
}

function drawVaseRim(ctx, l, r, t, wallW, rimH) {
    ctx.strokeStyle = 'rgba(200,220,240,0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(l - wallW - 4, t - rimH);
    ctx.lineTo(l - wallW - 4, t - rimH - 5);
    ctx.quadraticCurveTo(l - wallW - 4, t - rimH - 10, l - wallW + 2, t - rimH - 10);
    ctx.lineTo(r + wallW - 2, t - rimH - 10);
    ctx.quadraticCurveTo(r + wallW + 4, t - rimH - 10, r + wallW + 4, t - rimH - 5);
    ctx.lineTo(r + wallW + 4, t - rimH);
    ctx.stroke();
}

/** Draw the flower being held by the player */
export function drawPreviewFlower(ctx, t) {
    if (!state.canDrop || state.gameState !== 'playing') return;
    const allFlowers = getAllFlowersWithGenerated();
    const f = allFlowers[state.currentLevel];
    const x = clamp(state.mouseX, VASE.l + f.radius + 5, VASE.r - f.radius - 5); // Use actual radius for boundary checks
    const cache = getFlowerCache(state.currentLevel);
    const r = f.radius;
    const bob = Math.sin(t * 3) * 3;

    ctx.save();
    ctx.globalAlpha = .7;
    ctx.translate(x, DROP_Y + bob);
    const sc = .85 + Math.sin(t * 2) * .05;
    ctx.scale(sc, sc);
    ctx.drawImage(cache.canvas, -cache.cx * 2, -cache.cy * 2, cache.canvas.width, cache.canvas.height);
    drawStamens(ctx, state.currentLevel, r, t, 0, 0);
    ctx.restore();

    // Guide line
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(x, DROP_Y + f.radius + 10 + bob);
    ctx.lineTo(x, VASE.b - 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    
    // Draw the generation number above the preview flower
    ctx.save();
    ctx.translate(x, DROP_Y + bob - r - 15); // Position above the flower (using same offset as in drawFlower)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px Georgia, "Times New Roman", serif'; // Using Georgia as required by spec with fallbacks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Slightly increased opacity
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)'; // Increased opacity for better contrast
    ctx.lineWidth = 2; // Increased line width for better visibility
    
    // Draw text with outline first, then fill
    ctx.strokeText(`${f.generationNumber || '?'}`, 0, 0);
    ctx.fillText(`${f.generationNumber || '?'}`, 0, 0);
    ctx.restore();
}

/** Draw next flower preview */
export function drawNextPreview(ctx, t) {
    if (state.gameState !== 'playing') return;
    const allFlowers = getAllFlowersWithGenerated();
    const f = allFlowers[state.nextLevel];
    const cache = getFlowerCache(state.nextLevel);
    const r = f.radius; // Use actual radius for display

    ctx.save();
    ctx.translate(VASE.r + 30, VASE.t + 30);
    ctx.globalAlpha = .5;
    ctx.scale(.5, .5);
    ctx.drawImage(cache.canvas, -cache.cx * 2, -cache.cy * 2, cache.canvas.width, cache.canvas.height);
    drawStamens(ctx, state.nextLevel, r, t, 1.5, 0);
    ctx.restore();

    // Draw the generation number above the next flower preview
    ctx.save();
    ctx.translate(VASE.r + 30, VASE.t + 30 - (r * 0.5) - 15); // Position above the flower (adjusting for the scale of 0.5)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px Georgia, "Times New Roman", serif'; // Using Georgia as required by spec with fallbacks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Slightly increased opacity
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)'; // Increased opacity for better contrast
    ctx.lineWidth = 2; // Increased line width for better visibility
    
    // Draw text with outline first, then fill
    ctx.strokeText(`${f.generationNumber || '?'}`, 0, 0);
    ctx.fillText(`${f.generationNumber || '?'}`, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('далее', VASE.r + 30, VASE.t + 10);
    ctx.restore();
}

/** Draw highest flower achieved */
export function drawHighestLevel(ctx) {
    if (state.highestLevel < 1) return;
    const allFlowers = getAllFlowersWithGenerated();
    const f = allFlowers[state.highestLevel];
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('лучший: ' + f.name, VASE.l - 5, VASE.t - 20);
    ctx.restore();
}

/** Draw game over overlay */
export function drawGameOver(ctx, dt) {
    if (state.gameState !== 'gameover') return;
    state.gameOverAlpha = Math.min(1, state.gameOverAlpha + dt * 1.5);
    const a = ease.inOutQuad(state.gameOverAlpha);

    ctx.save();
    ctx.fillStyle = `rgba(10,5,15,${a * .65})`;
    ctx.fillRect(0, 0, GW, GH);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#f0e0e8';
    ctx.font = 'bold 42px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Игра окончена', GW / 2, GH * .4);

    ctx.font = '20px Georgia';
    ctx.fillStyle = 'rgba(240,220,230,0.7)';
    const allFlowers = getAllFlowersWithGenerated();
    ctx.fillText('Лучший цветок: ' + allFlowers[state.highestLevel].name, GW / 2, GH * .4 + 50);

    ctx.font = '16px Georgia';
    ctx.fillStyle = 'rgba(240,220,230,0.5)';
    ctx.fillText('Нажмите кнопку, чтобы начать заново', GW / 2, GH * .4 + 90);
    ctx.restore();
}

const GAME_OVER_FLOWER_THRESHOLD = 3;

/** Draw pulsing red warning when close to game over */
export function drawGameOverWarning(ctx) {
    if (state.gameState !== 'playing') return;
    const count = state.outOfBoundsCount || 0;

    // Show counter badge when at least 1 flower is out of bounds
    if (count >= 1) {
        ctx.save();
        const badgeX = VASE.r + 18;
        const badgeY = VASE.t + 10;
        const isCritical = count >= 2;
        const pulse = isCritical ? (.5 + .5 * Math.sin(state.time * 8)) : 1;
        const alpha = isCritical ? (.6 + pulse * .4) : .5;

        // Badge background
        ctx.fillStyle = `rgba(255,60,60,${alpha * .85})`;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 14, 0, Math.PI * 2);
        ctx.fill();

        // Badge text
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(count + '/' + GAME_OVER_FLOWER_THRESHOLD, badgeX, badgeY);
        ctx.restore();
    }

    // Red border flash when timer is ticking (3+ flowers out)
    if (state.gameOverTimer < .5) return;
    const intensity = clamp((state.gameOverTimer - .5) / (GAME_OVER_GRACE - .5), 0, 1);
    const pulse = .5 + .5 * Math.sin(state.time * 8);
    const a = intensity * pulse * .3;

    ctx.save();
    ctx.strokeStyle = `rgba(255,60,60,${a})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(VASE.l - 2, VASE.t - 12, VASE.r - VASE.l + 4, VASE.b - VASE.t + 14);
    ctx.restore();
}

/** Draw a single flower (with squash/stretch, glow, stamens) */
export function drawFlower(ctx, flower, t) {
    const allFlowers = getAllFlowersWithGenerated();
    const f = allFlowers[flower.level];
    if (!f) return; // Exit early if flower data doesn't exist
    
    const pos = flower.body.position;
    const angle = flower.body.angle;
    // Use actual displayed radius regardless of collision size
    const r = f.radius;

    // On low-performance devices, simplify animations - removed FPS-based check since we removed the cap
    const perfConfig = window.PERFORMANCE_CONFIG || {};
    const shouldSimplifyAnimations = false; // Disable animation simplification since we removed FPS cap
    
    let scaleX = 1 + flower.squashS * .4;
    let scaleY = 1 - flower.squashS * .35;

    const vy = flower.body.velocity.y;
    if (vy > 2 && !flower.spawning) {
        const stretch = Math.min(vy * .012, .25);
        scaleY *= 1 + stretch;
        scaleX *= 1 - stretch * .4;
    }

    let breath = 0, sway = 0;
    if (!shouldSimplifyAnimations) {
        breath = Math.sin(t * 1.8 + flower.breathPhase) * .015;
        sway = Math.sin(t * 1.2 + flower.idlePhase) * .03;
    }
    scaleY *= 1 + breath;
    scaleX *= 1 - breath * .5;

    let spawnSc = 1;
    if (flower.spawning) {
        const sp = clamp(flower.spawnTimer / .5, 0, 1);
        spawnSc = ease.outElastic(sp);
    }

    let glowAlpha = 0;
    if (flower.mergeGlow > 0) {
        glowAlpha = flower.mergeGlow;
        flower.mergeGlow *= shouldSimplifyAnimations ? .88 : .92; // Faster fade on low performance
        if (flower.mergeGlow < .01) flower.mergeGlow = 0;
    }

    const cache = getFlowerCache(flower.level);
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle + sway);
    ctx.scale(scaleX * spawnSc, scaleY * spawnSc);

    if (glowAlpha > .01) {
        // Apply bloom effect based on performance
        visualEffects.addBloom(ctx, flower, pos, r, f.petalColor);
        
        ctx.save();
        ctx.shadowColor = rgba(f.petalColor, glowAlpha * .8);
        ctx.shadowBlur = shouldSimplifyAnimations ? r * .4 * glowAlpha : r * .8 * glowAlpha; // Less blur on low performance
        ctx.globalAlpha = glowAlpha * .5;
        ctx.drawImage(cache.canvas, -cache.cx * 2, -cache.cy * 2, cache.canvas.width, cache.canvas.height);
        ctx.restore();
    }
    ctx.drawImage(cache.canvas, -cache.cx * 2, -cache.cy * 2, cache.canvas.width, cache.canvas.height);
    
    // Draw stamens regardless of performance since we removed FPS limitations
    drawStamens(ctx, flower.level, r, t, flower.stamenPhase, flower.squashS);
    
    ctx.restore();
    
    // Draw the generation number above the flower regardless of performance since we removed FPS limitations
    ctx.save();
    ctx.translate(pos.x, pos.y - r - 15); // Position above the flower
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px Georgia, "Times New Roman", serif'; // Using Georgia as required by spec with fallbacks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Slightly increased opacity
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)'; // Increased opacity for better contrast
    ctx.lineWidth = 2; // Increased line width for better visibility
    
    // Draw text with outline first, then fill
    ctx.strokeText(`${f.generationNumber || '?'}`, 0, 0);
    ctx.fillText(`${f.generationNumber || '?'}`, 0, 0);
    ctx.restore();
    
    // Note: Selection indicator is now drawn in the main game loop to ensure proper layering
}