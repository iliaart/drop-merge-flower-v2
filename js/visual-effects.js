// Enhanced Visual Effects Module
import { rand, TAU } from './utils.js';
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
            const scale = 0.1 + progress * 1.9; // Scale from 0.1x to 2x
            const alpha = 1 - progress; // Fade out as time passes
            
            ctx.globalAlpha = alpha;
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale);
            
            // Draw the ring from pre-rendered canvas
            ctx.drawImage(this.canvas, -this.maxSize, -this.maxSize);
            
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
    createMergeEffect(x, y, level) {
        const allFlowers = getAllFlowersWithGenerated();
        const f = allFlowers[level];
        if (!f) return;
        
        // Reduce effect intensity on lower performance devices - removed since we removed FPS limitations
        const perfConfig = window.PERFORMANCE_CONFIG || {};
        const intensity = 1.0; // Full intensity since we removed FPS limitations
        
        // Create primary particles - more intense and longer lasting
        this.addEffect('merge', x, y, {
            count: Math.floor(12 * intensity), // Increased from 8
            color: f.petalColor,
            life: 1.2 // Increased from 0.8 for more visibility
        });
        
        // Create secondary particles - also enhanced
        this.addEffect('merge', x, y, {
            count: Math.floor(8 * intensity), // Increased from 5
            color: '#fff8dd',
            life: 0.8 // Increased from 0.5 for more visibility
        });

        // Create additional ring effect for merge - more prominent and closer to merge location
        this.createMergeRingEffect(x, y, f.petalColor);
    }

    // Create a special ring effect for merge events
    createMergeRingEffect(x, y, color) {
        // Create a temporary canvas for the ring effect
        const ringCanvas = document.createElement('canvas');
        const ringCtx = ringCanvas.getContext('2d');
        const ringRadius = 20; // Small initial radius
        const maxSize = 100; // Maximum size of the ring
        ringCanvas.width = maxSize * 2;
        ringCanvas.height = maxSize * 2;
        
        // Draw ring on temporary canvas
        ringCtx.save();
        ringCtx.translate(maxSize, maxSize);
        ringCtx.strokeStyle = color;
        ringCtx.lineWidth = 4; // Thicker line for visibility
        ringCtx.shadowColor = color;
        ringCtx.shadowBlur = 15; // Increased blur for more visibility
        ringCtx.beginPath();
        ringCtx.arc(0, 0, ringRadius, 0, TAU);
        ringCtx.stroke();
        ringCtx.restore();
        
        // Create a proper MergeRingEffect instance instead of a plain object
        const ringEffect = new MergeRingEffect(x, y, {
            duration: 800, // 0.8 seconds duration
            maxSize: maxSize,
            color: color,
            canvas: ringCanvas
        });
        
        this.effects.push(ringEffect);
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