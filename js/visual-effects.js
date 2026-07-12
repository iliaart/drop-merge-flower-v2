// Enhanced Visual Effects Module
import { rand, TAU, rgba } from './utils.js';
import { getAllFlowersWithGenerated } from './random-flowers.js';

// Base Effect class for inheritance
export class BaseEffect {
    constructor(type, x, y, options = {}) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.options = options;
        this.life = options.life || 1.0;
        this.maxLife = this.life;
        this.particles = [];
        this.generateParticles();
    }
    
    generateParticles() {
        // Base particle generation (can be overridden)
        const perfConfig = window.PERFORMANCE_CONFIG || {};
        // Removed performance-based check since we removed FPS limitations
        
        const count = this.options.count || 10;
        const color = this.options.color || '#ffffff';
        
        for (let i = 0; i < count; i++) {
            const angle = rand(0, TAU);
            const speed = rand(20, 80);
            const size = rand(1, 4);
            
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                life: this.maxLife,
                color: color,
                alpha: 1.0
            });
        }
    }
    
    update(dt) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 100 * dt; // Gravity
            
            p.life -= dt;
            p.alpha = Math.max(0, p.life / this.maxLife);
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        this.life -= dt;
        return this.life > 0 && this.particles.length > 0;
    }
    
    draw(ctx) {
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, TAU);
            ctx.fill();
            ctx.restore();
        }
    }
}

// Particle Effect class extending BaseEffect
export class ParticleEffect extends BaseEffect {
    constructor(type, x, y, options = {}) {
        super(type, x, y, options);
    }
}

// Merge Ring Effect class extending BaseEffect
export class MergeRingEffect extends BaseEffect {
    constructor(x, y, options = {}) {
        super('mergeRing', x, y, options);
        this.startTime = Date.now();
        this.duration = options.duration || 800;
        this.maxSize = options.maxSize || 100;
        this.canvas = options.canvas || null;
        this.color = options.color || '#ffffff';
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            return false;
        }
        return true;
    }
    
    draw(ctx) {
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        
        if (progress < 1 && this.canvas) {
            ctx.save();
            // Scale the ring over time to create expanding effect
            const scale = 0.1 + progress * 1.2; // Scale from 0.1x to 1.3x - more controlled expansion
            const alpha = 1 - progress; // Fade out as time passes
            
            ctx.globalAlpha = alpha;
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale);
            
            // Draw the ring from pre-rendered canvas - center it properly
            const canvasOffset = this.canvas.width / 2;
            ctx.drawImage(this.canvas, -canvasOffset, -canvasOffset);
            
            ctx.restore();
        }
    }
}

// Bloom/Glow effect class for flowers
export class BloomEffect {
    constructor() {
        this.enabled = true;
        this.intensity = 1.0;
        this.blur = 10;
        // Cache bloom canvas to avoid recreating gradients each frame
        this.bloomCache = new Map();
        this.cacheMaxSize = 5; // Limit cache size to prevent memory issues
    }
    
    // Apply bloom effect to a flower
    apply(ctx, flower, position, radius, petalColor) {
        // Skip bloom on low-performance devices - removed since we removed FPS limitations
        const perfConfig = window.PERFORMANCE_CONFIG || {};
        if (!this.enabled) return; // Only check if effects are disabled
        
        // Use simplified bloom effect on mobile devices
        if (perfConfig.isMobile) {
            this.applySimpleBloom(ctx, position, radius, petalColor);
            return;
        }
        
        // Create a bloom/glow effect around the flower
        const bloomRadius = radius * (1.2 + 0.3 * Math.sin(Date.now() * 0.005));
        const cacheKey = `${Math.round(bloomRadius)}_${petalColor}`;
        
        let cachedCanvas = this.bloomCache.get(cacheKey);
        if (!cachedCanvas) {
            // Create new cached canvas
            cachedCanvas = document.createElement('canvas');
            const cachedCtx = cachedCanvas.getContext('2d');
            cachedCanvas.width = bloomRadius * 4;
            cachedCanvas.height = bloomRadius * 4;
            
            const gradient = cachedCtx.createRadialGradient(
                bloomRadius * 2, bloomRadius * 2, radius * 0.5,
                bloomRadius * 2, bloomRadius * 2, bloomRadius
            );
            
            gradient.addColorStop(0, `${petalColor}00`); // Fully transparent at center
            gradient.addColorStop(0.5, `${petalColor}40`); // Semi-transparent mid
            gradient.addColorStop(1, `${petalColor}00`); // Fully transparent at edge
            
            cachedCtx.save();
            cachedCtx.globalAlpha = 0.3 * this.intensity;
            cachedCtx.shadowColor = petalColor;
            cachedCtx.shadowBlur = this.blur * this.intensity;
            cachedCtx.fillStyle = gradient;
            cachedCtx.beginPath();
            cachedCtx.arc(bloomRadius * 2, bloomRadius * 2, bloomRadius, 0, TAU);
            cachedCtx.fill();
            cachedCtx.restore();
            
            // Manage cache size
            if (this.bloomCache.size >= this.cacheMaxSize) {
                const firstKey = this.bloomCache.keys().next().value;
                this.bloomCache.delete(firstKey);
            }
            this.bloomCache.set(cacheKey, cachedCanvas);
        }
        
        ctx.save();
        ctx.globalAlpha = 0.3 * this.intensity;
        ctx.shadowColor = petalColor;
        ctx.shadowBlur = this.blur * this.intensity;
        ctx.drawImage(cachedCanvas, position.x - bloomRadius * 2, position.y - bloomRadius * 2);
        ctx.restore();
    }
    
    // Simplified bloom effect for mobile devices
    applySimpleBloom(ctx, position, radius, petalColor) {
        const bloomRadius = radius * 1.3;
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = petalColor;
        ctx.beginPath();
        ctx.arc(position.x, position.y, bloomRadius, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
}


// Visual effect manager that handles all effects
export class VisualEffectManager {
    constructor() {
        this.effects = [];
        this.bloomEffect = new BloomEffect();
        this.effectEnabled = true;
    }
    
    // Add a new effect
    addEffect(type, x, y, options = {}) {
        // Skip effects on low-performance devices - removed since we removed FPS limitations
        const perfConfig = window.PERFORMANCE_CONFIG || {};
        // Removed performance-based check since we removed FPS limitations
        
        const effect = new ParticleEffect(type, x, y, options);
        this.effects.push(effect);
    }
    
    // Update all effects
    update(dt) {
        // Skip updates on very low-performance devices - removed since we removed FPS limitations
        const perfConfig = window.PERFORMANCE_CONFIG || {};
        // Removed performance-based check since we removed FPS limitations
        
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            
            // Call the effect's own update method
            if (typeof effect.update === 'function') {
                if (!effect.update(dt)) {
                    this.effects.splice(i, 1);
                }
            } else {
                // Handle plain object effects (fallback)
                if (effect.type === 'mergeRing') {
                    const elapsed = Date.now() - effect.startTime;
                    if (elapsed >= effect.duration) {
                        this.effects.splice(i, 1);
                    }
                } else {
                    this.effects.splice(i, 1);
                }
            }
        }
    }
    
    // Draw all effects
    draw(ctx) {
        // Skip drawing on very low-performance devices - removed since we removed FPS limitations
        const perfConfig = window.PERFORMANCE_CONFIG || {};
        // Removed performance-based check since we removed FPS limitations
        
        for (const effect of this.effects) {
            effect.draw(ctx);
        }
    }
    
    // Create a bloom effect for a flower
    addBloom(ctx, flower, position, radius, petalColor) {
        this.bloomEffect.apply(ctx, flower, position, radius, petalColor);
    }
    
    // Create merge particles
    createMergeEffect(x, y, level, colorA, colorB) {
        // Use colors of the merging flowers if provided, otherwise get from new flower
        let petalColorA, petalColorB;
        
        if (colorA && colorB) {
            // Use the provided colors from the merging flowers
            petalColorA = colorA;
            petalColorB = colorB;
        } else {
            // Fallback to getting colors from the new flower if colors not provided
            const allFlowers = getAllFlowersWithGenerated();
            const f = allFlowers[level];
            const defaultColor = f ? f.petalColor : '#FFAABB';
            petalColorA = defaultColor;
            petalColorB = defaultColor;
        }
        
        // Blend the two colors for a combined effect
        const blendedColor = this.blendColors(petalColorA, petalColorB);
        
        // Reduce effect intensity on lower performance devices - removed since we removed FPS limitations
        const perfConfig = window.PERFORMANCE_CONFIG || {};
        const intensity = 1.0; // Full intensity since we removed FPS limitations
        
        // Create primary particles - more intense and longer lasting
        this.addEffect('merge', x, y, {
            count: Math.floor(12 * intensity), // Increased from 8
            color: blendedColor, // Use blended color of both merging flowers
            life: 1.2 // Increased from 0.8 for more visibility
        });
        
        // Create secondary particles - also enhanced
        this.addEffect('merge', x, y, {
            count: Math.floor(8 * intensity), // Increased from 5
            color: lightenColor(blendedColor, 0.3), // Lighter version of the blended color
            life: 0.8 // Increased from 0.5 for more visibility
        });

        // Create additional ring effect for merge - more prominent and closer to merge location
        this.createMergeRingEffect(x, y, blendedColor); // Pass the blended color to the ring
    }
    
    // Helper method to blend two colors
    blendColors(color1, color2) {
        // Parse both colors to RGB
        const rgb1 = this.parseColorString(color1);
        const rgb2 = this.parseColorString(color2);
        
        // Average the RGB values
        const avgR = Math.floor((rgb1.r + rgb2.r) / 2);
        const avgG = Math.floor((rgb1.g + rgb2.g) / 2);
        const avgB = Math.floor((rgb1.b + rgb2.b) / 2);
        
        // Convert back to hex
        return '#' + 
            avgR.toString(16).padStart(2, '0') +
            avgG.toString(16).padStart(2, '0') +
            avgB.toString(16).padStart(2, '0');
    }
    
    // Helper method to parse color string (similar to existing parseColorString)
    parseColorString(colorStr) {
        // Handle undefined, null or non-string inputs
        if (!colorStr || typeof colorStr !== 'string') {
            return { r: 255, g: 170, b: 188 }; // Default pink color
        }
        
        // Handle hex color
        if (colorStr.startsWith('#')) {
            let color = colorStr.replace('#', '');
            if (color.length === 3) {
                color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
            }
            
            // Validate color string length
            if (color.length !== 6) {
                return { r: 255, g: 170, b: 188 }; // Default pink color
            }
            
            const r = parseInt(color.substring(0, 2), 16);
            const g = parseInt(color.substring(2, 4), 16);
            const b = parseInt(color.substring(4, 6), 16);
            
            // Check if parsing failed
            if (isNaN(r) || isNaN(g) || isNaN(b)) {
                return { r: 255, g: 170, b: 188 }; // Default pink color
            }
            
            return { r, g, b };
        }
        // Handle rgba/rgb strings
        else if (colorStr.startsWith('rgb')) {
            const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (match) {
                return {
                    r: parseInt(match[1]),
                    g: parseInt(match[2]),
                    b: parseInt(match[3])
                };
            }
        }
        // Default fallback
        return { r: 255, g: 170, b: 188 }; // Default pink color
    }
    
    // Create additional ring effect for merge events
    createMergeRingEffect(x, y, color) {
        // Create a temporary canvas for the ring effect
        const ringCanvas = document.createElement('canvas');
        const ringCtx = ringCanvas.getContext('2d');
        const maxSize = 200; // Increased size to double - Maximum size of the ring
        ringCanvas.width = maxSize * 2;
        ringCanvas.height = maxSize * 2;
        
        // Draw multiple concentric rings with glow effects on temporary canvas
        ringCtx.save();
        ringCtx.translate(maxSize, maxSize);
        
        // Draw multiple rings for a more complex effect - increased sizes
        const ringRadii = [24, 40, 60]; // Doubled ring positions for bigger size
        const opacities = [0.7, 0.5, 0.3]; // Different opacities for each ring
        
        // Ensure color is a valid string format
        const validColor = color || '#FFAABB';
        
        for (let i = 0; i < ringRadii.length; i++) {
            const radius = ringRadii[i];
            
            // Draw glow effect
            ringCtx.shadowColor = validColor;
            ringCtx.shadowBlur = 35; // Increased glow effect for bigger rings
            ringCtx.lineWidth = 5; // Doubled line width for thicker rings
            
            // Create a safer rgba color string
            const rgbaColor = this.createRgbaColor(validColor, opacities[i]);
            ringCtx.strokeStyle = rgbaColor;
            ringCtx.beginPath();
            ringCtx.arc(0, 0, radius, 0, TAU);
            ringCtx.stroke();
            
            // Draw inner highlight for more glow effect
            ringCtx.shadowBlur = 15;
            ringCtx.lineWidth = 2.4; // Doubled line width for thicker highlight
            const highlightColor = this.createRgbaColor(this.safeLightenColor(validColor, 0.4), opacities[i] * 0.6);
            ringCtx.strokeStyle = highlightColor;
            ringCtx.beginPath();
            ringCtx.arc(0, 0, radius * 0.8, 0, TAU);
            ringCtx.stroke();
        }
        
        // Add a central glow spot
        const centerGradient = ringCtx.createRadialGradient(0, 0, 0, 0, 0, 20); // Doubled size
        const centerColor = this.createRgbaColor(this.safeLightenColor(validColor, 0.6), 0.8);
        const baseColor = this.createRgbaColor(validColor, 0);
        centerGradient.addColorStop(0, centerColor);
        centerGradient.addColorStop(1, baseColor);
        ringCtx.fillStyle = centerGradient;
        ringCtx.beginPath();
        ringCtx.arc(0, 0, 20, 0, TAU); // Doubled size
        ringCtx.fill();
        
        ringCtx.restore();
        
        // Create a proper MergeRingEffect instance instead of a plain object
        const ringEffect = new MergeRingEffect(x, y, {
            duration: 800, // Slightly longer duration for bigger effect
            maxSize: maxSize,
            color: validColor,
            canvas: ringCanvas
        });
        
        this.effects.push(ringEffect);
    }
    
    // Helper method to safely create rgba color
    createRgbaColor(color, alpha) {
        // If color is already in rgba format, adjust alpha
        if (color.startsWith('rgba')) {
            const parts = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (parts) {
                return `rgba(${parts[1]},${parts[2]},${parts[3]},${alpha})`;
            }
        } else if (color.startsWith('rgb')) {
            // Handle rgb format
            const parts = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (parts) {
                return `rgba(${parts[1]},${parts[2]},${parts[3]},${alpha})`;
            }
        } else if (color.startsWith('#')) {
            // Convert hex to rgba
            let hex = color.replace('#', '');
            if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                return `rgba(${r},${g},${b},${alpha})`;
            }
        }
        // Default fallback
        return `rgba(255,170,188,${alpha})`; // Default pink color
    }
    
    // Helper method to safely lighten color
    safeLightenColor(hexColor, amount) {
        return lightenColor(hexColor, amount);
    }
    
    // Create drop particles
    createDropEffect(x, y, level) {
        const allFlowers = getAllFlowersWithGenerated();
        const f = allFlowers[level];
        if (!f) return;
        
        // Reduce effect intensity on lower performance devices - removed since we removed FPS limitations
        const perfConfig = window.PERFORMANCE_CONFIG || {};
        const intensity = 1.0; // Full intensity since we removed FPS limitations
        
        this.addEffect('drop', x, y, {
            count: Math.floor(4 * intensity),
            color: f.petalColor,
            life: 0.4
        });
    }
    
    // Create selection effect
    createSelectionEffect(x, y, radius) {
        // Reduce effect intensity on lower performance devices - removed since we removed FPS limitations
        const perfConfig = window.PERFORMANCE_CONFIG || {};
        // Removed performance-based check since we removed FPS limitations
        
        this.addEffect('selection', x, y, {
            count: 8,
            color: 'rgba(255, 255, 0, 0.7)',
            life: 0.3
        });
    }
    
    // Clear all effects
    clear() {
        this.effects = [];
    }
}

// Singleton instance
export const visualEffects = new VisualEffectManager();

// Helper function to lighten a color
function lightenColor(hexColor, amount) {
    // Handle undefined, null or non-string inputs
    if (!hexColor || typeof hexColor !== 'string') {
        return '#FFFFFF'; // Return white as a safe default
    }
    
    // Remove # if present
    let color = hexColor.replace('#', '');
    
    // Handle shorthand hex notation (e.g., #ABC becomes #AABBCC)
    if (color.length === 3) {
        color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }
    
    // Validate color string length
    if (color.length !== 6) {
        return '#FFFFFF'; // Return white as a safe default
    }
    
    // Parse RGB values
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    // Check if parsing failed
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return '#FFFFFF'; // Return white as a safe default
    }
    
    // Default amount if not provided or invalid
    if (typeof amount !== 'number' || isNaN(amount)) {
        amount = 0.2;
    }
    
    // Increase each component by the amount (0-1 scale)
    const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount));
    
    // Convert back to hex
    return '#' + 
        newR.toString(16).padStart(2, '0') +
        newG.toString(16).padStart(2, '0') +
        newB.toString(16).padStart(2, '0');
}

// Helper function to parse color string to RGB object
function parseColorString(colorStr) {
    // Handle undefined, null or non-string inputs
    if (!colorStr || typeof colorStr !== 'string') {
        return { r: 255, g: 170, b: 188 }; // Default pink color
    }
    
    // Handle hex color
    if (colorStr.startsWith('#')) {
        let color = colorStr.replace('#', '');
        if (color.length === 3) {
            color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
        }
        
        // Validate color string length
        if (color.length !== 6) {
            return { r: 255, g: 170, b: 188 }; // Default pink color
        }
        
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);
        
        // Check if parsing failed
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return { r: 255, g: 170, b: 188 }; // Default pink color
        }
        
        return { r, g, b };
    }
    // Handle rgba/rgb strings
    else if (colorStr.startsWith('rgb')) {
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3])
            };
        }
    }
    // Default fallback
    return { r: 255, g: 170, b: 188 }; // Default pink color
}

// Helper function to convert RGB object to hex string
function rgbToHex(rgbObj) {
    const r = Math.max(0, Math.min(255, Math.floor(rgbObj.r)));
    const g = Math.max(0, Math.min(255, Math.floor(rgbObj.g)));
    const b = Math.max(0, Math.min(255, Math.floor(rgbObj.b)));
    
    return '#' + 
        r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') +
        b.toString(16).padStart(2, '0');
}
