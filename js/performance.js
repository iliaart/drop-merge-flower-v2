// Advanced Performance Optimization Module
import { state } from './state.js';

// Performance monitoring and adaptive quality adjustments
export class PerformanceOptimizer {
    constructor() {
        this.perfConfig = window.PERFORMANCE_CONFIG || { maxFPS: 60, maxParticles: 500, ambientMotes: 15 };
        this.qualityLevel = 'high'; // 'low', 'medium', 'high'
        this.lastAdjustment = performance.now();
        this.adjustmentInterval = 5000; // Adjust every 5 seconds
        this.fpsHistory = [];
        this.targetFPS = this.perfConfig.maxFPS;
    }

    // Monitor performance and adjust quality settings accordingly
    update() {
        const now = performance.now();
        
        // Calculate current FPS
        state.perfMonitor.frameCount++;
        if (now - state.perfMonitor.lastPerfCheck >= 1000) {
            const currentFPS = state.perfMonitor.frameCount * 1000 / (now - state.perfMonitor.lastPerfCheck);
            this.fpsHistory.push(currentFPS);
            
            // Keep only last 5 FPS measurements
            if (this.fpsHistory.length > 5) {
                this.fpsHistory.shift();
            }
            
            // Update average FPS
            state.perfMonitor.avgFps = currentFPS;
            
            state.perfMonitor.frameCount = 0;
            state.perfMonitor.lastPerfCheck = now;
        }
        
        // Adjust quality every few seconds based on performance
        if (now - this.lastAdjustment > this.adjustmentInterval) {
            this.adjustQuality();
            this.lastAdjustment = now;
        }
    }

    // Adjust game quality based on performance metrics
    adjustQuality() {
        if (this.fpsHistory.length === 0) return;

        // Calculate average FPS from history
        const avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
        
        // Determine quality level based on FPS
        if (avgFPS < this.targetFPS * 0.6) {
            // Significantly underperforming, reduce quality
            if (this.qualityLevel !== 'low') {
                this.setQualityLevel('low');
                console.log('Performance: Reduced to low quality due to FPS drop');
            }
        } else if (avgFPS < this.targetFPS * 0.8) {
            // Moderately underperforming, reduce quality
            if (this.qualityLevel === 'high') {
                this.setQualityLevel('medium');
                console.log('Performance: Reduced to medium quality');
            }
        } else if (avgFPS > this.targetFPS * 0.9) {
            // Performing well, consider increasing quality
            if (this.qualityLevel === 'low') {
                this.setQualityLevel('medium');
                console.log('Performance: Increased to medium quality');
            } else if (this.qualityLevel === 'medium' && this.targetFPS >= 45) {
                this.setQualityLevel('high');
                console.log('Performance: Increased to high quality');
            }
        }
    }

    // Set quality level and adjust corresponding parameters
    setQualityLevel(level) {
        this.qualityLevel = level;
        
        switch (level) {
            case 'low':
                // Reduce particle count, ambient motes, and other effects
                window.PERFORMANCE_CONFIG.maxParticles = Math.floor(this.perfConfig.maxParticles * 0.4);
                window.PERFORMANCE_CONFIG.ambientMotes = Math.max(1, Math.floor(this.perfConfig.ambientMotes * 0.3));
                window.PERFORMANCE_CONFIG.mergeCheckFreq = 6; // Less frequent merge checks
                window.PERFORMANCE_CONFIG.maxFPS = Math.min(30, this.perfConfig.maxFPS);
                
                // Reduce physics accuracy on low-end devices
                if (state.Matter && state.engine) {
                    state.engine.constraintIterations = 2; // Lower constraint iterations
                    state.engine.positionIterations = 4;   // Lower position iterations
                    state.engine.velocityIterations = 4;   // Lower velocity iterations
                }
                break;
                
            case 'medium':
                // Moderate settings
                window.PERFORMANCE_CONFIG.maxParticles = Math.floor(this.perfConfig.maxParticles * 0.7);
                window.PERFORMANCE_CONFIG.ambientMotes = Math.floor(this.perfConfig.ambientMotes * 0.6);
                window.PERFORMANCE_CONFIG.mergeCheckFreq = 4;
                window.PERFORMANCE_CONFIG.maxFPS = Math.min(45, this.perfConfig.maxFPS);
                
                // Medium physics settings
                if (state.Matter && state.engine) {
                    state.engine.constraintIterations = 4;
                    state.engine.positionIterations = 6;
                    state.engine.velocityIterations = 6;
                }
                break;
                
            case 'high':
                // High-quality settings
                window.PERFORMANCE_CONFIG.maxParticles = this.perfConfig.maxParticles;
                window.PERFORMANCE_CONFIG.ambientMotes = this.perfConfig.ambientMotes;
                window.PERFORMANCE_CONFIG.mergeCheckFreq = this.perfConfig.mergeCheckFreq || 2;
                window.PERFORMANCE_CONFIG.maxFPS = this.perfConfig.maxFPS;
                
                // High physics settings
                if (state.Matter && state.engine) {
                    state.engine.constraintIterations = 6;
                    state.engine.positionIterations = 8;
                    state.engine.velocityIterations = 8;
                }
                break;
        }
        
        // Update particle system with new max particles
        if (state.particles) {
            state.particles.maxParticles = window.PERFORMANCE_CONFIG.maxParticles;
        }
    }

    // Pause expensive operations when tab is not visible
    handleVisibilityChange() {
        if (document.hidden) {
            // Reduce update frequency when tab is not visible
            window.PERFORMANCE_CONFIG.maxFPS = Math.min(15, this.perfConfig.maxFPS);
        } else {
            // Return to normal performance when tab becomes visible
            this.setQualityLevel(this.qualityLevel);
        }
    }
}

// Effect culling system to optimize rendering
export class EffectCuller {
    constructor() {
        this.cullDistance = 1000; // Distance beyond which effects are culled
        this.visibleEffects = new Set();
    }

    // Cull distant particles and effects to save performance
    cullDistantEffects() {
        // In our particle system, we're already limiting the number of particles
        // This would be expanded if we had more complex effect systems
    }

    // Check if an effect should be rendered based on distance from camera/view
    shouldRenderEffect(position, cameraPos = { x: 250, y: 425 }) { // Default to center of screen
        const dx = position.x - cameraPos.x;
        const dy = position.y - cameraPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.cullDistance;
    }
}

// Memory management utilities
export class MemoryManager {
    constructor() {
        this.cleanupInterval = 30000; // Cleanup every 30 seconds
        this.lastCleanup = performance.now();
    }

    // Perform periodic cleanup of unused resources
    update() {
        const now = performance.now();
        if (now - this.lastCleanup > this.cleanupInterval) {
            this.cleanup();
            this.lastCleanup = now;
        }
    }

    // Clean up resources and run garbage collection hints
    cleanup() {
        // Clean up empty arrays and null references in flowers
        if (state.flowers) {
            state.flowers = state.flowers.filter(flower => flower !== null);
        }
        
        // Ensure particles don't exceed max capacity
        if (state.particles && state.particles.particles) {
            while (state.particles.particles.length > state.particles.maxParticles) {
                state.particles.particles.shift();
            }
        }
        
        // Trigger browser's garbage collection hint
        if (window.gc) {
            window.gc();
        }
    }
}

// Initialize performance optimizer
export const perfOptimizer = new PerformanceOptimizer();
export const effectCuller = new EffectCuller();
export const memoryManager = new MemoryManager();

// Setup visibility change listener
document.addEventListener('visibilitychange', () => {
    perfOptimizer.handleVisibilityChange();
});