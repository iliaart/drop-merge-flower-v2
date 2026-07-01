/**
 * Централизованный менеджер палитр из 1000.json
 * Обеспечивает уникальность палитр и соблюдение требований проектной спецификации
 */

// Хранение загруженных палитр из 1000.json
let colorPalettes = [];

// Отслеживание использованных индексов палитр для обеспечения уникальности
let usedPaletteIndices = new Set();

// Отслеживание уникальных палитр по хешу для предотвращения повторений
let usedPaletteHashes = new Set();

// Хранение недавно использованных цветов для обеспечения разнообразия
let recentColors = {
    primary: [],
    secondary: [],
    accent: [],
    accentDark: [],
    stem: [],
    leaf: [],
    stamen: []
};

// Максимальное количество недавно использованных цветов для отслеживания
const MAX_RECENT_COLORS = 10;

/**
 * Загрузка палитр из 1000.json
 */
async function loadPalettes() {
    try {
        const response = await fetch('./1000.json');
        if (response.ok) {
            colorPalettes = await response.json();
            console.log(`Загружено ${colorPalettes.length} цветовых палитр из 1000.json`);
        } else {
            console.error('Не удалось загрузить 1000.json');
            // Резервные палитры, если 1000.json не загрузился
            colorPalettes = [
                ['#FFB6C1', '#FF69B4', '#FF1493', '#C71585', '#DB7093', '#228B22', '#32CD32'], // Розово-красные
                ['#87CEEB', '#4682B4', '#0066CC', '#4169E1', '#1E90FF', '#2E8B57', '#228B22'], // Синие тона
                ['#98FB98', '#32CD32', '#228B22', '#006400', '#2E8B57', '#4682B4', '#6495ED'], // Зеленые тона
                ['#FFD700', '#FFA500', '#FF8C00', '#FF4500', '#FF0000', '#8B0000', '#B22222'], // Теплые тона
                ['#DDA0DD', '#9370DB', '#8A2BE2', '#6A5ACD', '#4B0082', '#9400D3', '#8B008B']  // Фиолетовые тона
            ];
        }
    } catch (error) {
        console.error('Ошибка при загрузке 1000.json:', error);
        // Резервные палитры в случае ошибки
        colorPalettes = [
            ['#FFB6C1', '#FF69B4', '#FF1493', '#C71585', '#DB7093', '#228B22', '#32CD32'],
            ['#87CEEB', '#4682B4', '#0066CC', '#4169E1', '#1E90FF', '#2E8B57', '#228B22'],
            ['#98FB98', '#32CD32', '#228B22', '#006400', '#2E8B57', '#4682B4', '#6495ED'],
            ['#FFD700', '#FFA500', '#FF8C00', '#FF4500', '#FF0000', '#8B0000', '#B22222'],
            ['#DDA0DD', '#9370DB', '#8A2BE2', '#6A5ACD', '#4B0082', '#9400D3', '#8B008B']
        ];
    }
}

/**
 * Сброс отслеживания использованных палитр
 */
function resetUsedPalettes() {
    usedPaletteIndices = new Set();
}

/**
 * Получение индекса неиспользованной палитры
 * @returns {number|null} Индекс неиспользованной палитры или null, если все палитры использованы
 */
function getUnusedPaletteIndex() {
    if (usedPaletteIndices.size >= colorPalettes.length) {
        // Все палитры были использованы, сбрасываем отслеживание
        resetUsedPalettes();
    }
    
    // Найти неиспользованные индексы палитр
    const availableIndices = [];
    for (let i = 0; i < colorPalettes.length; i++) {
        if (!usedPaletteIndices.has(i)) {
            availableIndices.push(i);
        }
    }
    
    if (availableIndices.length === 0) {
        return null; // Все палитры использованы
    }
    
    // Выбрать случайный неиспользованный индекс
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    const selectedPaletteIndex = availableIndices[randomIndex];
    
    // Отметить палитру как использованную
    usedPaletteIndices.add(selectedPaletteIndex);
    
    return selectedPaletteIndex;
}

/**
 * Проверка, является ли цвет слишком похожим на недавно использованные
 * @param {string} newColor - Новый цвет в формате HEX
 * @param {Array} recentColorsList - Список недавно использованных цветов
 * @returns {boolean} true, если цвет слишком похож, иначе false
 */
function isColorTooSimilar(newColor, recentColorsList) {
    if (recentColorsList.length === 0) return false;
    
    // Преобразование HEX в RGB для сравнения
    const hex = newColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    for (const color of recentColorsList) {
        const recentHex = color.replace('#', '');
        const recentR = parseInt(recentHex.substring(0, 2), 16);
        const recentG = parseInt(recentHex.substring(2, 4), 16);
        const recentB = parseInt(recentHex.substring(4, 6), 16);
        
        // Вычисление расстояния цветов (евклидово расстояние в RGB пространстве)
        const distance = Math.sqrt(
            Math.pow(r - recentR, 2) +
            Math.pow(g - recentG, 2) +
            Math.pow(b - recentB, 2)
        );
        
        // Если расстояние мало, цвета слишком похожи
        if (distance < 40) return true;
    }
    
    return false;
}

/**
 * Добавление цвета в список недавно использованных
 * @param {string} colorType - Тип цвета (primary, secondary и т.д.)
 * @param {string} color - Цвет в формате HEX
 */
function addToRecentColors(colorType, color) {
    recentColors[colorType].unshift(color);
    if (recentColors[colorType].length > MAX_RECENT_COLORS) {
        recentColors[colorType].pop();
    }
}

/**
 * Преобразование HSL в HEX
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Цвет в формате HEX
 */
function hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Создание хеша палитры на основе цветов
 * @param {object} colors - Объект с цветами палитры
 * @returns {string} Хеш палитры
 */
function createPaletteHash(colors) {
    // Создаем строку на основе всех цветов в палитре
    const colorString = `${colors.primary}-${colors.secondary}-${colors.accent}-${colors.accentDark}-${colors.stem}-${colors.leaf}-${colors.stamen}`;
    // Простой алгоритм хеширования
    let hash = 0;
    for (let i = 0; i < colorString.length; i++) {
        const char = colorString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Преобразование в 32-битное целое число
    }
    return hash.toString();
}

/**
 * Проверка, использовалась ли уже палитра
 * @param {object} colors - Объект с цветами палитры
 * @returns {boolean} true если палитра уже использовалась
 */
function isPaletteAlreadyUsed(colors) {
    const hash = createPaletteHash(colors);
    return usedPaletteHashes.has(hash);
}

/**
 * Пометка палитры как использованной
 * @param {object} colors - Объект с цветами палитры
 */
function markPaletteAsUsed(colors) {
    const hash = createPaletteHash(colors);
    usedPaletteHashes.add(hash);
}

/**
 * Генерация гармоничной палитры из 1000.json с обеспечением уникальности
 * @returns {object} Объект с цветами палитры
 */
function getUniquePaletteFromJson() {
    if (colorPalettes.length === 0) {
        // Резервная генерация, если палитры не загружены
        return generateHarmoniousColorsFallback();
    }
    
    let attempts = 0;
    const maxAttempts = 50; // Ограничиваем количество попыток
    
    while (attempts < maxAttempts) {
        // Получить индекс неиспользованной палитры для обеспечения уникальности
        const paletteIndex = getUnusedPaletteIndex();
        if (paletteIndex === null) {
            // Если все палитры использованы, использовать резервную генерацию
            return generateHarmoniousColorsFallback();
        }
        
        // Получить палитру по выбранному индексу
        const palette = [...colorPalettes[paletteIndex]];
        
        // Убедиться, что у нас есть как минимум 7 цветов
        while (palette.length < 7) {
            palette.push(palette[Math.floor(Math.random() * palette.length)]);
        }
        
        // Назначить цвета различным элементам цветка
        const colors = {
            primary: palette[0],
            secondary: palette[1],
            accent: palette[2],
            accentDark: palette[3],
            stem: palette[4],
            leaf: palette[5],
            stamen: palette[6]
        };
        
        // Проверить, не слишком ли похожи эти цвета на недавно использованные
        if (
            !isColorTooSimilar(colors.primary, recentColors.primary) &&
            !isColorTooSimilar(colors.secondary, recentColors.secondary) &&
            !isColorTooSimilar(colors.accent, recentColors.accent) &&
            !isColorTooSimilar(colors.accentDark, recentColors.accentDark) &&
            !isColorTooSimilar(colors.stem, recentColors.stem) &&
            !isColorTooSimilar(colors.leaf, recentColors.leaf) &&
            !isColorTooSimilar(colors.stamen, recentColors.stamen)
        ) {
            // Дополнительно проверить, не использовалась ли уже такая комбинация цветов
            if (!isPaletteAlreadyUsed(colors)) {
                // Добавить цвета в список недавно использованных
                addToRecentColors('primary', colors.primary);
                addToRecentColors('secondary', colors.secondary);
                addToRecentColors('accent', colors.accent);
                addToRecentColors('accentDark', colors.accentDark);
                addToRecentColors('stem', colors.stem);
                addToRecentColors('leaf', colors.leaf);
                addToRecentColors('stamen', colors.stamen);
                
                // Отметить палитру как использованную
                markPaletteAsUsed(colors);
                
                return colors;
            }
        }
        // Если палитра уже использовалась или цвета слишком похожи, увеличиваем счетчик попыток и продолжаем
        attempts++;
    }
    
    // Если не удалось найти уникальную палитру за отведенное число попыток, использовать резервную генерацию
    return generateHarmoniousColorsFallback();
}

/**
 * Резервная генерация гармоничных цветов, если все палитры из 1000.json использованы
 * @returns {object} Объект с цветами палитры
 */
function generateHarmoniousColorsFallback() {
    // Попытаться несколько раз найти разнообразные цвета
    let attempts = 0;
    const maxAttempts = 15;
    
    while (attempts < maxAttempts) {
        // Генерация базового оттенка для цветка
        const baseHue = Math.floor(Math.random() * 360);
        
        // Создание гармоничных цветов с использованием теории цвета
        const primary = hslToHex(baseHue, 70 + Math.random() * 30, 40 + Math.random() * 30); // Основной цвет
        const secondary = hslToHex((baseHue + 30) % 360, 60 + Math.random() * 35, 45 + Math.random() * 25); // Аналогичный
        const accent = hslToHex((baseHue + 180) % 360, 65 + Math.random() * 30, 50 + Math.random() * 20); // Комплементарный
        const accentDark = hslToHex((baseHue + 180) % 360, 70 + Math.random() * 25, 30 + Math.random() * 20); // Темнее комплементарный
        const stem = hslToHex(120, 40 + Math.random() * 20, 25 + Math.random() * 15); // Зеленые тона для стебля
        const leaf = hslToHex(100, 45 + Math.random() * 20, 30 + Math.random() * 15); // Зеленые тона для листьев
        const stamen = hslToHex((baseHue + 150) % 360, 80 + Math.random() * 15, 60 + Math.random() * 20); // Контрастный тычинки
        
        // Проверить, не слишком ли похожи эти цвета на недавно использованные
        if (
            !isColorTooSimilar(primary, recentColors.primary) &&
            !isColorTooSimilar(secondary, recentColors.secondary) &&
            !isColorTooSimilar(accent, recentColors.accent) &&
            !isColorTooSimilar(accentDark, recentColors.accentDark) &&
            !isColorTooSimilar(stem, recentColors.stem) &&
            !isColorTooSimilar(leaf, recentColors.leaf) &&
            !isColorTooSimilar(stamen, recentColors.stamen)
        ) {
            // Добавить цвета в список недавно использованных
            addToRecentColors('primary', primary);
            addToRecentColors('secondary', secondary);
            addToRecentColors('accent', accent);
            addToRecentColors('accentDark', accentDark);
            addToRecentColors('stem', stem);
            addToRecentColors('leaf', leaf);
            addToRecentColors('stamen', stamen);
            
            return {
                primary,
                secondary,
                accent,
                accentDark,
                stem,
                leaf,
                stamen,
                scheme: 'harmonious-theory'
            };
        }
        
        attempts++;
    }
    
    // Если все равно не удалось найти разнообразные цвета, вернуть полностью случайные
    return generateRandomColors();
}

/**
 * Генерация случайных цветов как крайняя мера
 * @returns {object} Объект с цветами палитры
 */
function generateRandomColors() {
    const colors = {
        primary: hslToHex(Math.random() * 360, 70 + Math.random() * 30, 40 + Math.random() * 30),
        secondary: hslToHex(Math.random() * 360, 60 + Math.random() * 35, 45 + Math.random() * 25),
        accent: hslToHex(Math.random() * 360, 65 + Math.random() * 30, 50 + Math.random() * 20),
        accentDark: hslToHex(Math.random() * 360, 70 + Math.random() * 25, 30 + Math.random() * 20),
        stem: hslToHex(120, 40 + Math.random() * 20, 25 + Math.random() * 15),
        leaf: hslToHex(100, 45 + Math.random() * 20, 30 + Math.random() * 15),
        stamen: hslToHex(Math.random() * 360, 80 + Math.random() * 15, 60 + Math.random() * 20)
    };
    
    // Добавить цвета в список недавно использованных
    addToRecentColors('primary', colors.primary);
    addToRecentColors('secondary', colors.secondary);
    addToRecentColors('accent', colors.accent);
    addToRecentColors('accentDark', colors.accentDark);
    addToRecentColors('stem', colors.stem);
    addToRecentColors('leaf', colors.leaf);
    addToRecentColors('stamen', colors.stamen);
    
    return {
        ...colors,
        scheme: 'random'
    };
}

/**
 * Сброс истории цветов
 */
function resetColorHistory() {
    recentColors = {
        primary: [],
        secondary: [],
        accent: [],
        accentDark: [],
        stem: [],
        leaf: [],
        stamen: []
    };
}

// Загрузить палитры при инициализации модуля
loadPalettes();

// Сделать функции доступными глобально
if (typeof window !== 'undefined') {
    window.getUniquePaletteFromJson = getUniquePaletteFromJson;
    window.loadPalettes = loadPalettes;
    window.resetUsedPalettes = resetUsedPalettes;
    window.resetColorHistory = resetColorHistory;
}