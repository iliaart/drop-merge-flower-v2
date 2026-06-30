// Цветовые палитры для генератора цветов
// Загрузка палитр из 1000.json
// Используем централизованный менеджер палитр, поэтому не нужно дублировать логику здесь

// Track used palettes to ensure uniqueness - теперь используем из централизованного менеджера

// Загрузка палитр из 1000.json - теперь используем из централизованного менеджера

// Reset used palettes tracking when needed - теперь используем из централизованного менеджера

// Get an unused palette index, or return null if all palettes are used - теперь используем из централизованного менеджера

// Функция для получения случайной палитры из 1000.json - теперь используем из централизованного менеджера

// Функция для генерации гармоничной палитры на основе реальных цветов
function generateNaturalHarmonyPalette() {
    // Use centralized palette manager to ensure uniqueness
    if (typeof window.getUniquePaletteFromJson === 'function') {
        // Get unique palette from centralized manager
        const colors = window.getUniquePaletteFromJson();
        return colors;
    } else {
        // Fallback if centralized manager is not available
        // Загрузим палитры локально как резерв
        let localColorPalettes = [];
        
        // Try to load local copy
        if (typeof colorPalettes !== 'undefined' && colorPalettes.length > 0) {
            localColorPalettes = colorPalettes;
        } else {
            // Резервные палитры, если 1000.json не загрузился
            localColorPalettes = [
                ['#FFB6C1', '#FF69B4', '#FF1493', '#C71585', '#DB7093'], // Розово-красные
                ['#87CEEB', '#4682B4', '#0066CC', '#4169E1', '#1E90FF'], // Синие тона
                ['#98FB98', '#32CD32', '#228B22', '#006400', '#2E8B57'], // Зеленые тона
                ['#FFD700', '#FFA500', '#FF8C00', '#FF4500', '#FF0000'], // Теплые тона
                ['#DDA0DD', '#9370DB', '#8A2BE2', '#6A5ACD', '#4B0082']  // Фиолетовые тона
            ];
        }
        
        const palette = [...localColorPalettes[Math.floor(Math.random() * localColorPalettes.length)]];
        
        // Убедимся, что у нас достаточно цветов
        while (palette.length < 7) {
            palette.push(palette[Math.floor(Math.random() * palette.length)]);
        }
        
        // Назначим цвета для разных элементов цветка
        return {
            primary: palette[0],
            secondary: palette[1],
            accent: palette[2],
            accentDark: palette[3],
            stem: palette[4],
            leaf: palette[5],
            stamen: palette[6]
        };
    }
}

// Функция для проверки гармонии цветов
function calculateColorHarmony(color1, color2) {
    // Преобразуем HEX в RGB
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    // Вычисляем евклидоово расстояние в RGB пространстве
    const distance = Math.sqrt(
        Math.pow(r1 - r2, 2) +
        Math.pow(g1 - g2, 2) +
        Math.pow(b1 - b2, 2)
    );
    
    // Нормализуем до 0-100, где 100 - максимальная гармония (минимальное расстояние)
    const maxDistance = Math.sqrt(3 * Math.pow(255, 2)); // ~441.67
    return 100 - (distance / maxDistance * 100);
}

// Функция для оценки общей гармонии палитры
function evaluatePaletteHarmony(colors) {
    const colorArray = [colors.primary, colors.secondary, colors.accent, colors.accentDark];
    let totalScore = 0;
    let comparisons = 0;
    
    // Сравниваем каждый цвет с каждым другим
    for (let i = 0; i < colorArray.length; i++) {
        for (let j = i + 1; j < colorArray.length; j++) {
            const harmony = calculateColorHarmony(colorArray[i], colorArray[j]);
            totalScore += harmony;
            comparisons++;
        }
    }
    
    return comparisons > 0 ? totalScore / comparisons : 0;
}

// Функция для проверки разнообразия цветов
function passesDiversityCheck(colors) {
    // Проверяем, имеет ли палитра хороший общий балл гармонии
    const harmonyScore = evaluatePaletteHarmony(colors);
    
    // Мы хотим умеренно разнообразные, но гармоничные цвета
    if (harmonyScore < 30 || harmonyScore > 80) {
        return false; // Слишком похожи или слишком разные
    }
    
    // Проверяем, нет ли цветов, слишком близких к черному или белому (экстремальные значения)
    const extremeColors = [colors.primary, colors.secondary, colors.accent, colors.accentDark]
        .map(color => {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            // Проверяем, слишком ли близок цвет к черному (все значения < 30) или белому (все значения > 225)
            return (r < 30 && g < 30 && b < 30) || (r > 225 && g > 225 && b > 225);
        })
        .some(isExtreme => isExtreme);
    
    return !extremeColors;
}

// Функция для генерации цвета, дополняющего два заданных цвета
function generateComplementaryColor(color1, color2, type = 'stem') {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    let r, g, b;
    
    if (type === 'stem') {
        // Генерируем зеленоватый оттенок на основе средних значений
        r = Math.min(100, Math.floor((r1 + r2) / 2 * 0.3));
        g = Math.min(255, Math.floor((g1 + g2) / 2 * 1.2));
        b = Math.min(100, Math.floor((b1 + b2) / 2 * 0.3));
    } else if (type === 'leaf') {
        // Генерируем другой зеленый оттенок с вариациями
        r = Math.min(80, Math.floor((r1 + r2) / 2 * 0.4));
        g = Math.min(255, Math.floor((g1 + g2) / 2 * 1.1));
        b = Math.min(80, Math.floor((b1 + b2) / 2 * 0.4));
    } else { // stamen
        // Генерируем яркий цвет, контрастирующий с основными цветами
        r = Math.min(255, 255 - Math.floor(r1 * 0.7));
        g = Math.min(255, 255 - Math.floor(g1 * 0.5));
        b = Math.min(255, 255 - Math.floor(b1 * 0.7));
    }
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Функция для получения случайной природной палитры
function getNaturalPalette() {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const palette = generateNaturalHarmonyPalette();
        if (passesDiversityCheck(palette)) {
            return palette;
        }
        attempts++;
    }
    
    // Если не удалось найти подходящую палитру, возвращаем базовую
    const basicPalette = generateNaturalHarmonyPalette();
    return basicPalette;
}

// Инициализация при загрузке - теперь не нужно, так как централизованный менеджер сам загружает

// Функции для UI
function addCustomPalette() {
    const name = document.getElementById('paletteName').value || `Палитра ${customPalettes.length + 1}`;
    const colors = getNaturalPalette();
    
    customPalettes.push({
        name,
        colors
    });
    
    updatePaletteList();
    document.getElementById('paletteName').value = '';
}

function applyPalette(index) {
    const palette = customPalettes[index];
    if (palette) {
        // Применяем палитру к текущему цветку
        console.log('Применяем палитру:', palette);
        // Здесь должна быть логика применения палитры к цветку
    }
}

function deletePalette(index) {
    customPalettes.splice(index, 1);
    updatePaletteList();
}

function updatePaletteList() {
    const list = document.getElementById('paletteList');
    if (!list) return;
    list.innerHTML = '';
    if (customPalettes.length === 0) {
        list.innerHTML = '<div style="color:#c0b0c8;font-size:0.85em;">Нет сохранённых палитр</div>';
        return;
    }
    customPalettes.forEach((p, i) => {
        const item = document.createElement('div');
        item.className = 'palette-item';
        const c = p.colors;
        item.innerHTML = `
            <div class="palette-swatches">
                <span class="swatch" style="background:${c.primary}"></span>
                <span class="swatch" style="background:${c.secondary}"></span>
                <span class="swatch" style="background:${c.accent}"></span>
                <span class="swatch" style="background:${c.accentDark}"></span>
                <span class="swatch" style="background:${c.stem}"></span>
                <span class="swatch" style="background:${c.leaf}"></span>
                <span class="swatch" style="background:${c.stamen}"></span>
            </div>
            <div class="palette-info">
                <span class="palette-name">${p.name}</span>
                <div class="palette-actions">
                    <button class="btn-sm btn-apply" onclick="applyPalette(${i})">Применить</button>
                    <button class="btn-sm btn-del" onclick="deletePalette(${i})">&times;</button>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

/**
 * Export custom palettes as JSON file
 */
function exportPalettes() {
    if (customPalettes.length === 0) {
        alert('Нет палитр для экспорта');
        return;
    }
    const json = JSON.stringify({ palettes: customPalettes }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'palettes.json';
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Convert a raw 5-color array to a named palette object
 * @param {string[]} c - [primary, secondary, accent, accentDark, stamen]
 * @param {number} idx - palette index for naming
 * @returns {{name:string, colors:object}}
 */
function rawToPalette(c, idx) {
    return {
        name: `Палитра ${idx + 1}`,
        colors: {
            primary: c[0], secondary: c[1],
            accent: c[2], accentDark: c[3],
            stem: '#5a9a48', leaf: '#4a8a38',
            stamen: c[4] || c[2]
        }
    };
}

/**
 * Import palettes from JSON file (supports named and raw array format)
 */
function importPalettes() {
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
                
                if (data.palettes && Array.isArray(data.palettes)) {
                    // Named palettes format
                    customPalettes = [...customPalettes, ...data.palettes];
                } else if (Array.isArray(data)) {
                    // Raw array format - convert to named format
                    const newPalettes = data.map((c, i) => rawToPalette(c, customPalettes.length + i));
                    customPalettes = [...customPalettes, ...newPalettes];
                } else {
                    throw new Error('Invalid palette format');
                }
                
                updatePaletteList();
                console.log(`Imported ${Array.isArray(data) ? data.length : data.palettes.length} palettes`);
            } catch (error) {
                console.error('Error importing palettes:', error);
                alert('Invalid file format');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Функция для генерации гармоничных цветов с использованием уникальных палитр из 1000.json
function generateHarmoniousColors() {
    // Используем централизованный менеджер палитр для обеспечения уникальности
    if (typeof window.getUniquePaletteFromJson === 'function') {
        return window.getUniquePaletteFromJson();
    } else {
        // Резервная генерация, если централизованный менеджер недоступен
        let localColorPalettes = [];
        
        // Попытаемся локально загрузить палитры как резерв
        if (typeof colorPalettes !== 'undefined' && colorPalettes.length > 0) {
            localColorPalettes = colorPalettes;
        } else {
            // Резервные палитры, если 1000.json не загрузился
            localColorPalettes = [
                ['#FFB6C1', '#FF69B4', '#FF1493', '#C71585', '#DB7093', '#228B22', '#32CD32'], // Розово-красные
                ['#87CEEB', '#4682B4', '#0066CC', '#4169E1', '#1E90FF', '#2E8B57', '#228B22'], // Синие тона
                ['#98FB98', '#32CD32', '#228B22', '#006400', '#2E8B57', '#4682B4', '#6495ED'], // Зеленые тона
                ['#FFD700', '#FFA500', '#FF8C00', '#FF4500', '#FF0000', '#8B0000', '#B22222'], // Теплые тона
                ['#DDA0DD', '#9370DB', '#8A2BE2', '#6A5ACD', '#4B0082', '#9400D3', '#8B008B']  // Фиолетовые тона
            ];
        }
        
        const palette = localColorPalettes[Math.floor(Math.random() * localColorPalettes.length)];
        return {
            primary: palette[0],
            secondary: palette[1],
            accent: palette[2],
            accentDark: palette[3],
            stem: palette[4],
            leaf: palette[5],
            stamen: palette[6]
        };
    }
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.getNaturalPalette = getNaturalPalette;
    window.addCustomPalette = addCustomPalette;
    window.applyPalette = applyPalette;
    window.deletePalette = deletePalette;
    window.updatePaletteList = updatePaletteList;
    window.exportPalettes = exportPalettes;
    window.importPalettes = importPalettes;
    window.calculateColorHarmony = calculateColorHarmony;
    window.evaluatePaletteHarmony = evaluatePaletteHarmony;
    window.passesDiversityCheck = passesDiversityCheck;
    window.generateComplementaryColor = generateComplementaryColor;
    window.generateHarmoniousColors = generateHarmoniousColors;
    window.colorPalettes = colorPalettes;
}