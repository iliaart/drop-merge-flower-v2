// Input Module — canvas resize, mouse/touch input, coordinate conversion
import { state } from './state.js';
import { CONFIG } from './config.js';
import { dropFlower } from './game.js';
import { getAllFlowersWithGenerated } from './random-flowers.js';

const { GW, GH } = CONFIG;

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
    // Helper function to clamp value within bounds
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    state.canvas.addEventListener('mousemove', e => {
        const p = screenToGame(e.clientX, e.clientY);
        state.mouseX = p.x;
        
        // Handle flower dragging
        if (state.isDragging && state.selectedFlower) {
            const flowerBody = state.selectedFlower.body;
            const allFlowers = getAllFlowersWithGenerated();
            const flowerData = allFlowers[state.selectedFlower.level];
            const radius = flowerData.radius;
            
            // Clamp the position to stay within vase boundaries
            const clampedX = clamp(p.x, CONFIG.VASE.l + radius, CONFIG.VASE.r - radius);
            const clampedY = clamp(p.y, CONFIG.VASE.t + radius, CONFIG.VASE.b - radius);
            
            // Move the flower to the clamped mouse position
            state.Matter.Body.setPosition(flowerBody, { x: clampedX, y: clampedY });
            // Reset velocity to prevent physics interference
            state.Matter.Body.setVelocity(flowerBody, { x: 0, y: 0 });
            state.Matter.Body.setAngularVelocity(flowerBody, 0);
        }
    });

    state.canvas.addEventListener('click', e => {
        const p = screenToGame(e.clientX, e.clientY);
        state.lastMouseX = p.x;
        state.lastMouseY = p.y;
        
        // Check if clicking on an existing flower
        const clickedFlower = getFlowerAtPosition(p.x, p.y);
        
        if (clickedFlower) {
            // Select the flower if not already selected
            if (state.selectedFlower !== clickedFlower) {
                state.selectedFlower = clickedFlower;
            }
        } else {
            // If clicking on empty space within vase, deselect and potentially drop a new flower
            if (p.x >= CONFIG.VASE.l && p.x <= CONFIG.VASE.r && 
                p.y >= CONFIG.VASE.t && p.y <= CONFIG.VASE.b) {
                state.selectedFlower = null;
                state.audio.ensure();
                dropFlower();
            } else {
                // Clicked outside vase area, just deselect
                state.selectedFlower = null;
            }
        }
    });

    state.canvas.addEventListener('mousedown', e => {
        const p = screenToGame(e.clientX, e.clientY);
        state.lastMouseX = p.x;
        state.lastMouseY = p.y;
        isMouseDown = true;
        
        // Check if clicking on a flower to start dragging
        const clickedFlower = getFlowerAtPosition(p.x, p.y);
        
        if (clickedFlower) {
            state.selectedFlower = clickedFlower;
            state.isDragging = true;
        } else {
            // If mouse is within vase area, start continuous dropping
            if (p.x >= CONFIG.VASE.l && p.x <= CONFIG.VASE.r && 
                p.y >= CONFIG.VASE.t && p.y <= CONFIG.VASE.b) {
                state.selectedFlower = null;
                        
                // Set the global mouse down state
                window.isMouseDown = true;
                        
                state.audio.ensure();
                dropFlower();
            } else {
                // Mouse down outside vase area, just deselect
                state.selectedFlower = null;
            }
        }
    });

    state.canvas.addEventListener('mouseup', e => {
        // Reset the global mouse down state
        window.isMouseDown = false;
        // Stop dragging when mouse is released
        if (state.isDragging && state.selectedFlower) {
            // Check if the flower was dropped in the vase area
            const flowerPos = state.selectedFlower.body.position;
            if (flowerPos.x >= CONFIG.VASE.l && flowerPos.x <= CONFIG.VASE.r && 
                flowerPos.y >= CONFIG.VASE.t && flowerPos.y <= CONFIG.VASE.b) {
                // Flower is in the vase, keep it there
                // You could add additional logic here if needed
            } else {
                // Flower is outside the vase, you might want to remove it or return it
                // For now, we'll just stop dragging
            }
        }
        state.isDragging = false;
    });

    state.canvas.addEventListener('mouseleave', e => {
        // Reset the global mouse down state when mouse leaves canvas
        window.isMouseDown = false;
        if (state.isDragging) {
            state.isDragging = false;
        }
    });

    state.canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        const touch = e.touches[0];
        const p = screenToGame(touch.clientX, touch.clientY);
        state.mouseX = p.x;
        state.lastMouseX = p.x;
        state.lastMouseY = p.y;
        
        // Touch support for flower selection
        const touchedFlower = getFlowerAtPosition(p.x, p.y);
        
        if (touchedFlower) {
            state.selectedFlower = touchedFlower;
            state.isDragging = true;
        } else {
            // If touching empty space within vase, deselect and start continuous drop
            if (p.x >= CONFIG.VASE.l && p.x <= CONFIG.VASE.r && 
                p.y >= CONFIG.VASE.t && p.y <= CONFIG.VASE.b) {
                state.selectedFlower = null;
                        
                // Set the global mouse down state for touch
                window.isMouseDown = true;
                        
                state.audio.ensure();
                dropFlower();
            } else {
                // Touch outside vase area, just deselect
                state.selectedFlower = null;
            }
        }
    }, { passive: false });

    state.canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const touch = e.touches[0];
        const p = screenToGame(touch.clientX, touch.clientY);
        state.mouseX = p.x;
        state.lastMouseX = p.x;
        state.lastMouseY = p.y;
        
        // Handle dragging during touch move
        if (state.isDragging && state.selectedFlower) {
            const flowerBody = state.selectedFlower.body;
            const allFlowers = getAllFlowersWithGenerated();
            const flowerData = allFlowers[state.selectedFlower.level];
            const radius = flowerData.radius;
            
            // Clamp the position to stay within vase boundaries
            const clampedX = clamp(p.x, CONFIG.VASE.l + radius, CONFIG.VASE.r - radius);
            const clampedY = clamp(p.y, CONFIG.VASE.t + radius, CONFIG.VASE.b - radius);
            
            state.Matter.Body.setPosition(flowerBody, { x: clampedX, y: clampedY });
            state.Matter.Body.setVelocity(flowerBody, { x: 0, y: 0 });
            state.Matter.Body.setAngularVelocity(flowerBody, 0);
        }
    }, { passive: false });

    state.canvas.addEventListener('touchend', e => {
        e.preventDefault();
        stopContinuousDrop(); // Stop continuous drop on touch end
        state.isDragging = false;
    }, { passive: false });

    window.addEventListener('resize', resizeCanvas);
}