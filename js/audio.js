// Audio System Module (Web Audio API — synthesized)

export class AudioSystem {
    constructor() { this.ctx = null; this.enabled = true; }
    
    init() {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch(e) { this.enabled = false; }
    }
    
    ensure() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }
    
    playPop(level) {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 2000 + level * 200;
        o.connect(f); f.connect(g); g.connect(this.ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(500 + level * 70, t);
        o.frequency.exponentialRampToValueAtTime(150 + level * 30, t + .15);
        g.gain.setValueAtTime(.25, t);
        g.gain.exponentialRampToValueAtTime(.001, t + .18);
        o.start(t); o.stop(t + .2);
    }
    
    playMerge(level) {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        [0, .04, .08].forEach((d, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.connect(g); g.connect(this.ctx.destination);
            o.type = 'sine';
            const base = 400 + level * 60;
            o.frequency.setValueAtTime(base * (1 + i * .25), t + d);
            g.gain.setValueAtTime(.18, t + d);
            g.gain.exponentialRampToValueAtTime(.001, t + d + .25);
            o.start(t + d); o.stop(t + d + .3);
        });
    }
    
    playDrop() {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(300, t);
        o.frequency.exponentialRampToValueAtTime(100, t + .12);
        g.gain.setValueAtTime(.12, t);
        g.gain.exponentialRampToValueAtTime(.001, t + .15);
        o.start(t); o.stop(t + .18);
    }
    
    playGameOver() {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime;
        [400, 350, 300, 200].forEach((freq, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.connect(g); g.connect(this.ctx.destination);
            o.type = 'sine';
            o.frequency.value = freq;
            g.gain.setValueAtTime(.15, t + i * .2);
            g.gain.exponentialRampToValueAtTime(.001, t + i * .2 + .35);
            o.start(t + i * .2); o.stop(t + i * .2 + .4);
        });
    }
}
