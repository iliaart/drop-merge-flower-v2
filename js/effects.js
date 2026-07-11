// Screen Effects Module — ScreenShake & AmbientMotes
import { rand, TAU } from './utils.js';
import { CONFIG } from './config.js';

const { VASE } = CONFIG;

export class ScreenShake {
    constructor() { this.intensity = 0; this.x = 0; this.y = 0; }
    trigger(amount) { 
        // Scale shake intensity based on performance
        const perfConfig = window.PERFORMANCE_CONFIG || {};
        const intensityScale = 1.0; // Remove FPS-based scaling since we removed the cap
        this.intensity = Math.max(this.intensity, amount * intensityScale); 
    }
    update(dt) {
        if (this.intensity > .5) {
            this.x = (Math.random() - .5) * this.intensity * 2;
            this.y = (Math.random() - .5) * this.intensity * 2;
            this.intensity *= Math.pow(.85, dt * 60);
        } else {
            this.x = this.y = 0;
            this.intensity = 0;
        }
    }
}

export class AmbientMote {
    constructor() { this.reset(); }
    reset() {
        this.x = rand(VASE.l, VASE.r);
        this.y = rand(VASE.t, VASE.b);
        this.vx = rand(-5, 5);
        this.vy = rand(-8, -2);
        this.size = rand(1, 3);
        this.alpha = rand(.05, .15);
        this.life = rand(4, 10);
        this.maxLife = this.life;
        this.phase = rand(0, TAU);
    }
    update(dt, time) {
        // On low-performance devices, reduce calculation frequency
        const perfConfig = window.PERFORMANCE_CONFIG || {};
        const calcFreq = 1.0; // Remove FPS-based calculation frequency reduction
        
        this.x += (this.vx + Math.sin(time + this.phase) * 3) * dt * calcFreq;
        this.y += this.vy * dt * calcFreq;
        this.life -= dt;
        if (this.life <= 0 || this.y < VASE.t - 10) this.reset();
    }
    draw(ctx, time) {
        // Early exit for low-performance devices - removed FPS check since we removed the cap
        const perfConfig = window.PERFORMANCE_CONFIG || {};
        
        const fade = Math.min(1, this.life / (this.maxLife * .3));
        const a = this.alpha * fade;
        if (a < .01) return;
        const pulse = .7 + .3 * Math.sin(time * 2 + this.phase);
        const s = this.size * pulse;
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, s);
        g.addColorStop(0, `rgba(255,255,230,${a})`);
    }
}

export function createAmbientMotes(ctx, perfConfig = {}) {
    // Use performance configuration with fallback values
    const config = {
        maxParticles: 500,
        ambientMotes: 15,
        ...perfConfig
    };
    
    // Introduce intensity scaling based on performance level
    const intensityScale = 1.0; // Remove FPS-based scaling since we removed the cap
    
    // Create ambient motes with performance-based quantity
    const moteCount = Math.floor((config.ambientMotes || 15) * intensityScale);
    
    const motes = [];
    for (let i = 0; i < moteCount; i++) {
        motes.push(new AmbientMote());
    }
    return motes;
}
