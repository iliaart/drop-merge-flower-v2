// Merge System Module - flower merging logic and auto-merge functionality
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { getAllFlowersWithGenerated } from '../random-flowers.js';
import { visualEffects } from '../visual-effects.js';
import { removeFlower, createFlower } from './flower-mechanics.js';
import { triggerSlowmo, awardMergeScore, setFocusTarget } from './merge-cinema.js';
import { wakeNearMerge, wakeFlower, wakeNewFlower } from './sleep-system.js';

const { MERGE_RADIUS_BONUS } = CONFIG;

/**
 * Auto-merge the lowest-level flower type when distinct types exceed allowed count.
 * Picks the two lowest-level flowers at the smallest level and forces a merge,
 * effectively "evolving" them into the next tier and reducing type variety.
 */
export async function autoMergeExcessTypes() {
    if (state.gameState !== 'playing') return;
    
    // Import required functions dynamically to avoid circular dependency
    const coreModule = await import('./core.js');
    const allFlowers = getAllFlowersWithGenerated();
    const distinctLevels = coreModule.getDistinctLevelsInVase();
    const allowedCount = coreModule.getAllowedTypeCount();

    if (distinctLevels.length <= allowedCount) return;

    // Target the lowest level for forced merge
    const lowestLevel = distinctLevels[0];
    if (lowestLevel >= allFlowers.length - 1) return;

    // Collect all flowers at the lowest level, sorted by Y (lowest first)
    const lowestFlowers = state.flowers
        .map((f, idx) => ({ f, idx }))
        .filter(({ f }) => f && f.body && f.level === lowestLevel && !f.justSpawned && !f.spawning)
        .sort((a, b) => b.f.body.position.y - a.f.body.position.y);

    if (lowestFlowers.length < 2) return;

    // Merge the two lowest flowers at this level
    const { f: fa, idx: idxA } = lowestFlowers[0];
    const { f: fb, idx: idxB } = lowestFlowers[1];
    if (!fa || !fb || state.mergingSet.has(fa.body.id) || state.mergingSet.has(fb.body.id)) return;

    if (typeof window.performMerge === 'function') {
        window.performMerge(fa, fb, idxA, idxB);
    }
}

/**
 * Safety-net merge for same-level flowers that are physically overlapping
 * (centers closer than sum of radii). Catches cases where collisionStart
 * already fired and won't fire again (continuous contact after spawn).
 */
export function forceOverlapMerges() {
    if (state.gameState !== 'playing') return;
    const allFlowers = getAllFlowersWithGenerated();
    for (let i = 0; i < state.flowers.length; i++) {
        const fa = state.flowers[i];
        if (!fa || !fa.body) continue;
        // Get the actual collision radius for flower a (accounting for orchid reduction)
        const flowerAData = allFlowers[fa.level];
        const radiusA = flowerAData.flowerType === 'orchid' ? flowerAData.radius * 0.5 : flowerAData.radius;
        for (let j = i + 1; j < state.flowers.length; j++) {
            const fb = state.flowers[j];
            if (!fb || !fb.body) continue;
            if (fa.level !== fb.level || fa.level >= allFlowers.length - 1) continue;
            if (state.mergingSet.has(fa.body.id) || state.mergingSet.has(fb.body.id)) continue;

            const dx = fa.body.position.x - fb.body.position.x;
            const dy = fa.body.position.y - fb.body.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Get the actual collision radius for flower b (accounting for orchid reduction)
            const flowerBData = allFlowers[fb.level];
            const radiusB = flowerBData.flowerType === 'orchid' ? flowerBData.radius * 0.5 : flowerBData.radius;
            // Only merge when truly overlapping (centers < sum of radii)
            if (dist < radiusA + radiusB) {
                if (typeof window.performMerge === 'function') {
                    window.performMerge(fa, fb, i, j);
                }
                return;
            }
        }
    }
}

export function performMerge(fa, fb, idxA, idxB) {
    if (!fa || !fb || !fa.body || !fb.body) return;

    state.mergingSet.add(fa.body.id);
    state.mergingSet.add(fb.body.id);
    const mx = (fa.body.position.x + fb.body.position.x) / 2;
    const my = (fa.body.position.y + fb.body.position.y) / 2;
    const newLevel = fa.level + 1;

    // FPS sleep-system: a merge is happening HERE — wake the participants and
    // every sleeping flower nearby so the stack can physically react/settle.
    wakeFlower(fa);
    wakeFlower(fb);
    wakeNearMerge(mx, my);

    // Cinematic slow-motion + combo coefficient chain (x2, x3, ...)
    triggerSlowmo(mx, my, newLevel);
    // Merge depth: child inherits the max depth of its parents + 1 (flowers get slightly bigger)
    const newDepth = Math.max(fa.mergeDepth || 0, fb.mergeDepth || 0) + 1;
    // Score with the active multiplier applied
    const { base, mult } = awardMergeScore(newLevel);

    // Check if either of the flowers being merged is currently selected
    const wasSelected = state.selectedFlower && (state.selectedFlower === fa || state.selectedFlower === fb);

    // Get the colors of the merging flowers to use for the effect BEFORE removing them
    const allFlowers = getAllFlowersWithGenerated();
    const flowerAData = allFlowers[fa.level];
    const flowerBData = allFlowers[fb.level];
    const colorA = flowerAData ? flowerAData.petalColor : '#FFAABB';
    const colorB = flowerBData ? flowerBData.petalColor : '#FFAABB';

    // Remove the existing flowers
    removeFlower(idxA);
    removeFlower(idxB);

    // Create the new flower
    const nf = createFlower(mx, my, newLevel);
    if (nf) {
        // Merged flowers must be physical IMMEDIATELY (fall/settle/cascade).
        // createFlower() now spawns static bodies (bounds-bug fix), so wake it
        // right away — this also repairs the stale empty bounds setStatic left.
        wakeNewFlower(nf);
        nf.spawning = false;      // merged flower appears instantly — no spawn pop-in delay
        nf.mergeGlow = 1;
        nf.mergeDepth = newDepth;
        // Fast focus transfer onto the newly merged flower; it stays fully physical
        // (dynamic body, gravity on) during the merge hold (0.2s) and after the drop.
        setFocusTarget(nf);

        // Floating "+points (xN)" text at the merge point
        visualEffects.createScorePopup(mx, my - 20, base * mult, mult);

        // If one of the merged flowers was selected, select the new flower
        if (wasSelected) {
            state.selectedFlower = nf;
            // Set isDragging to true so the player can continue moving the flower
            state.isDragging = true;
                
            // Ensure the new flower has the correct physical properties for dragging
            // Store original gravity scale and make kinematic during drag
            nf.originalGravityScale = 0;  // Initially 0 since we're dragging
            nf.body.gravityScale = 0;     // Disable gravity while dragging
            state.Matter.Body.setStatic(nf.body, true);  // Make kinematic during drag
        }

        // Create merge effect with the color of the new flower for rings
        // and with the colors of the merging flowers for particles
        visualEffects.createMergeEffect(mx, my, newLevel, colorA, colorB);
        state.shake.trigger(6 + newLevel * 2);
        state.audio.playMerge(newLevel);
        if (newLevel > state.highestLevel) state.highestLevel = newLevel;
            
        // Проверка системы уровней: если новый цветок достиг минимально требуемого уровня для текущего игрового уровня
        if (newLevel >= state.minRequiredFlowerLevelForGameLevel) {
            state.flowersAtMaxLevel++;
                
            // Проверка, набрано ли достаточное количество цветов максимального уровня
            if (state.flowersAtMaxLevel >= state.targetFlowersForNextGameLevel) {
                startLevelTransition();
            }
        }
    }
}

// Функция начала перехода на следующий уровень
function startLevelTransition() {
    if (state.levelTransitionActive) return; // Предотвращение повторного запуска
    
    state.levelTransitionActive = true;
    
    // Подсчет цветов максимального уровня для сохранения в следующем уровне
    const allFlowers = getAllFlowersWithGenerated();
    state.flowersToDrop = [];
    
    for (let i = 0; i < state.flowers.length; i++) {
        const f = state.flowers[i];
        if (!f) continue;
        
        // Сохраняем цветы минимально требуемого уровня
        if (f.level >= state.minRequiredFlowerLevelForGameLevel) {
            // Добавляем информацию о цветке для последующего "падения"
            state.flowersToDrop.push({
                level: f.level,
                x: f.body && f.body.position ? f.body.position.x : f.x || 0,  // безопасный доступ к координате
                y: f.body && f.body.position ? f.body.position.y : f.y || 0   // безопасный доступ к координате
            });
        }
    }
    
    // Визуальные эффекты перехода между уровнями
    state.shake.trigger(15); // Более сильная камера для эффекта перехода
    state.audio.playDrop(); // Проигрывание звука
    
    // Начало процесса "падения" цветов
    setTimeout(() => {
        // Очистка текущего уровня
        for (let i = state.flowers.length - 1; i >= 0; i--) {
            const f = state.flowers[i];
            if (f) {
                removeFlower(i);
            }
        }
        
        // Обновление информации о уровне
        state.currentGameLevel++;
        state.flowersAtMaxLevel = 0; // Сброс счетчика
        state.minRequiredFlowerLevelForGameLevel++; // Увеличение требуемого уровня
        
        // Добавление цветов в следующий уровень (с задержкой для эффекта падения)
        setTimeout(() => {
            state.flowersToDrop.forEach(flowerData => {
                // Создание цветов в случайных позициях сверху
                const randomX = Math.random() * (CONFIG.VASE.r - CONFIG.VASE.l - 100) + CONFIG.VASE.l + 50;
                createFlower(randomX, CONFIG.DROP_Y, flowerData.level);
            });
            
            // Очистка массива цветов для следующего уровня
            state.flowersToDrop = [];
            state.levelTransitionActive = false;
        }, 1000); // Задержка перед появлением цветов в новом уровне
    }, 500); // Задержка перед очисткой для визуального эффекта
}

// Make function available globally as per project specification
window.performMerge = performMerge;