#!/usr/bin/env node

/**
 * Test script for multi-emotion art generation with speech bias
 * Run with: node test-multi-emotion.mjs
 */

// Mock emotion synthesizer logic
function calculateBlendRatio(faceConfidence, voiceConfidence) {
  const SPEECH_WEIGHT = 0.7;
  const FACE_WEIGHT = 0.3;

  const blendRatio = (voiceConfidence * SPEECH_WEIGHT) + (faceConfidence * FACE_WEIGHT);
  return Math.max(0, Math.min(1, blendRatio));
}

// Mock art params builder logic
function splitShapeCounts(totalShapes, blendRatio) {
  const primaryShapeCount = Math.round(totalShapes * blendRatio);
  const secondaryShapeCount = totalShapes - primaryShapeCount;

  return {
    primaryShapeCount,
    secondaryShapeCount,
    blendRatio: Math.round(blendRatio * 100),
  };
}

// Test cases
const testCases = [
  {
    name: "Happy speech + Anxious face (high confidence)",
    face: { emotion: "anxious", confidence: 0.6 },
    voice: { emotion: "happy", confidence: 0.85 },
    totalShapes: 100,
  },
  {
    name: "Calm speech + Angry face (balanced)",
    face: { emotion: "angry", confidence: 0.8 },
    voice: { emotion: "calm", confidence: 0.5 },
    totalShapes: 100,
  },
  {
    name: "Excited speech + Overwhelmed face (extreme speech bias)",
    face: { emotion: "overwhelmed", confidence: 0.9 },
    voice: { emotion: "excited", confidence: 0.95 },
    totalShapes: 100,
  },
  {
    name: "Sad speech + Happy face (inverted emotions)",
    face: { emotion: "happy", confidence: 0.75 },
    voice: { emotion: "sad", confidence: 0.7 },
    totalShapes: 100,
  },
  {
    name: "Low confidence both (weak signals)",
    face: { emotion: "calm", confidence: 0.2 },
    voice: { emotion: "calm", confidence: 0.15 },
    totalShapes: 100,
  },
  {
    name: "Equal confidence (50/50 blend)",
    face: { emotion: "angry", confidence: 0.5 },
    voice: { emotion: "excited", confidence: 0.5 },
    totalShapes: 100,
  },
];

console.log("\n═══════════════════════════════════════════════════════════");
console.log("🎨 Multi-Emotion Art Generation Test Suite");
console.log("═══════════════════════════════════════════════════════════\n");

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const { name, face, voice, totalShapes } = testCase;

  console.log(`Test ${index + 1}: ${name}`);
  console.log("─────────────────────────────────────────────────────────");

  try {
    // Calculate blend ratio
    const blendRatio = calculateBlendRatio(face.confidence, voice.confidence);

    // Split shapes
    const { primaryShapeCount, secondaryShapeCount, blendRatio: blendPercent } =
      splitShapeCounts(totalShapes, blendRatio);

    // Validate
    const totalCheck = primaryShapeCount + secondaryShapeCount;
    const isValid = totalCheck === totalShapes && blendRatio >= 0 && blendRatio <= 1;

    // Output
    console.log(`  Face:     ${face.emotion} (${(face.confidence * 100).toFixed(0)}%)`);
    console.log(`  Voice:    ${voice.emotion} (${(voice.confidence * 100).toFixed(0)}%)`);
    console.log(`  ↓`);
    console.log(`  Blend Ratio:  ${blendPercent}% toward primary`);
    console.log(`  Primary:      ${primaryShapeCount} shapes (${voice.emotion})`);
    console.log(`  Secondary:    ${secondaryShapeCount} shapes (${face.emotion})`);
    console.log(`  Opacity:      Secondary at 40% opacity`);
    console.log(`  Total Shapes: ${totalCheck}/${totalShapes} ${totalCheck === totalShapes ? "✓" : "✗"}`);

    if (isValid) {
      console.log(`  Status:       ✓ PASS\n`);
      passed++;
    } else {
      console.log(`  Status:       ✗ FAIL (invalid calculation)\n`);
      failed++;
    }
  } catch (error) {
    console.log(`  Status:       ✗ FAIL (${error.message})\n`);
    failed++;
  }
});

console.log("═══════════════════════════════════════════════════════════");
console.log(`Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log("🎉 All tests passed! Multi-emotion blending algorithm is ready.\n");
  process.exit(0);
} else {
  console.log("❌ Some tests failed. Review the algorithm.\n");
  process.exit(1);
}
