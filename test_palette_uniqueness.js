// Тестовый скрипт для проверки уникальности палитр
import { generateRandomFlower } from './js/random-flowers.js';

console.log('Тестирование уникальности палитр...');

// Генерируем несколько цветов
const flowers = [];
const maxFlowers = 20; // Уменьшим для тестирования

console.log(`Генерация ${maxFlowers} цветов...`);

for (let i = 0; i < maxFlowers; i++) {
    try {
        const flower = generateRandomFlower();
        flowers.push(flower);
        
        console.log(`Цветок ${i+1}: тип=${flower.type}, палитра=[${flower.petalColor}, ${flower.petalColor2}, ${flower.centerColor}, ${flower.centerColor2}, ${flower.stemColor}, ${flower.leafColor}, ${flower.stamenColor}]`);
    } catch (error) {
        console.error(`Ошибка при генерации цветка ${i+1}:`, error);
    }
}

// Проверяем уникальность палитр
const paletteSet = new Set();
let duplicates = 0;

for (const flower of flowers) {
    const paletteKey = `${flower.petalColor}|${flower.petalColor2}|${flower.centerColor}|${flower.centerColor2}|${flower.stemColor}|${flower.leafColor}|${flower.stamenColor}`;
    
    if (paletteSet.has(paletteKey)) {
        console.log(`Найдена дублирующаяся палитра: ${paletteKey}`);
        duplicates++;
    } else {
        paletteSet.add(paletteKey);
    }
}

console.log(`\nРезультаты:`);
console.log(`Всего сгенерировано цветов: ${flowers.length}`);
console.log(`Уникальных палитр: ${paletteSet.size}`);
console.log(`Дубликатов: ${duplicates}`);

if (duplicates === 0) {
    console.log('✓ Все палитры уникальны!');
} else {
    console.log(`⚠ Найдено ${duplicates} дублирующихся палитр.`);
}

// Также проверим через некоторое время сброс
console.log('\nПроверка сброса системы уникальности...');
if (typeof window !== 'undefined' && typeof window.resetUsedPalettes === 'function') {
    window.resetUsedPalettes();
    console.log('Система отслеживания уникальности сброшена.');
} else {
    console.log('Функция сброса не найдена или window не определен.');
}