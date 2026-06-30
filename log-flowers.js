/**
 * Скрипт для вывода информации о сгенерированных цветах с названиями замощений и палитрами
 */

// Импортируем необходимые функции
import { generateRandomFlowerBatch, logGeneratedFlowers, resetGeneratedFlowers } from './js/random-flowers.js';

// Функция для генерации и вывода информации о цветах
function showGeneratedFlowers() {
    console.log('='.repeat(50));
    console.log('ЗАПУСК ВЫВОДА ИНФОРМАЦИИ О СГЕНЕРИРОВАННЫХ ЦВЕТАХ');
    console.log('='.repeat(50));
    
    // Сбрасываем предыдущие данные
    resetGeneratedFlowers();
    
    // Генерируем партию цветов
    console.log('\nГенерируем 15 цветов для демонстрации...\n');
    generateRandomFlowerBatch(15);
    
    // Выводим информацию о сгенерированных цветах
    logGeneratedFlowers();
    
    console.log('\n' + '='.repeat(50));
    console.log('ВЫВОД ИНФОРМАЦИИ ЗАВЕРШЕН');
    console.log('='.repeat(50));
}

// Выполняем функцию
showGeneratedFlowers();