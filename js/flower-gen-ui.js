// Flower Generator UI - Language and text management

// Russian translations
const russianTranslations = {
    // Basic flower types
    'simple': 'Простой (один слой)',
    'double': 'Двойной (два слоя)',
    'multi': 'Многослойный (3+ слоя)',
    'cluster': 'Кластерный (группы)',
    'spiral': 'Спиральный',
    'rose': 'Роза (концентрические слои)',
    'orchid': 'Орхидея (асимметричная)',
    
    // New underwater-inspired flower types
    'medusa': 'Медуза (волнистые щупальца)',
    'kelp': 'Ламинария (водоросль)',
    'coral': 'Коралл (ветвистая структура)'
};

// English translations
const englishTranslations = {
    // Basic flower types
    'simple': 'Simple (single layer)',
    'double': 'Double (two layers)',
    'multi': 'Multi-layer (3+ layers)',
    'cluster': 'Cluster (groups)',
    'spiral': 'Spiral',
    'rose': 'Rose (concentric layers)',
    'orchid': 'Orchid (asymmetric)',
    
    // New underwater-inspired flower types
    'medusa': 'Medusa (wavy tentacles)',
    'kelp': 'Kelp (seaweed)',
    'coral': 'Coral (branching structure)'
};

// Current language (default to Russian)
let currentLanguage = 'ru'; // Can be 'ru' or 'en'

/**
 * Get translation for a flower type
 * @param {string} type - Flower type identifier
 * @returns {string} Translated name
 */
function getFlowerTypeName(type) {
    const translations = currentLanguage === 'ru' ? russianTranslations : englishTranslations;
    return translations[type] || type;
}

/**
 * Update the flower type dropdown with translated options
 */
function updateFlowerTypeDropdown() {
    const dropdown = document.getElementById('flowerType');
    if (!dropdown) return;
    
    // Clear existing options
    dropdown.innerHTML = '';
    
    // Add options with translations
    const flowerTypes = ['simple', 'double', 'multi', 'cluster', 'spiral', 'rose', 'orchid', 'medusa', 'kelp', 'coral'];
    
    flowerTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = getFlowerTypeName(type);
        dropdown.appendChild(option);
    });
}

/**
 * Initialize UI translations
 */
function initTranslations() {
    updateFlowerTypeDropdown();
}

/**
 * Handle flower type change
 */
function onFlowerTypeChange() {
    // Check if asymmetric mode is active and rebuild editor if needed
    if (typeof asymmetricMode !== 'undefined' && asymmetricMode && typeof buildPetalEditor === 'function') {
        buildPetalEditor();
    }
}

/**
 * Toggle asymmetric mode for individual petal editing
 */
function toggleAsymmetric() {
    // Check if the function exists before calling it
    if (typeof loadControls === 'function' && typeof getFlowerFromControls === 'function') {
        // Toggle the asymmetric mode state
        if (typeof asymmetricMode !== 'undefined') {
            asymmetricMode = !asymmetricMode;
        } else {
            window.asymmetricMode = !window.asymmetricMode;
        }
        
        // Update UI to reflect the toggle state
        const toggleElement = document.getElementById('asymmetricToggle');
        if (toggleElement) {
            toggleElement.classList.toggle('active', asymmetricMode || window.asymmetricMode);
        }
        
        // Rebuild petal editor if needed
        if ((asymmetricMode || window.asymmetricMode) && typeof buildPetalEditor === 'function') {
            buildPetalEditor();
        }
    }
}

/**
 * Load controls with flower data
 * @param {Object} flower - Flower object to load into UI
 */
function loadControls(flower) {
    if (!flower) return;
    
    // Set basic flower properties
    document.getElementById('flowerName').value = flower.name || 'Новый цветок';
    document.getElementById('flowerType').value = flower.flowerType || 'simple';
    document.getElementById('fractalDepth').value = flower.fractalDepth || 0;
    document.getElementById('petals').value = flower.petals || 8;
    document.getElementById('radius').value = flower.radius || 35;
    document.getElementById('petalW').value = flower.petalW || 0.4;
    document.getElementById('petalH').value = flower.petalH || 0.75;
    document.getElementById('petalColor').value = flower.petalColor || '#f5a0c0';
    document.getElementById('petalColor2').value = flower.petalColor2 || '#ffc0d8';
    document.getElementById('centerColor').value = flower.centerColor || '#ffd700';
    document.getElementById('centerColor2').value = flower.centerColor2 || '#e8a000';
    document.getElementById('stemColor').value = flower.stemColor || '#5a9a48';
    document.getElementById('leafColor').value = flower.leafColor || '#4a8a38';
    document.getElementById('stamenCount').value = flower.stamenCount || 6;
    document.getElementById('stamenLen').value = flower.stamenLen || 0.25;
    document.getElementById('stamenColor').value = flower.stamenColor || '#ffcc88';
    document.getElementById('stamenType').value = flower.stamenType || 'simple';
    document.getElementById('antherSize').value = flower.antherSize || 1.0;
    document.getElementById('centerPattern').value = flower.centerPattern || 'none';
    
    // Update range value displays
    if (typeof updateRangeValues === 'function') {
        updateRangeValues();
    }
    
    // Rebuild petal editor if in asymmetric mode
    if (asymmetricMode && typeof buildPetalEditor === 'function') {
        buildPetalEditor();
    }
}

/**
 * Get flower data from UI controls
 * @returns {Object} Flower object with current UI values
 */
function getFlowerFromControls() {
    const flower = {
        name: document.getElementById('flowerName').value || 'Новый цветок',
        flowerType: document.getElementById('flowerType').value || 'simple',
        fractalDepth: parseInt(document.getElementById('fractalDepth').value) || 0,
        tilt3D: 0, // Removing 3D tilt functionality
        petals: parseInt(document.getElementById('petals').value) || 8,
        radius: parseInt(document.getElementById('radius').value) || 35,
        petalColor: document.getElementById('petalColor').value || '#f5a0c0',
        petalColor2: document.getElementById('petalColor2').value || '#ffc0d8',
        centerColor: document.getElementById('centerColor').value || '#ffd700',
        centerColor2: document.getElementById('centerColor2').value || '#e8a000',
        stemColor: document.getElementById('stemColor').value || '#5a9a48',
        leafColor: document.getElementById('leafColor').value || '#4a8a38',
        petalW: parseFloat(document.getElementById('petalW').value) || 0.4,
        petalH: parseFloat(document.getElementById('petalH').value) || 0.75,
        stamenCount: parseInt(document.getElementById('stamenCount').value) || 6,
        stamenLen: parseFloat(document.getElementById('stamenLen').value) || 0.25,
        stamenColor: document.getElementById('stamenColor').value || '#ffcc88',
        stamenType: document.getElementById('stamenType').value || 'simple',
        antherSize: parseFloat(document.getElementById('antherSize').value) || 1.0,
        centerPattern: document.getElementById('centerPattern').value || 'none'
    };

    // Add petalData if in asymmetric mode
    if (asymmetricMode && typeof window.savedFlowers !== 'undefined' && window.savedFlowers.length > 0) {
        const current = window.currentFlower || {};
        if (current.petalData) {
            flower.petalData = current.petalData;
        }
    }

    return flower;
}

/**
 * Update range value displays
 */
function updateRangeValues() {
    document.getElementById('petalsValue').textContent = document.getElementById('petals').value;
    document.getElementById('radiusValue').textContent = document.getElementById('radius').value;
    document.getElementById('petalWValue').textContent = document.getElementById('petalW').value;
    document.getElementById('petalHValue').textContent = document.getElementById('petalH').value;
    document.getElementById('stamenCountValue').textContent = document.getElementById('stamenCount').value;
    document.getElementById('stamenLenValue').textContent = document.getElementById('stamenLen').value;
    document.getElementById('fractalDepthValue').textContent = document.getElementById('fractalDepth').value;
    document.getElementById('antherSizeValue').textContent = document.getElementById('antherSize').value;
}

/**
 * Build petal editor UI
 */
function buildPetalEditor() {
    const editor = document.getElementById('petalEditor');
    const flower = getFlowerFromControls();
    const numPetals = flower.petals;
    
    if (!flower.petalData) {
        flower.petalData = [];
        for (let i = 0; i < numPetals; i++) {
            flower.petalData.push({
                angleOffset: 0,
                heightMultiplier: flower.petalH,
                widthMultiplier: flower.petalW
            });
        }
    }
    
    while (flower.petalData.length < numPetals) {
        flower.petalData.push({
            angleOffset: 0,
            heightMultiplier: flower.petalH,
            widthMultiplier: flower.petalW
        });
    }
    
    editor.innerHTML = '<div style="margin-bottom: 10px; color: #ffd700; font-weight: bold;">Индивидуальная настройка лепестков</div>';
    
    for (let i = 0; i < numPetals; i++) {
        const pd = flower.petalData[i];
        const petalDiv = document.createElement('div');
        petalDiv.className = 'petal-item';
        petalDiv.innerHTML = `
            <div class="petal-item-header">
                <span>Лепесток ${i + 1}</span>
            </div>
            <div class="petal-controls">
                <div class="petal-control">
                    <label>Угол: ${(pd.angleOffset * 180 / Math.PI).toFixed(0)}°</label>
                    <input type="range" min="-0.5" max="0.5" step="0.01" value="${pd.angleOffset}" 
                           oninput="updatePetalData(${i}, 'angleOffset', this.value)">
                </div>
                <div class="petal-control">
                    <label>Высота: ${pd.heightMultiplier.toFixed(2)}</label>
                    <input type="range" min="0.3" max="1.2" step="0.01" value="${pd.heightMultiplier}" 
                           oninput="updatePetalData(${i}, 'heightMultiplier', this.value)">
                </div>
                <div class="petal-control">
                    <label>Ширина: ${pd.widthMultiplier.toFixed(2)}</label>
                    <input type="range" min="0.1" max="0.8" step="0.01" value="${pd.widthMultiplier}" 
                           oninput="updatePetalData(${i}, 'widthMultiplier', this.value)">
                </div>
            </div>
        `;
        editor.appendChild(petalDiv);
    }
}

/**
 * Update individual petal data
 */
function updatePetalData(index, property, value) {
    const flower = getFlowerFromControls();
    if (!flower.petalData) flower.petalData = [];
    if (!flower.petalData[index]) {
        flower.petalData[index] = {
            angleOffset: 0,
            heightMultiplier: flower.petalH,
            widthMultiplier: flower.petalW
        };
    }
    
    flower.petalData[index][property] = parseFloat(value);
    
    // Update label
    const editor = document.getElementById('petalEditor');
    const petalItem = editor.querySelectorAll('.petal-item')[index];
    const labels = petalItem.querySelectorAll('label');
    
    if (property === 'angleOffset') {
        labels[0].textContent = `Угол: ${(parseFloat(value) * 180 / Math.PI).toFixed(0)}°`;
    } else if (property === 'heightMultiplier') {
        labels[1].textContent = `Высота: ${parseFloat(value).toFixed(2)}`;
    } else if (property === 'widthMultiplier') {
        labels[2].textContent = `Ширина: ${parseFloat(value).toFixed(2)}`;
    }
    
    loadControls(flower);
}

// Make functions available globally
window.savedFlowers = typeof savedFlowers !== 'undefined' ? savedFlowers : [];
window.currentFlower = typeof currentFlower !== 'undefined' ? currentFlower : null;
window.animationId = typeof animationId !== 'undefined' ? animationId : null;
window.asymmetricMode = typeof asymmetricMode !== 'undefined' ? asymmetricMode : false;
window.getDefaultFlower = typeof getDefaultFlower !== 'undefined' ? getDefaultFlower : undefined;
window.getTypeName = typeof getTypeName !== 'undefined' ? getTypeName : undefined;
window.onFlowerTypeChange = onFlowerTypeChange;
window.toggleAsymmetric = toggleAsymmetric;
window.loadControls = loadControls;
window.getFlowerFromControls = getFlowerFromControls;
window.updateRangeValues = updateRangeValues;
window.buildPetalEditor = buildPetalEditor;
window.updatePetalData = updatePetalData;