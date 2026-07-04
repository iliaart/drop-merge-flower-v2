// Particle System Module
import { clamp, rand, TAU, rgba } from './utils.js';
// Import only the function we need for getting flowers with generated ones
import { getAllFlowersWithGenerated } from './random-flowers.js';

export class Particle {
    constructor(x, y, vx, vy, color, opts = {}) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.color = color;
        this.alpha = opts.alpha ?? 1;
        this.size  = opts.size ?? 5;
        this.origSize = this.size;
        this.rot   = opts.rot ?? rand(0, TAU);
        this.rotV  = opts.rotV ?? rand(-4, 4);
        this.life  = opts.life ?? 1;
        this.maxLife = this.life;
        this.gravity = opts.gravity ?? 180;
        this.drag = opts.drag ?? 0.98;
        this.type  = opts.type ?? 'petal';
        this.fadeRate = opts.fadeRate ?? 1;
    }
    
    update(dt) {
        this.vy += this.gravity * dt;
        this.vx *= Math.pow(this.drag, dt * 60);
        this.vy *= Math.pow(this.drag, dt * 60);
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rot += this.rotV * dt;
        this.life -= dt * this.fadeRate;
        this.alpha = clamp(this.life / this.maxLife, 0, 1);
        this.size = this.origSize * (0.3 + 0.7 * this.alpha);
    }
    
    draw(ctx) {
        if (this.alpha <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        
        if (this.type === 'petal') {
            const s = this.size;
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
            g.addColorStop(0, this.color);
            g.addColorStop(1, rgba(this.color, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(0, 0, s, s * .55, 0, 0, TAU);
            ctx.fill();
        } else if (this.type === 'sparkle') {
            const s = this.size;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * TAU;
                ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
                ctx.lineTo(Math.cos(a + TAU/8) * s * .3, Math.sin(a + TAU/8) * s * .3);
            }
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'dew') {
            const s = this.size * (0.5 + 0.5 * this.alpha);
            const g = ctx.createRadialGradient(-s*.2, -s*.2, 0, 0, 0, s);
            g.addColorStop(0, rgba('#ffffff', .9));
            g.addColorStop(.5, rgba(this.color, .4));
            g.addColorStop(1, rgba(this.color, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, s, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
    
    get dead() { return this.life <= 0; }
}

export class ParticleSystem {
    constructor(maxParticles = null) { 
        this.particles = []; 
        // Use performance-configured max particles or default
        this.maxParticles = maxParticles || window.PERFORMANCE_CONFIG?.maxParticles || 500;
    }
    
    add(p) { 
        if (this.particles.length >= this.maxParticles) {
            // Remove oldest particles if we've reached the limit
            this.particles.shift();
        }
        this.particles.push(p); 
    }
    
    update(dt) {
        // Optimize particle updates by processing in batches
        const batchSize = 100; // Process particles in smaller batches
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].dead) this.particles.splice(i, 1);
        }
    }
    
    draw(ctx) { 
        // Only draw particles if there are any and performance is good
        if (this.particles.length > 0) {
            // On low-performance devices, draw fewer particles
            const perfConfig = window.PERFORMANCE_CONFIG || { maxParticles: 500 };
            const drawLimit = Math.min(this.particles.length, perfConfig.maxParticles * 0.8);
            
            for (let i = 0; i < drawLimit; i++) {
                this.particles[i].draw(ctx);
            }
        }
    }
    
    get count() { return this.particles.length; }
    
    // Method to clear all particles
    clear() {
        this.particles = [];
    }
}

export function spawnMergeParticles(ps, x, y, level) {
    const allFlowers = getAllFlowersWithGenerated();
    const f = allFlowers[level];
    if (!f) return; // Safety check
    
    // Reduce particle count on mobile devices for better performance
    const perfConfig = window.PERFORMANCE_CONFIG || { maxParticles: 500 };
    const isMobile = perfConfig.isMobile || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const multiplier = isMobile ? 0.5 : 1.0; // Reduce particles by 50% on mobile
    
    const n = Math.floor((12 + level * 3) * multiplier);
    for (let i = 0; i < n; i++) {
        const a = rand(0, TAU);
        const sp = rand(60, 200 + level * 20);
        ps.add(new Particle(x, y, Math.cos(a)*sp, Math.sin(a)*sp - 60,
            f.petalColor, { life: rand(.6, 1.4), size: rand(4, 10), type: 'petal', gravity: 140 }));
    }
    for (let i = 0; i < Math.floor(8 * multiplier); i++) {
        const a = rand(0, TAU);
        const sp = rand(40, 120);
        ps.add(new Particle(x, y, Math.cos(a)*sp, Math.sin(a)*sp - 40,
            '#fff8dd', { life: rand(.3, .7), size: rand(2, 5), type: 'sparkle', gravity: 50 }));
    }
    for (let i = 0; i < Math.floor(5 * multiplier); i++) {
        ps.add(new Particle(x + rand(-15,15), y + rand(-15,15),
            rand(-20,20), rand(-80, -30),
            '#c8e8ff', { life: rand(.8, 1.5), size: rand(3, 6), type: 'dew', gravity: 100 }));
    }
}

export function spawnDropParticles(ps, x, y, level) {
    const allFlowers = getAllFlowersWithGenerated();
    const f = allFlowers[level];
    if (!f) return; // Safety check
    
    // Reduce particle count on mobile devices for better performance
    const perfConfig = window.PERFORMANCE_CONFIG || { maxParticles: 500 };
    const isMobile = perfConfig.isMobile || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const multiplier = isMobile ? 0.5 : 1.0; // Reduce particles by 50% on mobile
    
    for (let i = 0; i < Math.floor(6 * multiplier); i++) {
        const a = rand(0, TAU);
        ps.add(new Particle(x, y, Math.cos(a)*30, Math.sin(a)*30,
            f.petalColor, { life: rand(.3, .6), size: rand(3, 6), type: 'petal', gravity: 60 }));
    }
}