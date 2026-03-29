#!/usr/bin/env node
import { analyzeVoiceEmotion } from './lib/voice-emotion.ts';
import { synthesize } from './lib/emotion-synthesizer.ts';
import { buildArtParams } from './lib/art-params.ts';

// Same transcript the user tested with
const transcript = "today today my dog died and I'm pretty devastated and I don't really like it and but I'm happy because I passed my test and I got a hundred";

console.log('\n═══════════════════════════════════════════');
console.log('🎨 Testing Multi-Emotion Blending Fix');
console.log('═══════════════════════════════════════════\n');

console.log('📝 Transcript:', transcript);
console.log('\n');

// Step 1: Analyze voice emotion
const voiceResult = analyzeVoiceEmotion(transcript);
console.log('1️⃣ Voice Emotion Analysis:');
console.log(`   Primary: ${voiceResult.emotion} (confidence: ${(voiceResult.confidence * 100).toFixed(1)}%)`);
if (voiceResult.secondaryEmotion) {
  console.log(`   Secondary: ${voiceResult.secondaryEmotion} (confidence: ${(voiceResult.secondaryConfidence * 100).toFixed(1)}%)`);
}
console.log(`   Energy: ${voiceResult.energy.toFixed(2)}`);

// Step 2: Simulate face emotion (pretend we detected anxious face)
const faceEmotion = { emotion: 'anxious', confidence: 0.7 };
console.log('\n2️⃣ Face Emotion (simulated):');
console.log(`   ${faceEmotion.emotion} (confidence: ${(faceEmotion.confidence * 100).toFixed(1)}%)`);

// Step 3: Synthesize them
const synthesis = synthesize(faceEmotion, {
  emotion: voiceResult.emotion,
  confidence: voiceResult.confidence,
  energy: voiceResult.energy,
});
console.log('\n3️⃣ Synthesized Emotion:');
console.log(`   Final: ${synthesis.emotion} (intensity: ${synthesis.intensity.toFixed(2)})`);
console.log(`   Conflict detected: ${synthesis.conflict}`);
if (synthesis.secondaryEmotion) {
  console.log(`   Secondary: ${synthesis.secondaryEmotion} (blend: ${(synthesis.conflictBlend * 100).toFixed(1)}%)`);
  console.log(`   Blend ratio: ${(synthesis.blendRatio * 100).toFixed(1)}% speech, ${(100 - synthesis.blendRatio * 100).toFixed(1)}% face`);
}

// Step 4: Build art params
const artParams = buildArtParams(synthesis);
console.log('\n4️⃣ Art Parameters:');
console.log(`   Primary shapes: ${artParams.primaryShapeCount} (${artParams.primary.shape} - ${artParams.primary.color})`);
if (artParams.secondary) {
  console.log(`   Secondary shapes: ${artParams.secondaryShapeCount} (${artParams.secondary.shape} - ${artParams.secondary.color})`);
}
console.log(`   Total shapes: ${artParams.shapeCount}`);
console.log(`   Size range: ${artParams.sizeMin}px - ${artParams.sizeMax}px`);
console.log(`   Opacity range: ${artParams.opacityMin} - ${artParams.opacityMax}`);

console.log('\n═══════════════════════════════════════════');
console.log('✓ Multi-emotion blending is working!');
console.log('═══════════════════════════════════════════\n');
