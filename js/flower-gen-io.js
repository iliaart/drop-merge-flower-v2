// Save/Export/Import/Reset functions for flower generator

// Declare savedFlowers variable globally
if (typeof savedFlowers === 'undefined') {
    var savedFlowers = [];
}

/**
 * Save current flower to saved list
 */
function saveFlower() {
    const flower = getFlowerFromControls();
    savedFlowers.push({...flower});
    updateFlowerList();
    updateJSONOutput();
}

/**
 * Update flower list display
 */
function updateFlowerList() {
    const list = document.getElementById('flowerList');
    list.innerHTML = '';
    
    savedFlowers.forEach((flower, index) => {
        const item = document.createElement('div');
        item.className = 'flower-item';
        
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        const scale = 100 / (flower.radius * 2.5);
        ctx.translate(50, 50);
        ctx.scale(scale, scale);
        drawGenericFlower(ctx, 0, 0, flower, 0);
        
        const name = document.createElement('div');
        name.className = 'flower-item-name';
        name.textContent = flower.name;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'flower-item-delete';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            savedFlowers.splice(index, 1);
            updateFlowerList();
            updateJSONOutput();
        };
        
        item.appendChild(canvas);
        item.appendChild(name);
        item.appendChild(deleteBtn);
        
        item.onclick = () => {
            loadControls(flower);
        };
        
        list.appendChild(item);
    });
}

/**
 * Export saved flowers as JSON file
 */
function exportJSON() {
    const data = {
        flowers: savedFlowers,
        exportDate: new Date().toISOString()
    };
    const json = JSON.stringify(data, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowers.json';
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Import flowers from JSON file
 */
function importJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.flowers && Array.isArray(data.flowers)) {
                    savedFlowers = data.flowers;
                    updateFlowerList();
                    updateJSONOutput();
                    alert(`Загружено ${savedFlowers.length} цветов`);
                }
            } catch (err) {
                alert('Ошибка загрузки файла: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

/**
 * Reset flower to defaults
 */
function resetFlower() {
    currentFlower = getDefaultFlower();
    loadControls(currentFlower);
}

/**
 * Update JSON output display
 */
function updateJSONOutput() {
    const output = document.getElementById('jsonOutput');
    if (savedFlowers.length === 0) {
        output.textContent = 'Нет сохранённых цветов';
        return;
    }
    
    const data = {
        flowers: savedFlowers
    };
    output.textContent = JSON.stringify(data, null, 2);
}

// Make functions available globally
window.saveFlower = saveFlower;
window.updateFlowerList = updateFlowerList;
window.exportJSON = exportJSON;
window.importJSON = importJSON;
window.resetFlower = resetFlower;
window.updateJSONOutput = updateJSONOutput;
window.getFlowerFromControls = typeof getFlowerFromControls !== 'undefined' ? getFlowerFromControls : window.getFlowerFromControls;
window.loadControls = typeof loadControls !== 'undefined' ? loadControls : window.loadControls;
