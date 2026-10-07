// Advanced Performance Optimization Module
import { state } from './state.js';

// Performance monitoring and adaptive quality adjustments
export class PerformanceOptimizer {
    constructor() {
        // Detect mobile devices for specific optimization
        this.isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        this.perfConfig = window.PERFORMANCE_CONFIG || { 
            maxParticles: 500, 
            mergeCheckFreq: 2,
            maxFlowersForMerges: 60
        };
        
        this.qualityLevel = 'high'; // 'low', 'medium', 'high'
        this.lastAdjustment = performance.now();
        this.adjustmentInterval = 5000; // Adjust every 5 seconds
        this.fpsHistory = [];
        // Real target for adaptive quality: with Infinity every downgrade
        // condition in adjustQuality() was dead code (quality only ever went up).
        this.targetFPS = 60;
        this.baseTargetFPS = 60;
        this.frameSkipCounter = 0;
        this.frameSkipThreshold = 0; // Will be calculated dynamically
        this.batteryLevel = null;
        
        // Initialize performance configuration
        this.initializePerformanceConfig();
        
        // Setup battery status listener if available
        this.setupBatteryMonitoring();
        
        // Setup visibility change listener
        document.addEventListener('visibilitychange', () => {
            perfOptimizer.handleVisibilityChange();
        });
    }

    // Initialize performance configuration based on device type
    initializePerformanceConfig() {
        // Apply more aggressive limits for mobile devices
        if (this.isMobile) {
            this.perfConfig.maxParticles = Math.min(this.perfConfig.maxParticles, 300);
            this.perfConfig.mergeCheckFreq = Math.max(this.perfConfig.mergeCheckFreq || 2, 3);
            this.perfConfig.maxFlowersForMerges = Math.min(this.perfConfig.maxFlowersForMerges || 60, 40);
        }
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
        
        // Adjust quality based on performance with mobile-specific thresholds
        let targetFPS = this.targetFPS;
        
        // On mobile, use different thresholds for quality adjustments
        if (this.isMobile) {
            if (avgFPS < targetFPS * 0.5) {
                // Very low performance on mobile
                if (this.qualityLevel !== 'low') {
                    this.setQualityLevel('low');
                    console.log('Mobile Performance: Reduced to lowest quality due to severe FPS drop');
                }
            } else if (avgFPS < targetFPS * 0.7) {
                // Low performance on mobile
                if (this.qualityLevel === 'high') {
                    this.setQualityLevel('medium');
                    console.log('Mobile Performance: Reduced to medium quality');
                }
            } else if (avgFPS > targetFPS * 0.85 && this.qualityLevel !== 'high') {
                // Good performance on mobile - only upgrade if not already high
                if (this.qualityLevel === 'low') {
                    this.setQualityLevel('medium');
                    console.log('Mobile Performance: Increased to medium quality');
                } else if (this.qualityLevel === 'medium' && avgFPS > targetFPS * 0.9) {
                    // Higher threshold to go from medium to high
                    this.setQualityLevel('high');
                    console.log('Mobile Performance: Increased to high quality');
                }
            }
        } else {
            // Desktop thresholds with improved quality restoration
            if (avgFPS < targetFPS * 0.6) {
                if (this.qualityLevel !== 'low') {
                    this.setQualityLevel('low');
                    console.log('Performance: Reduced to low quality due to FPS drop');
                }
            } else if (avgFPS < targetFPS * 0.8) {
                // Downgrade to medium quality if performance is moderate
                if (this.qualityLevel !== 'low') {
                    this.setQualityLevel('medium');
                    console.log('Performance: Reduced to medium quality');
                }
            } else if (avgFPS > targetFPS * 0.75) {
                // Higher performance detected - upgrade quality if needed
                if (this.qualityLevel === 'low' && avgFPS > targetFPS * 0.85) {
                    this.setQualityLevel('medium');
                    console.log('Performance: Increased to medium quality');
                } else if (this.qualityLevel === 'medium' && avgFPS > targetFPS * 0.9) {
                    // Higher threshold to go from medium to high
                    this.setQualityLevel('high');
                    console.log('Performance: Increased to high quality');
                }
            }
        }
    }
    
    // Setup battery status monitoring if available
    setupBatteryMonitoring() {
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                this.batteryLevel = battery.level;
                
                battery.addEventListener('chargingchange', () => {
                    this.handleBatteryStatusChange();
                });
                
                battery.addEventListener('levelchange', () => {
                    this.batteryLevel = battery.level;
                    this.handleBatteryStatusChange();
                });
            });
        }
    }
    
    // Handle battery status changes
    handleBatteryStatusChange() {
        // Low battery => aggressive savings (regardless of connectivity:
        // the old `&& !navigator.onLine` made this branch nearly unreachable)
        if (this.batteryLevel !== null && this.batteryLevel < 0.2) {
            if (this.qualityLevel !== 'low') {
                this.setQualityLevel('low');
                console.log('Power Saving: Reduced to low quality due to low battery');
            }
            this.targetFPS = Math.min(this.baseTargetFPS, 30);
        } else if (this.batteryLevel !== null && this.batteryLevel < 0.5) {
            if (this.qualityLevel === 'high') {
                this.setQualityLevel('medium');
                console.log('Power Saving: Reduced to medium quality due to moderate battery');
            }
            this.targetFPS = Math.min(this.baseTargetFPS, 45);
        } else {
            this.targetFPS = this.baseTargetFPS;
        }
    }

    // Set quality level and adjust corresponding parameters
    setQualityLevel(level) {
        const changed = this.qualityLevel !== level;
        this.qualityLevel = level;
        // Keep the ORIGINAL device profile as base — previously each call
        // multiplied the already-reduced config (0.6/0.3 of previous value),
        // so quality could never be restored and configs decayed on every toggle.
        if (!this.basePerfConfig) {
            this.basePerfConfig = {
                maxParticles: 500, mergeCheckFreq: 2, maxFlowersForMerges: 60,
                ...(window.PERFORMANCE_CONFIG || {})
            };
            if (this.isMobile) {
                this.basePerfConfig.maxParticles = Math.min(this.basePerfConfig.maxParticles, 300);
                this.basePerfConfig.mergeCheckFreq = Math.max(this.basePerfConfig.mergeCheckFreq || 2, 3);
                this.basePerfConfig.maxFlowersForMerges = Math.min(this.basePerfConfig.maxFlowersForMerges || 60, 40);
            }
        }
        const baseConfig = this.basePerfConfig;

        switch(level) {
            case 'high':
                window.PERFORMANCE_CONFIG = { ...baseConfig,
                    maxParticles: baseConfig.maxParticles,
                    mergeCheckFreq: baseConfig.mergeCheckFreq,
                    maxFlowersForMerges: baseConfig.maxFlowersForMerges,
                    targetFps: this.targetFPS,
                    perfLevel: 'high'
                };
                break;
            case 'medium':
                window.PERFORMANCE_CONFIG = { ...baseConfig,
                    maxParticles: Math.floor(baseConfig.maxParticles * 0.6),
                    mergeCheckFreq: baseConfig.mergeCheckFreq + 1,
                    maxFlowersForMerges: Math.floor(baseConfig.maxFlowersForMerges * 0.6),
                    targetFps: Math.min(this.targetFPS, 45),
                    perfLevel: 'medium'
                };
                break;
            case 'low':
                window.PERFORMANCE_CONFIG = { ...baseConfig,
                    maxParticles: Math.floor(baseConfig.maxParticles * 0.3),
                    mergeCheckFreq: baseConfig.mergeCheckFreq + 2,
                    maxFlowersForMerges: Math.floor(baseConfig.maxFlowersForMerges * 0.3),
                    targetFps: Math.min(this.targetFPS, 30),
                    perfLevel: 'low'
                };
                break;
        }

        // Apply physics settings based on quality level
        this.applyPhysicsSettings();

        // Rebuild static caches at the new resolution when quality changed
        if (changed) {
            if (typeof window.invalidateSceneCache === 'function') window.invalidateSceneCache();
            if (typeof window.invalidateFlowerCache === 'function') window.invalidateFlowerCache();
        }

        // Update particle system with new max particles
        if (state.particles) {
            state.particles.maxParticles = window.PERFORMANCE_CONFIG.maxParticles;
        }
    }
    
    // Apply physics engine settings based on quality level
    applyPhysicsSettings() {
        if (state.Matter && state.engine) {
            switch(this.qualityLevel) {
                case 'high':
                    state.engine.constraintIterations = 6;
                    state.engine.positionIterations = 8;
                    state.engine.velocityIterations = 8;
                    break;
                case 'medium':
                    state.engine.constraintIterations = 4;
                    state.engine.positionIterations = 6;
                    state.engine.velocityIterations = 6;
                    break;
                case 'low':
                    state.engine.constraintIterations = 2;
                    state.engine.positionIterations = 4;
                    state.engine.velocityIterations = 4;
                    break;
            }
        }
    }
    
    // Get current performance level
    getCurrentLevel() {
        return this.qualityLevel;
    }
    
    // Check if current frame should be skipped for performance
    shouldSkipFrame() {
        if (this.frameSkipThreshold <= 0) return false;
        this.frameSkipCounter = (this.frameSkipCounter + 1) % 10;
        return this.frameSkipCounter < this.frameSkipThreshold * 10;
    }
    
    // Calculate frame skip threshold based on current performance
    calculateFrameSkipThreshold(currentFPS) {
        // With unlimited FPS, skip threshold is based on performance rather than fixed FPS limit
        if (currentFPS < 20) {
            this.frameSkipThreshold = 0.6; // Skip 60% of frames on severe performance issues
        } else if (currentFPS < 30) {
            this.frameSkipThreshold = 0.4; // Skip 40% of frames
        } else if (currentFPS < 45) {
            this.frameSkipThreshold = 0.2; // Skip 20% of frames
        } else {
            this.frameSkipThreshold = 0; // Don't skip frames
        }
    }

    // Pause expensive operations when tab is not visible
    handleVisibilityChange() {
        if (document.hidden) {
            // Completely stop all particle generation and continuous drops when tab is hidden
            state.isPaused = true;
            
            // Set max particles to 0 to stop particle generation
            if (state.particles) {
                state.particles.maxParticles = 0;
            }
            
            // Stop continuous drop
            if (window.stopContinuousDrop) {
                window.stopContinuousDrop();
            }
            
            console.log('Performance: Paused all operations in background');
        } else {
            // Restore original particle count based on current quality level
            state.isPaused = false;
            
            if (state.particles && window.PERFORMANCE_CONFIG) {
                const baseConfig = window.PERFORMANCE_CONFIG;
                let particleMultiplier = 1;
                
                switch(this.qualityLevel) {
                    case 'high':
                        particleMultiplier = 1;
                        break;
                    case 'medium':
                        particleMultiplier = 0.6;
                        break;
                    case 'low':
                        particleMultiplier = 0.3;
                        break;
                }
                
                state.particles.maxParticles = Math.floor(baseConfig.maxParticles * particleMultiplier);
            }
            
            console.log('Performance: Resumed operations');
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

// Setup page hide listener for mobile optimization
window.addEventListener('pagehide', () => {
    // Reduce performance on page hide for better battery life
    perfOptimizer.setQualityLevel('low');
});