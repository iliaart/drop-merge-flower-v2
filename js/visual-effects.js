// Enhanced Visual Effects Module
import { rand, TAU } from './utils.js';
import { getAllFlowersWithGenerated } from './random-flowers.js';

// Bloom/Glow effect class for flowers
export class BloomEffect {
    constructor() {
        this.enabled = true;
        this.intensity = 1.0;
        this.blur = 10;
    }
    
    // Apply bloom effect to a flower
    apply(ctx, flower, position, radius, petalColor) {
        // Skip bloom on low-performance devices
        const perfConfig = window.PERFORMANCE_CONFIG || { maxFPS: 60 };
        if (perfConfig.maxFPS < 35 || !this.enabled) return;
        
        // Create a bloom/glow effect around the flower
        const bloomRadius = radius * (1.2 + 0.3 * Math.sin(Date.now() * 0.005));
        const gradient = ctx.createRadialGradient(
            position.x, position.y, radius * 0.5,
            position.x, position.y, bloomRadius
        );
        
        gradient.addColorStop(0, `${petalColor}00`); // Fully transparent at center
        gradient.addColorStop(0.5, `${petalColor}40`); // Semi-transparent mid
        gradient.addColorStop(1, `${petalColor}00`); // Fully transparent at edge
        
        ctx.save();
        ctx.globalAlpha = 0.3 * this.intensity;
        ctx.shadowColor = petalColor;
        ctx.shadowBlur = this.blur * this.intensity;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(position.x, position.y, bloomRadius, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
}

// Particle effect system with performance scaling
export class ParticleEffect {
    constructor(type, x, y, options = {}) {
        this.type = type; // 'merge', 'drop', 'selection', etc.
        this.x = x;
        this.y = y;
        this.life = options.life || 1.0;
        this.maxLife = this.life;
        this.particles = [];
        this.options = options;
        
        this.generateParticles();
    }
    
    generateParticles() {
        // Skip particle generation on low-performance devices
        const perfConfig = window.PERFORMANCE_CONFIG || { maxFPS: 60 };
        if (perfConfig.maxFPS < 30) return;
        
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

// Visual effect manager that handles all effects
export class VisualEffectManager {
    constructor() {
        this.effects = [];
        this.bloomEffect = new BloomEffect();
        this.effectEnabled = true;
    }
    
    // Add a new effect
    addEffect(type, x, y, options = {}) {
        // Skip effects on low-performance devices
        const perfConfig = window.PERFORMANCE_CONFIG || { maxFPS: 60 };
        if (perfConfig.maxFPS < 25) return;
        
        const effect = new ParticleEffect(type, x, y, options);
        this.effects.push(effect);
    }
    
    // Update all effects
    update(dt) {
        // Skip updates on very low-performance devices
        const perfConfig = window.PERFORMANCE_CONFIG || { maxFPS: 60 };
        if (perfConfig.maxFPS < 20) return;
        
        for (let i = this.effects.length - 1; i >= 0; i--) {
            if (!this.effects[i].update(dt)) {
                this.effects.splice(i, 1);
            }
        }
    }
    
    // Draw all effects
    draw(ctx) {
        // Skip drawing on very low-performance devices
        const perfConfig = window.PERFORMANCE_CONFIG || { maxFPS: 60 };
        if (perfConfig.maxFPS < 20) return;
        
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
        
        // Reduce effect intensity on lower performance devices
        const perfConfig = window.PERFORMANCE_CONFIG || { maxFPS: 60 };
        const intensity = perfConfig.maxFPS > 45 ? 1.0 : perfConfig.maxFPS > 30 ? 0.7 : 0.4;
        
        // Create primary particles
        this.addEffect('merge', x, y, {
            count: Math.floor(8 * intensity),
            color: f.petalColor,
            life: 0.8
        });
        
        // Create secondary particles
        this.addEffect('merge', x, y, {
            count: Math.floor(5 * intensity),
            color: '#fff8dd',
            life: 0.5
        });
    }
    
    // Create drop particles
    createDropEffect(x, y, level) {
        const allFlowers = getAllFlowersWithGenerated();
        const f = allFlowers[level];
        if (!f) return;
        
        // Reduce effect intensity on lower performance devices
        const perfConfig = window.PERFORMANCE_CONFIG || { maxFPS: 60 };
        const intensity = perfConfig.maxFPS > 45 ? 1.0 : perfConfig.maxFPS > 30 ? 0.7 : 0.4;
        
        this.addEffect('drop', x, y, {
            count: Math.floor(4 * intensity),
            color: f.petalColor,
            life: 0.4
        });
    }
    
    // Create selection effect
    createSelectionEffect(x, y, radius) {
        // Reduce effect intensity on lower performance devices
        const perfConfig = window.PERFORMANCE_CONFIG || { maxFPS: 60 };
        if (perfConfig.maxFPS < 35) return; // Skip on low-end devices
        
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