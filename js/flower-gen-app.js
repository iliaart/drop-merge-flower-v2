// Main application entry point for flower generator

// Ensure required modules are available
if (typeof window === 'undefined') {
    throw new Error('This module requires a browser environment');
}

if (!('document' in window)) {
    throw new Error('Document object not available');
}

// Global application state
var currentFlower = null;
var animationId = null;
var asymmetricMode = false;
if (typeof customPalettes === 'undefined') {
    var customPalettes = []; // Moved from global scope
}

// Store in FlowerGenerator object as well
const FlowerGenerator = {
    currentFlower: currentFlower,
    animationId: animationId,
    asymmetricMode: asymmetricMode,
    customPalettes: customPalettes
};

// Also expose these as global variables for backward compatibility
if (typeof currentFlower === 'undefined') {
    var currentFlower = FlowerGenerator._currentFlower;
}
if (typeof animationId === 'undefined') {
    var animationId = FlowerGenerator._animationId;
}
if (typeof asymmetricMode === 'undefined') {
    var asymmetricMode = FlowerGenerator._asymmetricMode;
}

// Update the global variables when the FlowerGenerator properties change
Object.defineProperty(FlowerGenerator, 'currentFlower', {
    get: function() { return this._currentFlower; },
    set: function(value) { 
        this._currentFlower = value;
        if (typeof window !== 'undefined') {
            window.currentFlower = value;
            currentFlower = value;
        }
    }
});

Object.defineProperty(FlowerGenerator, 'animationId', {
    get: function() { return this._animationId; },
    set: function(value) { 
        this._animationId = value;
        if (typeof window !== 'undefined') {
            window.animationId = value;
            animationId = value;
        }
    }
});

Object.defineProperty(FlowerGenerator, 'asymmetricMode', {
    get: function() { return this._asymmetricMode; },
    set: function(value) { 
        this._asymmetricMode = value;
        if (typeof window !== 'undefined') {
            window.asymmetricMode = value;
            asymmetricMode = value;
        }
    }
});

/**
 * Get default flower configuration
 * @returns {object} default flower data
 */
function getDefaultFlower() {
    return {
        name: 'Новый цветок',
        flowerType: 'simple',
        petals: 8,
        radius: 35,
        petalColor: '#f5a0c0',
        petalColor2: '#ffc0d8',
        centerColor: '#ffd700',
        centerColor2: '#e8a000',
        stemColor: '#5a9a48',
        leafColor: '#4a8a38',
        petalW: 0.4,
        petalH: 0.75,
        stamenCount: 6,
        stamenLen: 0.25,
        stamenColor: '#ffcc88',
        stamenType: 'simple',
        antherSize: 1.0,
        centerPattern: 'none'
    };
}

/**
 * Get type name in Russian
 * @param {string} type - flower type key
 * @returns {string} Russian name
 */
function getTypeName(type) {
    const names = {
        'simple': 'Простой',
        'double': 'Двойной',
        'multi': 'Многослойный',
        'cluster': 'Кластерный',
        'spiral': 'Спиральный',
        'rose': 'Роза',
        'orchid': 'Орхидея',
        'medusa': 'Медуза',
        'kelp': 'Ламинария',
        'coral': 'Коралл'
    };
    return names[type] || 'Цветок';
}

// Create a namespace for global flower generator functions
window.FlowerGenerator = window.FlowerGenerator || {};
window.FlowerGenerator.Utils = {
    getDefaultFlower,
    getTypeName
};

/**
 * Start preview animation loop
 */
function startPreview() {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    
    function animate(timestamp) {
        const t = timestamp / 1000;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const flower = getFlowerFromControls();
        const scale = 2;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        
        drawGenericFlower(ctx, 0, 0, flower, t);
        
        ctx.restore();
        
        animationId = requestAnimationFrame(animate);
    }
    
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(animate);
}

/**
 * Auto-load raw palette JSON files (e.g. 1000.json) via fetch
 */
async function autoLoadRawPalettes() {
    // Ensure required dependencies are available
    if (typeof parsePaletteData !== 'function') {
        console.error('parsePaletteData function not available');
        return;
    }
    
    if (typeof updatePaletteList !== 'function') {
        console.error('updatePaletteList function not available');
        return;
    }
    
    const files = ['1000.json'];
    for (const file of files) {
        try {
            const res = await fetch(file);
            if (!res.ok) continue;
            const data = await res.json();
            const loaded = parsePaletteData(data);
            if (loaded.length > 0) {
                FlowerGenerator.customPalettes = FlowerGenerator.customPalettes.concat(loaded);
                console.log(`Auto-loaded ${loaded.length} palettes from ${file}`);
            }
        } catch (e) {
            console.log(`Could not auto-load ${file}: ${e.message}`);
        }
    }
    updatePaletteList();
}

/**
 * Initialize the flower generator application
 */
function init() {
    // Check for required dependencies
    const requiredFunctions = [
        'extendFlowerDrawer', 'updateRangeValues', 'buildPetalEditor',
        'getFlowerFromControls', 'loadControls', 'updatePaletteList',
        'startPreview', 'updateJSONOutput'
    ];
    
    const missingFunctions = requiredFunctions.filter(func => 
        typeof window[func] !== 'function'
    );
    
    if (missingFunctions.length > 0) {
        console.warn('Missing required functions:', missingFunctions.join(', '));
        // Or throw an error if these functions are critical
        // throw new Error('Missing required functions: ' + missingFunctions.join(', '));
    }
    
    // Extend flower drawers with bio-inspired types
    if (typeof extendFlowerDrawer === 'function') {
        extendFlowerDrawer();
    }
    
    currentFlower = getDefaultFlower();
    FlowerGenerator.currentFlower = currentFlower;

    const rangeInputs = ['petals', 'radius', 'petalW', 'petalH', 'stamenCount', 'stamenLen', 'fractalDepth', 'antherSize'];
    rangeInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                if (typeof updateRangeValues === 'function') {
                    updateRangeValues();
                }
                
                if (id === 'petals' && asymmetricMode && 
                    typeof buildPetalEditor === 'function') {
                    buildPetalEditor();
                }
                
                if (typeof loadControls === 'function') {
                    loadControls(getFlowerFromControls());
                }
            });
        }
    });
    
    const colorInputs = ['petalColor', 'petalColor2', 'centerColor', 'centerColor2', 'stemColor', 'leafColor', 'stamenColor'];
    colorInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                // Colors update automatically via getFlowerFromControls()
            });
        }
    });
    
    if (typeof loadControls === 'function') {
        loadControls(currentFlower);
    }
    
    if (typeof updatePaletteList === 'function') {
        updatePaletteList();
    }
    
    if (typeof autoLoadRawPalettes === 'function') {
        autoLoadRawPalettes();
    }
    
    if (typeof startPreview === 'function') {
        startPreview();
    }
    
    if (typeof updateJSONOutput === 'function') {
        updateJSONOutput();
    }
}

// Attach to window object to make it accessible from HTML
window.init = init;
window.getDefaultFlower = getDefaultFlower;
window.getTypeName = getTypeName;

// Start the application when DOM is ready
init();