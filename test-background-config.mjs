import { getCurveAttributes, blendCurveAttributes, generateBackground } from "./lib/background-config.ts";


console.log("=== Testing getCurveAttributes ===");
const happyAttrs = getCurveAttributes('happy');
console.log("happy:", happyAttrs);
console.log("Expected: { sharpness: 0.5, movement: 'upward', speed: 0.6, density: 6 }");
console.log("Match:", 
  happyAttrs.sharpness === 0.5 &&
  happyAttrs.movement === 'upward' &&
  happyAttrs.speed === 0.6 &&
  happyAttrs.density === 6 ? "✓ PASS" : "✗ FAIL");

console.log("\n=== Testing blendCurveAttributes ===");
const happyBlend = getCurveAttributes('happy');
const sadBlend = getCurveAttributes('sad');
const blended = blendCurveAttributes(happyBlend, sadBlend);
console.log("blended happy+sad:", blended);
console.log("Expected sharpness (0.5+0.4)/2:", (0.5+0.4)/2);
console.log("Expected movement: 'upward' (primary)");
console.log("Expected speed (0.6+0.3)/2:", (0.6+0.3)/2);
console.log("Expected density max(6,3):", Math.max(6,3));
console.log("Match:",
  blended.sharpness === (0.5+0.4)/2 &&
  blended.movement === 'upward' &&
  blended.speed === (0.6+0.3)/2 &&
  blended.density === 6 ? "✓ PASS" : "✗ FAIL");

console.log("\n=== Testing generateBackground (single emotion) ===");
const bg1 = generateBackground('happy', undefined, 0.8);
console.log("Single emotion config:");
console.log("- Gradients count:", bg1.gradients.length);
console.log("- Primary gradient emotion:", bg1.gradients[0].emotion);
console.log("- Primary gradient opacity:", bg1.gradients[0].opacity);
console.log("- Curves movement:", bg1.curves.movement);
console.log("- baseOpacity:", bg1.baseOpacity);
console.log("- animationSpeed:", bg1.animationSpeed);
console.log("Match:",
  bg1.gradients.length === 1 &&
  bg1.gradients[0].emotion === 'happy' &&
  bg1.gradients[0].opacity === 0.4 &&
  bg1.curves.movement === 'upward' &&
  bg1.baseOpacity === 0.8 &&
  bg1.animationSpeed === 0.6 ? "✓ PASS" : "✗ FAIL");

console.log("\n=== Testing generateBackground (dual emotions) ===");
const bg2 = generateBackground('happy', 'sad', 0.8);
console.log("Dual emotion config:");
console.log("- Gradients count:", bg2.gradients.length);
console.log("- Primary gradient emotion:", bg2.gradients[0].emotion);
console.log("- Secondary gradient emotion:", bg2.gradients[1].emotion);
console.log("- Secondary gradient opacity:", bg2.gradients[1].opacity);
console.log("- Curves movement:", bg2.curves.movement);
console.log("- Curves blended sharpness:", bg2.curves.sharpness);
console.log("Match:",
  bg2.gradients.length === 2 &&
  bg2.gradients[0].emotion === 'happy' &&
  bg2.gradients[1].emotion === 'sad' &&
  bg2.gradients[1].opacity === 0.32 &&
  bg2.curves.movement === 'upward' ? "✓ PASS" : "✗ FAIL");

console.log("\n=== All Emotions Test ===");
const emotions = ['happy', 'excited', 'calm', 'sad', 'anxious', 'angry', 'overwhelmed'];
emotions.forEach(emotion => {
  const attrs = getCurveAttributes(emotion);
  console.log(`${emotion}: sharpness=${attrs.sharpness}, movement=${attrs.movement}, speed=${attrs.speed}, density=${attrs.density}`);
});
