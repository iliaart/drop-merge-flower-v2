// Screen Effects Module — ScreenShake only (removed AmbientMotes as not merge-related)
import { rand } from './utils.js';
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

// Removed AmbientMote class as it's not related to merging

// Removed createAmbientMotes function as it's not related to merging
