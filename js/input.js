// Input Module — canvas resize, mouse/touch input, coordinate conversion
import { state } from './state.js';
import { CONFIG } from './config.js';
import { dropFlower } from './game.js';
import { getAllFlowersWithGenerated } from './random-flowers.js';

const { GW, GH, VASE } = CONFIG;

/** Resize canvas to fit viewport while maintaining game aspect ratio */
export function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const gameAspect = GW / GH;
    const viewAspect = vw / vh;

    let cw, ch;
    if (viewAspect > gameAspect) {
        ch = vh;
        cw = ch * gameAspect;
    } else {
        cw = vw;
        ch = cw / gameAspect;
    }

    state.canvas.style.width = cw + 'px';
    state.canvas.style.height = ch + 'px';
    state.canvas.width = GW * dpr;
    state.canvas.height = GH * dpr;
    state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    state.canvasScale = cw / GW;
    state.canvasOffsetX = (vw - cw) / 2;
    state.canvasOffsetY = (vh - ch) / 2;
    state.canvas.style.position = 'absolute';
    state.canvas.style.left = state.canvasOffsetX + 'px';
    state.canvas.style.top = state.canvasOffsetY + 'px';
}

/** Convert screen coordinates to game coordinates */
export function screenToGame(sx, sy) {
    return {
        x: (sx - state.canvasOffsetX) / state.canvasScale,
        y: (sy - state.canvasOffsetY) / state.canvasScale,
    };
}

/** Find flower at given coordinates */
function getFlowerAtPosition(x, y) {
    for (let i = 0; i < state.flowers.length; i++) {
        const flower = state.flowers[i];
        if (!flower) continue;
        
        const pos = flower.body.position;
        const allFlowers = getAllFlowersWithGenerated();
        const flowerData = allFlowers[flower.level];
        // Use actual displayed radius regardless of collision size for selection
        const radius = flowerData.radius;
        
        const dx = pos.x - x;
        const dy = pos.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= radius) {
            return flower;
        }
    }
    return null;
}

/** Set up all input event listeners */
export function setupInput() {
    state.canvas.addEventListener('mousemove', e => {
        const p = screenToGame(e.clientX, e.clientY);
        state.mouseX = p.x;
        
        // Handle flower dragging
        if (state.isDragging && state.selectedFlower) {
            const flowerBody = state.selectedFlower.body;
            // Move the flower to the mouse position
            state.Matter.Body.setPosition(flowerBody, { x: p.x, y: p.y });
            // Reset velocity to prevent physics interference
            state.Matter.Body.setVelocity(flowerBody, { x: 0, y: 0 });
            state.Matter.Body.setAngularVelocity(flowerBody, 0);
        }
    });

    state.canvas.addEventListener('click', e => {
        const p = screenToGame(e.clientX, e.clientY);
        
        // Check if clicking on an existing flower
        const clickedFlower = getFlowerAtPosition(p.x, p.y);
        
        if (clickedFlower) {
            // Select the flower if not already selected
            if (state.selectedFlower !== clickedFlower) {
                state.selectedFlower = clickedFlower;
            }
        } else {
            // If clicking on empty space in the vase area and can drop, trigger dropFlower
            if (p.x >= VASE.l && p.x <= VASE.r && p.y >= VASE.t && p.y <= VASE.b) {
                if (state.canDrop) {
                    // Update mouse position and trigger flower drop
                    state.mouseX = p.x;
                    dropFlower();
                }
            }
            // Deselect any selected flower
            state.selectedFlower = null;
        }
    });

    state.canvas.addEventListener('mousedown', e => {
        const p = screenToGame(e.clientX, e.clientY);
        
        // Check if clicking on a flower to start dragging
        const clickedFlower = getFlowerAtPosition(p.x, p.y);
        
        if (clickedFlower) {
            state.selectedFlower = clickedFlower;
            state.isDragging = true;
        } else {
            // If clicking on empty space in the vase area, prepare for a new flower drop
            if (p.x >= VASE.l && p.x <= VASE.r && p.y >= VASE.t && p.y <= VASE.b) {
                state.mouseX = p.x;
                state.selectedFlower = null;
            }
        }
    });

    state.canvas.addEventListener('mouseup', e => {
        // Stop dragging when mouse is released
        if (state.isDragging && state.selectedFlower) {
            // Check if the flower was dropped in the vase area
            const flowerPos = state.selectedFlower.body.position;
            if (flowerPos.x >= VASE.l && flowerPos.x <= VASE.r && 
                flowerPos.y >= VASE.t && flowerPos.y <= VASE.b) {
                // Flower is in the vase, keep it there
            } else {
                // Flower is outside the vase
            }
        }
        state.isDragging = false;
    });

    state.canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        state.audio.ensure();
        const touch = e.touches[0];
        const p = screenToGame(touch.clientX, touch.clientY);
        state.mouseX = p.x;
        
        // Touch support for flower selection
        const touchedFlower = getFlowerAtPosition(p.x, p.y);
        
        if (touchedFlower) {
            state.selectedFlower = touchedFlower;
            state.isDragging = true;
        } else {
            // If touching empty space in the vase area and can drop, try to drop a flower
            if (p.x >= VASE.l && p.x <= VASE.r && p.y >= VASE.t && p.y <= VASE.b) {
                if (state.canDrop) {
                    state.mouseX = p.x;
                    dropFlower();
                }
            }
            state.selectedFlower = null;
        }
    }, { passive: false });

    state.canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const touch = e.touches[0];
        const p = screenToGame(touch.clientX, touch.clientY);
        state.mouseX = p.x;
        
        // Handle dragging during touch move
        if (state.isDragging && state.selectedFlower) {
            const flowerBody = state.selectedFlower.body;
            state.Matter.Body.setPosition(flowerBody, { x: p.x, y: p.y });
            state.Matter.Body.setVelocity(flowerBody, { x: 0, y: 0 });
            state.Matter.Body.setAngularVelocity(flowerBody, 0);
        }
    }, { passive: false });

    state.canvas.addEventListener('touchend', e => {
        e.preventDefault();
        
        // Check if we were dragging a flower and released it
        if (state.isDragging && state.selectedFlower) {
            // Check if the flower was dropped in the vase area
            const flowerPos = state.selectedFlower.body.position;
            if (flowerPos.x >= VASE.l && flowerPos.x <= VASE.r && 
                flowerPos.y >= VASE.t && flowerPos.y <= VASE.b) {
                // Flower is in the vase, keep it there
            } else {
                // Flower is outside the vase
            }
        }
        state.isDragging = false;
    }, { passive: false });

    window.addEventListener('resize', resizeCanvas);
}