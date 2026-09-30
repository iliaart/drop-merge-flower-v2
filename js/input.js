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
        if (!flower || !flower.body) continue;
        
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

// Variable to track mouse/touch hold state instead of using global window variable
let isMouseDown = false;
// Coordinates where the pointer went down inside the vase — used to drop
// the flower on release (mouseup / touchend) instead of on press.
// There is NO automatic/continuous dropping: exactly one flower drops
// per press-and-release gesture.
let pendingDropX = null;
let pendingDropY = null;

export function stopContinuousDrop() {
    isMouseDown = false;
    window.isMouseDown = false; // For backward compatibility with other parts of code
    pendingDropX = null;
    pendingDropY = null;
}

// Make it globally available for performance.js
window.stopContinuousDrop = stopContinuousDrop;

/** Drop a flower at the stored press position when the pointer is released */
function performPendingDrop() {
    if (pendingDropX === null || pendingDropY === null) return;

    const x = pendingDropX;
    const y = pendingDropY;
    pendingDropX = null;
    pendingDropY = null;

    // Only drop if we're allowed to drop and the press was inside the vase
    if (x >= CONFIG.VASE.l && x <= CONFIG.VASE.r &&
        y >= CONFIG.VASE.t && y <= CONFIG.VASE.b &&
        state.canDrop && state.gameState === 'playing') {
        state.audio.ensure();
        dropFlower();
    }
}

/** Set up all input event listeners */
export function setupInput() {
    // Helper function to clamp value within bounds
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    // Function to smoothly move flower toward target position using forces
    function moveFlowerToPosition(flowerBody, targetX, targetY) {
        // Проверяем, что тело существует
        if (!flowerBody) return;
        
        // Get current position
        const currentPos = flowerBody.position;
        
        // Calculate desired position with constraints
        const allFlowers = getAllFlowersWithGenerated();
        const flowerData = allFlowers[state.selectedFlower.level];
        const radius = flowerData.radius;
        
        const constrainedX = clamp(targetX, CONFIG.VASE.l + radius, CONFIG.VASE.r - radius);
        const constrainedY = clamp(targetY, CONFIG.VASE.t + radius, CONFIG.VASE.b - radius);
        
        // Calculate difference vector
        const dx = constrainedX - currentPos.x;
        const dy = constrainedY - currentPos.y;
        
        // Apply force proportional to distance (spring-like behavior)
        const forceMultiplier = 0.1; // Adjust for responsiveness
        const forceX = dx * forceMultiplier;
        const forceY = dy * forceMultiplier;
        
        // Apply the force to the body
        state.Matter.Body.applyForce(flowerBody, currentPos, { x: forceX, y: forceY });
    }
    
    state.canvas.addEventListener('mousemove', e => {
        const p = screenToGame(e.clientX, e.clientY);
        state.mouseX = p.x;
        state.lastMouseX = p.x;
        state.lastMouseY = p.y;
        
        // Handle flower dragging
        if (state.isDragging && state.selectedFlower) {
            const flowerBody = state.selectedFlower.body;
            // Добавляем проверку на существование тела
            if (!flowerBody) return;
            
            const allFlowers = getAllFlowersWithGenerated();
            const flowerData = allFlowers[state.selectedFlower.level];
            const radius = flowerData.radius;

            // Clamp the position to stay within vase boundaries
            const clampedX = clamp(p.x, CONFIG.VASE.l + radius, CONFIG.VASE.r - radius);
            const clampedY = clamp(p.y, CONFIG.VASE.t + radius, CONFIG.VASE.b - radius);

            // Move the flower to the clamped mouse position
            state.Matter.Body.setPosition(flowerBody, { x: clampedX, y: clampedY });
            // Ensure gravity is disabled while dragging
            flowerBody.gravityScale = 0;
            // Ensure the body remains kinematic during dragging
            state.Matter.Body.setStatic(flowerBody, true);
            // Reset velocity to prevent physics interference
            state.Matter.Body.setVelocity(flowerBody, { x: 0, y: 0 });
            state.Matter.Body.setAngularVelocity(flowerBody, 0);
        }
    });

    state.canvas.addEventListener('click', e => {
        // Flower dropping is handled on mouseup/touchend now,
        // so we don't drop anything on click.
    });

    state.canvas.addEventListener('mousedown', e => {
        const p = screenToGame(e.clientX, e.clientY);
        state.lastMouseX = p.x;
        state.lastMouseY = p.y;
        isMouseDown = true;
        window.isMouseDown = true; // For backward compatibility with other parts of code
        
        // Check if clicking on a flower to start dragging
        const clickedFlower = getFlowerAtPosition(p.x, p.y);
        
        if (clickedFlower) {
            state.selectedFlower = clickedFlower;
            state.isDragging = true;
            // Disable gravity and make the flower kinematic when dragging starts
            const flowerBody = clickedFlower.body;
            // Проверяем, что тело существует
            if (!flowerBody) {
                state.isDragging = false;
                state.selectedFlower = null;
                return;
            }
            
            // Store original gravity scale to restore later
            clickedFlower.originalGravityScale = flowerBody.gravityScale;
            flowerBody.gravityScale = 0;
            state.Matter.Body.setStatic(flowerBody, true);
        } else {
            // If mouse is within vase area, remember it so we can drop on release
            if (p.x >= CONFIG.VASE.l && p.x <= CONFIG.VASE.r && 
                p.y >= CONFIG.VASE.t && p.y <= CONFIG.VASE.b) {
                state.selectedFlower = null;
                        
                // Only arm the drop if we're allowed to drop
                if (state.canDrop && state.gameState === 'playing') {
                    state.audio.ensure();
                    pendingDropX = p.x;
                    pendingDropY = p.y;
                }
            } else {
                // Mouse down outside vase area, just deselect
                state.selectedFlower = null;
            }
        }
    });

    state.canvas.addEventListener('mouseup', e => {
        // Drop the flower on release (button up), not on press
        performPendingDrop();
        stopContinuousDrop(); // Stop continuous drop when mouse is released
        // Stop dragging when mouse is released
        if (state.isDragging && state.selectedFlower) {
            // Get the current flower that was being dragged
            const flowerBeingDragged = state.selectedFlower;
            const flowerBody = flowerBeingDragged.body;
            
            // Проверяем, что тело существует перед работой с ним
            if (!flowerBody) {
                state.isDragging = false;
                state.selectedFlower = null;
                return;
            }
            
            // Store the current rotation state before destroying the flower
            const currentAngle = flowerBody.angle;
            const currentAngularVelocity = flowerBody.angularVelocity;
            
            // Get flower properties
            const level = flowerBeingDragged.level;
            const position = { x: flowerBody.position.x, y: flowerBody.position.y };
            
            // Remove the old flower
            const flowerIndex = state.flowers.indexOf(flowerBeingDragged);
            if (flowerIndex !== -1) {
                state.Matter.World.remove(state.world, flowerBody);
                state.flowers[flowerIndex] = null;
                
                // Clean up the flowers array
                state.flowers = state.flowers.filter(f => f !== null);
                state.flowers.forEach((f, i) => { 
                    if (f && f.body) {
                        f.body.flowerIdx = i; 
                    }
                });
            }
            
            // Reset the selected flower BEFORE creating the new flower to prevent any highlighting
            state.selectedFlower = null;
            
            // Create a new flower at the same position with preserved rotation
            const newFlower = window.createFlower(position.x, position.y, level);
            if (newFlower) {
                // Preserve the rotation state from the old flower
                state.Matter.Body.setAngle(newFlower.body, currentAngle);
                state.Matter.Body.setAngularVelocity(newFlower.body, currentAngularVelocity);
                
                // Make sure gravity is enabled for the new flower
                newFlower.body.gravityScale = flowerBeingDragged.originalGravityScale || 1;
                
                // Ensure the new flower is not selected - this is crucial to prevent yellow circle
                // Reset the selected flower BEFORE creating the new flower to prevent any highlighting
                state.selectedFlower = null;
            }
        } else {
            // If we weren't dragging a flower, just reset the selection
            state.selectedFlower = null;
        }
        state.isDragging = false;
    });

    state.canvas.addEventListener('mouseleave', e => {
        stopContinuousDrop(); // Stop continuous drop when mouse leaves canvas
        if (state.isDragging) {
            // Re-enable gravity if mouse leaves while dragging
            if (state.selectedFlower) {
                const flowerBody = state.selectedFlower.body;
                // Restore original gravity scale
                flowerBody.gravityScale = state.selectedFlower.originalGravityScale || 1;
            }
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
        isMouseDown = true;
        window.isMouseDown = true; // For backward compatibility with other parts of code
        
        // Touch support for flower selection
        const touchedFlower = getFlowerAtPosition(p.x, p.y);
        
        if (touchedFlower) {
            state.selectedFlower = touchedFlower;
            state.isDragging = true;
            // Disable gravity and make the flower kinematic when dragging starts
            const flowerBody = touchedFlower.body;
            // Проверяем, что тело существует
            if (!flowerBody) {
                state.isDragging = false;
                state.selectedFlower = null;
                return;
            }
            
            // Store original gravity scale to restore later
            touchedFlower.originalGravityScale = flowerBody.gravityScale;
            flowerBody.gravityScale = 0;
            state.Matter.Body.setStatic(flowerBody, true);
        } else {
            // If touching empty space within vase, deselect and remember the
            // position so the flower drops when the touch is released
            if (p.x >= CONFIG.VASE.l && p.x <= CONFIG.VASE.r && 
                p.y >= CONFIG.VASE.t && p.y <= CONFIG.VASE.b) {
                state.selectedFlower = null;
                        
                // Only arm the drop if we're allowed to drop
                if (state.canDrop && state.gameState === 'playing') {
                    state.audio.ensure();
                    pendingDropX = p.x;
                    pendingDropY = p.y;
                }
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
            // Добавляем проверку на существование тела
            if (!flowerBody) return;
            
            const allFlowers = getAllFlowersWithGenerated();
            const flowerData = allFlowers[state.selectedFlower.level];
            const radius = flowerData.radius;

            // Clamp the position to stay within vase boundaries
            const clampedX = clamp(p.x, CONFIG.VASE.l + radius, CONFIG.VASE.r - radius);
            const clampedY = clamp(p.y, CONFIG.VASE.t + radius, CONFIG.VASE.b - radius);

            state.Matter.Body.setPosition(flowerBody, { x: clampedX, y: clampedY });
            // Ensure gravity is disabled while dragging
            flowerBody.gravityScale = 0;
            // Ensure the body remains kinematic during dragging
            state.Matter.Body.setStatic(flowerBody, true);
            state.Matter.Body.setVelocity(flowerBody, { x: 0, y: 0 });
            state.Matter.Body.setAngularVelocity(flowerBody, 0);
        }
    }, { passive: false });

    state.canvas.addEventListener('touchend', e => {
        e.preventDefault();
        // Drop the flower on release (touch up), not on touch start
        performPendingDrop();
        stopContinuousDrop(); // Stop continuous drop on touch end
        // Stop dragging when touch is released
        if (state.isDragging && state.selectedFlower) {
            // Get the current flower that was being dragged
            const flowerBeingDragged = state.selectedFlower;
            const flowerBody = flowerBeingDragged.body;
            
            // Проверяем, что тело существует перед работой с ним
            if (!flowerBody) {
                state.isDragging = false;
                state.selectedFlower = null;
                return;
            }
            
            // Store the current rotation state before destroying the flower
            const currentAngle = flowerBody.angle;
            const currentAngularVelocity = flowerBody.angularVelocity;
            
            // Get flower properties
            const level = flowerBeingDragged.level;
            const position = { x: flowerBody.position.x, y: flowerBody.position.y };
            
            // Remove the old flower
            const flowerIndex = state.flowers.indexOf(flowerBeingDragged);
            if (flowerIndex !== -1) {
                state.Matter.World.remove(state.world, flowerBody);
                state.flowers[flowerIndex] = null;
                
                // Clean up the flowers array
                state.flowers = state.flowers.filter(f => f !== null);
                state.flowers.forEach((f, i) => { 
                    if (f && f.body) {
                        f.body.flowerIdx = i; 
                    }
                });
            }
            
            // Create a new flower at the same position with preserved rotation
            const newFlower = window.createFlower(position.x, position.y, level);
            if (newFlower) {
                // Preserve the rotation state from the old flower
                state.Matter.Body.setAngle(newFlower.body, currentAngle);
                state.Matter.Body.setAngularVelocity(newFlower.body, currentAngularVelocity);
                
                // Make sure gravity is enabled for the new flower
                newFlower.body.gravityScale = flowerBeingDragged.originalGravityScale || 1;
                
                // Ensure the new flower is not selected - this is crucial to prevent yellow circle
                state.selectedFlower = null;
            }
        }
        state.isDragging = false;
    }, { passive: false });

    window.addEventListener('resize', resizeCanvas);
}