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

// Variable to track mouse/touch hold state instead of using global window variable
let isMouseDown = false;
let continuousDropInterval = null;

function stopContinuousDrop() {
    isMouseDown = false;
    window.isMouseDown = false; // For backward compatibility with other parts of code
    
    // Clear the interval for continuous dropping
    if (continuousDropInterval) {
        clearInterval(continuousDropInterval);
        continuousDropInterval = null;
    }
}

// Function to handle continuous dropping
function startContinuousDrop() {
    // Ensure we don't create multiple intervals
    if (continuousDropInterval) {
        clearInterval(continuousDropInterval);
    }
    
    // Create an interval that drops a flower every 300ms (the cooldown period)
    continuousDropInterval = setInterval(() => {
        if (isMouseDown && state.canDrop && state.gameState === 'playing') {
            const allFlowers = getAllFlowersWithGenerated();
            if (allFlowers.length > 0 && state.mouseX >= CONFIG.VASE.l && state.mouseX <= CONFIG.VASE.r) {
                state.audio.ensure();
                dropFlower();
            }
        }
    }, 300); // Match the cooldown period
}

/** Set up all input event listeners */
export function setupInput() {
    // Helper function to clamp value within bounds
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    // Function to smoothly move flower toward target position using forces
    function moveFlowerToPosition(flowerBody, targetX, targetY) {
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
                if (state.canDrop && state.gameState === 'playing') {
                    state.audio.ensure();
                    dropFlower();
                }
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
        window.isMouseDown = true; // For backward compatibility with other parts of code
        
        // Check if clicking on a flower to start dragging
        const clickedFlower = getFlowerAtPosition(p.x, p.y);
        
        if (clickedFlower) {
            state.selectedFlower = clickedFlower;
            state.isDragging = true;
            // Disable gravity and make the flower kinematic when dragging starts
            const flowerBody = clickedFlower.body;
            // Store original gravity scale to restore later
            clickedFlower.originalGravityScale = flowerBody.gravityScale;
            flowerBody.gravityScale = 0;
            state.Matter.Body.setStatic(flowerBody, true);
        } else {
            // If mouse is within vase area, start continuous dropping
            if (p.x >= CONFIG.VASE.l && p.x <= CONFIG.VASE.r && 
                p.y >= CONFIG.VASE.t && p.y <= CONFIG.VASE.b) {
                state.selectedFlower = null;
                        
                // Only start continuous drop if we're allowed to drop
                if (state.canDrop && state.gameState === 'playing') {
                    state.audio.ensure();
                    dropFlower();
                    startContinuousDrop();
                }
            } else {
                // Mouse down outside vase area, just deselect
                state.selectedFlower = null;
            }
        }
    });

    state.canvas.addEventListener('mouseup', e => {
        stopContinuousDrop(); // Stop continuous drop when mouse is released
        // Stop dragging when mouse is released, but keep the flower selected
        if (state.isDragging) {
            // Re-enable gravity for the flower when dragging stops
            if (state.selectedFlower) {
                const flowerBody = state.selectedFlower.body;
                // Restore original gravity scale
                flowerBody.gravityScale = state.selectedFlower.originalGravityScale || 1;
            }
            state.isDragging = false;
        }
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
            // Store original gravity scale to restore later
            touchedFlower.originalGravityScale = flowerBody.gravityScale;
            flowerBody.gravityScale = 0;
            state.Matter.Body.setStatic(flowerBody, true);
        } else {
            // If touching empty space within vase, deselect and start continuous drop
            if (p.x >= CONFIG.VASE.l && p.x <= CONFIG.VASE.r && 
                p.y >= CONFIG.VASE.t && p.y <= CONFIG.VASE.b) {
                state.selectedFlower = null;
                        
                // Only start continuous drop if we're allowed to drop
                if (state.canDrop && state.gameState === 'playing') {
                    state.audio.ensure();
                    dropFlower();
                    startContinuousDrop();
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
        stopContinuousDrop(); // Stop continuous drop on touch end
        // Stop dragging when touch is released
        if (state.isDragging && state.selectedFlower) {
            // Re-enable gravity for the flower when dragging stops
            const flowerBody = state.selectedFlower.body;
            // Restore original gravity scale
            flowerBody.gravityScale = state.selectedFlower.originalGravityScale || 1;
        }
        state.isDragging = false;
    }, { passive: false });

    window.addEventListener('resize', resizeCanvas);
}