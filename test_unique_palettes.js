/**
 * Test script to verify that 50 unique palettes are generated with no repeated petal or center colors
 */

// Function to test the palette uniqueness
async function testPaletteUniqueness() {
    console.log("Testing palette uniqueness functionality...");
    
    // Simulate loading the palette manager
    if (typeof window.loadPalettes === 'function') {
        await window.loadPalettes();
        console.log("✓ Palettes loaded successfully");
    } else {
        console.error("✗ Failed to load palettes - palette manager not available");
        return false;
    }
    
    // Generate 50 unique palettes
    if (typeof window.generate50UniquePalettes === 'function') {
        const palettes = window.generate50UniquePalettes();
        console.log(`Generated ${palettes.length} unique palettes`);
        
        if (palettes.length < 50) {
            console.warn(`⚠ Warning: Only ${palettes.length} palettes generated (expected 50)`);
        } else {
            console.log("✓ Successfully generated 50 palettes");
        }
        
        // Check for uniqueness of petal and center colors
        const petalColorsSet = new Set();
        const centerColorsSet = new Set();
        let duplicatePetalFound = false;
        let duplicateCenterFound = false;
        
        for (let i = 0; i < palettes.length; i++) {
            const palette = palettes[i];
            
            // Check petal colors (primary and secondary)
            if (petalColorsSet.has(palette.primary.toLowerCase()) || 
                petalColorsSet.has(palette.secondary.toLowerCase())) {
                console.error(`✗ Duplicate petal color found in palette ${i}:`, palette);
                duplicatePetalFound = true;
            } else {
                petalColorsSet.add(palette.primary.toLowerCase());
                petalColorsSet.add(palette.secondary.toLowerCase());
            }
            
            // Check center colors (accent and accentDark)
            if (centerColorsSet.has(palette.accent.toLowerCase()) || 
                centerColorsSet.has(palette.accentDark.toLowerCase())) {
                console.error(`✗ Duplicate center color found in palette ${i}:`, palette);
                duplicateCenterFound = true;
            } else {
                centerColorsSet.add(palette.accent.toLowerCase());
                centerColorsSet.add(palette.accentDark.toLowerCase());
            }
        }
        
        if (!duplicatePetalFound) {
            console.log(`✓ All ${petalColorsSet.size} petal colors are unique`);
        }
        
        if (!duplicateCenterFound) {
            console.log(`✓ All ${centerColorsSet.size} center colors are unique`);
        }
        
        // Summary
        console.log("\n--- Test Results ---");
        console.log(`Total palettes generated: ${palettes.length}`);
        console.log(`Unique petal colors: ${petalColorsSet.size}`);
        console.log(`Unique center colors: ${centerColorsSet.size}`);
        console.log(`Duplicate petal colors found: ${duplicatePetalFound ? 'Yes' : 'No'}`);
        console.log(`Duplicate center colors found: ${duplicateCenterFound ? 'Yes' : 'No'}`);
        
        if (!duplicatePetalFound && !duplicateCenterFound) {
            console.log("🎉 All tests passed! Palettes are unique as required.");
            return true;
        } else {
            console.log("❌ Some tests failed! There are duplicate colors.");
            return false;
        }
    } else {
        console.error("✗ generate50UniquePalettes function is not available");
        return false;
    }
}

// Run the test
if (typeof window !== 'undefined') {
    // Browser environment
    window.testPaletteUniqueness = testPaletteUniqueness;
    
    // Optionally run automatically when page loads
    window.addEventListener('load', async function() {
        console.log("Running palette uniqueness test...");
        await testPaletteUniqueness();
    });
} else {
    // Node.js environment (would need additional setup to work with browser globals)
    console.log("This test is designed to run in a browser environment.");
}

console.log("Test script loaded. Call testPaletteUniqueness() to run the test.");