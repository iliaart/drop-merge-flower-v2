// Screen Effects Module — ScreenShake & AmbientMotes
import { rand, TAU } from './utils.js';
import { CONFIG } from './config.js';

const { VASE } = CONFIG;

export class ScreenShake {
    constructor() { this.intensity = 0; this.x = 0; this.y = 0; }
    trigger(amount) { this.intensity = Math.max(this.intensity, amount); }
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
        this.x += (this.vx + Math.sin(time + this.phase) * 3) * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0 || this.y < VASE.t - 10) this.reset();
    }
    draw(ctx, time) {
        const fade = Math.min(1, this.life / (this.maxLife * .3));
        const a = this.alpha * fade;
        if (a < .01) return;
        const pulse = .7 + .3 * Math.sin(time * 2 + this.phase);
        const s = this.size * pulse;
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, s);
        g.addColorStop(0, `rgba(255,255,230,${a})`);
        g.addColorStop(1, `rgba(255,255,230,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(this.x, this.y, s, 0, TAU); ctx.fill();
    }
}
