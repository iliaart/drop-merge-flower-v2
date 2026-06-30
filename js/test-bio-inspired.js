// Test script for bio-inspired flower types

console.log("Testing bio-inspired flower types...");

// Check if all required functions exist
const requiredFunctions = [
    'drawJellyfishFlower',
    'drawCoralFlower',
    'drawMicroorganismFlower',
    'drawInsectoidFlower',
    'drawCosmicClusterFlower',
    'extendFlowerDrawer'
];

let allFunctionsExist = true;
for (const funcName of requiredFunctions) {
    if (typeof window[funcName] === 'undefined') {
        console.error(`Missing function: ${funcName}`);
        allFunctionsExist = false;
    } else {
        console.log(`✓ Function exists: ${funcName}`);
    }
}

if (allFunctionsExist) {
    console.log("✓ All bio-inspired flower functions are available");
    
    // Test extending the flower drawer
    if (typeof extendFlowerDrawer === 'function') {
        extendFlowerDrawer();
        console.log("✓ Flower drawer successfully extended");
    } else {
        console.error("✗ extendFlowerDrawer function not found");
    }
    
    // Define a sample flower for testing
    const testFlower = {
        name: "Test Bio-Inspired Flower",
        flowerType: "jellyfish", // Change this to test different types
        petals: 12,
        radius: 50,
        petalColor: "#ff69b4",
        petalColor2: "#ffb6c1",
        centerColor: "#ffd700",
        centerColor2: "#ffa500",
        stemColor: "#3cb371",
        leafColor: "#2e8b57",
        petalW: 0.4,
        petalH: 0.75,
        stamenCount: 6,
        stamenLen: 0.25,
        stamenColor: "#ffcc88",
        stamenType: "simple",
        centerPattern: "none"
    };
    
    console.log("Sample flower created:", testFlower);
    console.log("Ready to render bio-inspired flowers!");
} else {
    console.error("✗ Some functions are missing, please check the implementation");
}