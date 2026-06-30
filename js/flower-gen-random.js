// Random flower generation for flower generator

/**
 * Generate random flower with harmonious colors
 */
function generateRandomFlower() {
    const flowerTypes = ['simple', 'double', 'multi', 'cluster', 'spiral', 'rose', 'orchid', 'jellyfish', 'coral', 'microorganism', 'insectoid', 'cosmic-cluster'];
    const flowerType = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];
    
    let petals;
    if (flowerType === 'simple') petals = Math.floor(rand(5, 13));
    else if (flowerType === 'double') petals = Math.floor(rand(8, 20));
    else if (flowerType === 'multi') petals = Math.floor(rand(12, 25));
    else if (flowerType === 'cluster') petals = Math.floor(rand(9, 21));
    else if (flowerType === 'spiral') petals = Math.floor(rand(13, 26));
    else if (flowerType === 'rose') petals = 25;
    else if (flowerType === 'jellyfish') petals = Math.floor(rand(8, 16)); // Tentacles count
    else if (flowerType === 'coral') petals = Math.floor(rand(6, 12)); // Branches count
    else if (flowerType === 'microorganism') petals = 10; // Fixed for cellular structure
    else if (flowerType === 'insectoid') petals = 6; // Symmetrical insect anatomy
    else petals = Math.floor(rand(10, 20)); // Default for cosmic-cluster and others
    
    const radius = 35;
    const petalW = parseFloat(rand(0.2, 0.7).toFixed(2));
    const petalH = parseFloat(rand(0.5, 1.1).toFixed(2));
    const fractalDepth = Math.floor(rand(0, 3));
    const tilt3D = 0; // Удаляем 3D наклон, устанавливаем в 0
    
    let colors;
    if (customPalettes.length > 0 && Math.random() < 0.5) {
        const p = customPalettes[Math.floor(Math.random() * customPalettes.length)];
        colors = {
            primary: p.colors.primary,
            secondary: p.colors.secondary,
            accent: p.colors.accent,
            accentDark: p.colors.accentDark,
            stem: p.colors.stem,
            leaf: p.colors.leaf,
            stamen: p.colors.stamen
        };
    } else {
        colors = generateHarmoniousColors();
    }
    const petalColor = colors.primary;
    const petalColor2 = colors.secondary;
    const centerColor = colors.accent;
    const centerColor2 = colors.accentDark;
    const stemColor = colors.stem;
    const leafColor = colors.leaf;
    
    const stamenTypes = ['simple', 'filament', 'clustered', 'spiral', 'brush', 'prominent', 'minimal', 'exotic', 'glass', 'jewel'];
    const stamenType = stamenTypes[Math.floor(Math.random() * stamenTypes.length)];
    const stamenCount = Math.floor(rand(3, 16));
    const stamenLen = parseFloat(rand(0.15, 0.5).toFixed(2));
    const stamenColor = colors.stamen;
    const antherSize = parseFloat(rand(0.7, 1.5).toFixed(1));

    const centerPatterns = ['none', 'triangles', 'squares', 'pentagons', 'diamonds', 'cells', 'stars'];
    const centerPattern = centerPatterns[Math.floor(Math.random() * centerPatterns.length)];

    const flower = {
        name: `${getTypeName(flowerType)} ${Math.floor(rand(1, 999))}`,
        flowerType,
        fractalDepth,
        tilt3D, // Теперь всегда 0
        petals,
        radius,
        petalColor,
        petalColor2,
        centerColor,
        centerColor2,
        stemColor,
        leafColor,
        petalW,
        petalH,
        stamenCount,
        stamenLen,
        stamenColor,
        stamenType,
        antherSize,
        centerPattern
    };

    if (asymmetricMode) {
        flower.petalData = [];
        const asymmetryLevel = Math.random();
        
        for (let i = 0; i < petals; i++) {
            const angleVar = (Math.random() - 0.5) * 0.4 * asymmetryLevel;
            const heightVar = 1 + (Math.random() - 0.5) * 0.6 * asymmetryLevel;
            const widthVar = 1 + (Math.random() - 0.5) * 0.4 * asymmetryLevel;
            const windSensitivity = 0.5 + Math.random() * 1.5;
            
            flower.petalData.push({
                angleOffset: parseFloat(angleVar.toFixed(2)),
                heightMultiplier: parseFloat((petalH * heightVar).toFixed(2)),
                widthMultiplier: parseFloat((petalW * widthVar).toFixed(2)),
                windSensitivity: parseFloat(windSensitivity.toFixed(2))
            });
        }
    }

    loadControls(flower);
    
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '✨ Создан!';
    btn.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 1000);
}

// Make function available globally
window.generateRandomFlower = generateRandomFlower;