import type { EmotionKey } from "@/lib/emotiart-types";

export const EMOTION_VECTORS: Record<EmotionKey, { valence: number; arousal: number }> = {
  happy:       { valence:  0.8, arousal:  0.4 },
  excited:     { valence:  0.7, arousal:  0.9 },
  calm:        { valence:  0.4, arousal: -0.6 },
  anxious:     { valence: -0.4, arousal:  0.7 },
  sad:         { valence: -0.7, arousal: -0.5 },
  angry:       { valence: -0.8, arousal:  0.8 },
  overwhelmed: { valence: -0.5, arousal:  0.9 },
};

const CONFLICT_THRESHOLD = 0.45;

export interface SynthesisResult {
  emotion: EmotionKey;
  intensity: number;
  conflict: boolean;
  conflictBlend: number;
  secondaryEmotion: EmotionKey;
  blendRatio: number;
}

function closestEmotion(valence: number, arousal: number): { emotion: EmotionKey; dist: number } {
  let best: EmotionKey = "calm";
  let bestDist = Infinity;

  for (const [name, vec] of Object.entries(EMOTION_VECTORS)) {
    const dist = Math.sqrt(
      (vec.valence - valence) ** 2 +
      (vec.arousal - arousal) ** 2
    );
    if (dist < bestDist) {
      bestDist = dist;
      best = name as EmotionKey;
    }
  }

  return { emotion: best, dist: bestDist };
}

export function synthesize(
  face: { emotion: EmotionKey; confidence: number },
  voice: { emotion: EmotionKey; confidence: number; energy: number; secondaryEmotion?: EmotionKey; secondaryConfidence?: number }
): SynthesisResult {
  const fv = EMOTION_VECTORS[face.emotion];
  const vv = EMOTION_VECTORS[voice.emotion];

  // Face 60%, voice 40%
  const total  = face.confidence + voice.confidence;
  const wFace  = (face.confidence  / total) * 0.6;
  const wVoice = (voice.confidence / total) * 0.4;
  const wSum   = wFace + wVoice;

  const blendedValence = (fv.valence * wFace + vv.valence * wVoice) / wSum;
  const blendedArousal = (fv.arousal * wFace + vv.arousal * wVoice) / wSum;

  const { emotion: finalEmotion, dist: minDist } = closestEmotion(blendedValence, blendedArousal);

  // Detect conflict: face vs voice primary, OR voice has secondary emotion with meaningful confidence
  const labelsDiffer = face.emotion !== voice.emotion;
  const voiceHasSecondary = voice.secondaryEmotion && (voice.secondaryConfidence ?? 0) > 0.05 && voice.secondaryEmotion !== voice.emotion;
  const conflict = labelsDiffer || voiceHasSecondary;
  const conflictBlend = conflict ? Math.min(0.5, minDist * 0.7) : 0;

  // Intensity: distance from center, boosted by voice energy
  const rawIntensity = Math.sqrt(blendedValence ** 2 + blendedArousal ** 2) / Math.sqrt(2);
  const intensity    = Math.min(1, rawIntensity * 0.7 + voice.energy * 0.3);

  // Secondary emotion: choose based on what we have
  // Priority: voice secondary (if exists) > voice primary (if differs from face) > face
  let secondaryEmotion: EmotionKey;
  if (voiceHasSecondary) {
    secondaryEmotion = voice.secondaryEmotion!;
  } else if (labelsDiffer) {
    secondaryEmotion = voice.confidence >= face.confidence ? face.emotion : voice.emotion;
  } else {
    secondaryEmotion = face.emotion;
  }

  // Blend ratio: bias toward speech (70%) vs face (30%)
  const SPEECH_WEIGHT = 0.7;
  const FACE_WEIGHT = 0.3;
  const blendRatio = Math.min(1, Math.max(0, (voice.confidence * SPEECH_WEIGHT) + (face.confidence * FACE_WEIGHT)));

  return {
    emotion: finalEmotion,
    intensity: Math.round(intensity * 100) / 100,
    conflict,
    conflictBlend: Math.round(conflictBlend * 100) / 100,
    secondaryEmotion,
    blendRatio: Math.round(blendRatio * 100) / 100,
  };
}
