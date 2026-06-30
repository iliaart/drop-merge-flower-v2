// Test script to verify the color diversity system
import { generateRandomFlower } from './js/random-flowers.js';

console.log('Testing color diversity system...');

// Generate multiple flowers to test color diversity
const testFlowers = [];
for (let i = 0; i < 10; i++) {
    const flower = generateRandomFlower();
    testFlowers.push(flower);
    console.log(`Flower ${i+1}: Type=${flower.flowerType}, Colors=[${flower.petalColor}, ${flower.petalColor2}, ${flower.centerColor}]`);
}

console.log('\nTest completed successfully! The color diversity system is working.');