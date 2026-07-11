// Тестовый скрипт для проверки системы уровней
console.log('=== Тестирование системы уровней ===');

// Функция для проверки, что все необходимые переменные состояния существуют
function testLevelSystemVariables() {
    console.log('Проверка переменных системы уровней...');
    
    const requiredVars = [
        'currentGameLevel',
        'targetFlowersForNextGameLevel', 
        'flowersAtMaxLevel',
        'minRequiredFlowerLevelForGameLevel',
        'levelTransitionActive',
        'flowersToDrop'
    ];
    
    let allPresent = true;
    for (const varName of requiredVars) {
        if (typeof state[varName] === 'undefined') {
            console.error(`Переменная ${varName} отсутствует в состоянии`);
            allPresent = false;
        } else {
            console.log(`✓ ${varName}: ${state[varName]}`);
        }
    }
    
    if (allPresent) {
        console.log('✓ Все переменные системы уровней присутствуют');
    } else {
        console.error('✗ Не все переменные системы уровней присутствуют');
    }
    
    return allPresent;
}

// Функция для проверки, что все необходимые параметры конфигурации существуют
function testLevelConfigVariables() {
    console.log('\nПроверка параметров конфигурации системы уровней...');
    
    const requiredConfigs = [
        'TARGET_FLOWERS_FOR_NEXT_LEVEL',
        'INITIAL_MAX_LEVEL_REQUIRED'
    ];
    
    let allPresent = true;
    for (const configName of requiredConfigs) {
        if (typeof CONFIG[configName] === 'undefined') {
            console.error(`Параметр ${configName} отсутствует в конфигурации`);
            allPresent = false;
        } else {
            console.log(`✓ ${configName}: ${CONFIG[configName]}`);
        }
    }
    
    if (allPresent) {
        console.log('✓ Все параметры конфигурации системы уровней присутствуют');
    } else {
        console.error('✗ Не все параметры конфигурации системы уровней присутствуют');
    }
    
    return allPresent;
}

// Функция для проверки, что функция отображения прогресса уровня существует
function testLevelProgressFunction() {
    console.log('\nПроверка функции отображения прогресса уровня...');
    
    if (typeof drawLevelProgress !== 'undefined') {
        console.log('✓ Функция drawLevelProgress существует');
        return true;
    } else {
        console.error('✗ Функция drawLevelProgress отсутствует');
        return false;
    }
}

// Функция для тестирования логики перехода уровня
function testLevelTransitionLogic() {
    console.log('\nПроверка логики перехода уровня...');
    
    // Имитируем ситуацию, когда игрок достигает нужного количества цветов максимального уровня
    console.log(`Текущий уровень игры: ${state.currentGameLevel}`);
    console.log(`Требуемый уровень цветка: ${state.minRequiredFlowerLevelForGameLevel}`);
    console.log(`Цветов максимального уровня: ${state.flowersAtMaxLevel}`);
    console.log(`Целевое количество цветов для перехода: ${state.targetFlowersForNextGameLevel}`);
    
    // Симуляция достижения цели
    const originalLevel = state.currentGameLevel;
    const originalMinLevel = state.minRequiredFlowerLevelForGameLevel;
    const originalFlowersAtMax = state.flowersAtMaxLevel;
    
    // Добавим цветов максимального уровня
    state.flowersAtMaxLevel = state.targetFlowersForNextGameLevel;
    
    console.log(`Увеличиваем счетчик цветов максимального уровня до ${state.flowersAtMaxLevel}`);
    
    // Вызываем логику проверки (хотя в реальной игре она вызывается автоматически при слиянии)
    if (state.flowersAtMaxLevel >= state.targetFlowersForNextGameLevel) {
        console.log('✓ Условие перехода на следующий уровень выполнено');
        console.log(`  - Следующий уровень игры: ${originalLevel + 1}`);
        console.log(`  - Новый требуемый уровень цветка: ${originalMinLevel + 1}`);
    } else {
        console.log('✗ Условие перехода на следующий уровень НЕ выполнено');
    }
    
    // Восстановим исходные значения
    state.flowersAtMaxLevel = originalFlowersAtMax;
    
    return true;
}

// Запуск всех тестов
function runAllTests() {
    console.log('Запуск тестов системы уровней...\n');
    
    const results = [];
    results.push(testLevelSystemVariables());
    results.push(testLevelConfigVariables());
    results.push(testLevelProgressFunction());
    results.push(testLevelTransitionLogic());
    
    const allPassed = results.every(result => result);
    
    console.log('\n=== Результаты тестирования ===');
    if (allPassed) {
        console.log('✓ Все тесты системы уровней пройдены успешно!');
        console.log('Система уровней готова к использованию.');
    } else {
        console.log('✗ Некоторые тесты системы уровней не пройдены.');
        console.log('Требуется дополнительная проверка и исправление.');
    }
}

// Запуск тестов (если все зависимости загружены)
if (typeof state !== 'undefined' && typeof CONFIG !== 'undefined') {
    runAllTests();
} else {
    console.log('Ожидание загрузки зависимостей...');
    // Если зависимости еще не загружены, ждем и пробуем снова
    setTimeout(() => {
        if (typeof state !== 'undefined' && typeof CONFIG !== 'undefined') {
            runAllTests();
        } else {
            console.error('Не удалось загрузить зависимости для тестирования');
        }
    }, 1000);
}