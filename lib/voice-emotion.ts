import type { EmotionKey } from "@/lib/emotiart-types";

// Emotion keywords with weights (higher = more indicative)
const EMOTION_KEYWORDS: Record<EmotionKey, Array<[string, number]>> = {
  happy: [
    ["happy", 1.0], ["joy", 1.0], ["joyful", 1.0], ["great", 0.7], ["wonderful", 0.9],
    ["amazing", 0.8], ["love", 0.8], ["glad", 0.9], ["delighted", 1.0], ["cheerful", 1.0],
    ["fantastic", 0.8], ["awesome", 0.8], ["thrilled", 1.0], ["pleased", 0.9],
    ["elated", 1.0], ["grateful", 0.8], ["blessed", 0.7], ["beautiful", 0.6],
    ["perfect", 0.7], ["yay", 1.0], ["woohoo", 1.0], ["celebrate", 0.8],
    ["laugh", 0.8], ["laughing", 0.8], ["smile", 0.7], ["smiling", 0.7], ["fun", 0.7],
  ],
  calm: [
    ["calm", 1.0], ["peaceful", 1.0], ["relaxed", 0.9], ["serene", 1.0], ["tranquil", 1.0],
    ["content", 0.8], ["gentle", 0.7], ["quiet", 0.6], ["still", 0.6], ["composed", 0.9],
    ["centered", 0.8], ["mindful", 0.8], ["balanced", 0.7], ["okay", 0.5], ["fine", 0.5],
    ["alright", 0.5], ["chill", 0.8], ["easy", 0.6], ["comfortable", 0.7],
  ],
  sad: [
    ["sad", 1.0], ["unhappy", 0.9], ["depressed", 1.0], ["down", 0.7], ["melancholy", 0.9],
    ["gloomy", 0.8], ["sorrowful", 1.0], ["heartbroken", 1.0], ["disappointed", 0.8],
    ["lonely", 0.9], ["grief", 1.0], ["crying", 0.9], ["tears", 0.8], ["cry", 0.8],
    ["miss", 0.6], ["lost", 0.6], ["lose", 0.5], ["died", 0.8], ["dead", 0.8],
    ["death", 0.7], ["alone", 0.7], ["hurt", 0.7], ["pain", 0.7], ["broken", 0.8],
    ["hopeless", 0.9], ["empty", 0.7], ["numb", 0.7], ["devastated", 1.0],
  ],
  angry: [
    ["angry", 1.0], ["mad", 0.9], ["furious", 1.0], ["rage", 1.0], ["irritated", 0.8],
    ["annoyed", 0.7], ["frustrated", 0.8], ["outraged", 1.0], ["livid", 1.0],
    ["hostile", 0.9], ["hate", 0.9], ["disgusted", 0.8], ["ridiculous", 0.5],
    ["stupid", 0.5], ["unfair", 0.6], ["wrong", 0.5], ["worst", 0.5], ["awful", 0.7],
    ["sick of", 0.8], ["fed up", 0.8], ["done with", 0.7],
  ],
  anxious: [
    ["anxious", 1.0], ["worried", 0.9], ["nervous", 0.8], ["stressed", 0.8], ["tense", 0.7],
    ["uneasy", 0.8], ["fearful", 0.9], ["panic", 1.0], ["dread", 0.9], ["apprehensive", 0.9],
    ["restless", 0.7], ["scared", 0.8], ["afraid", 0.8], ["fear", 0.8], ["terrified", 1.0],
    ["uncertain", 0.6], ["unsure", 0.6], ["doubt", 0.5], ["confused", 0.5],
  ],
  excited: [
    ["excited", 1.0], ["thrilled", 1.0], ["eager", 0.8], ["enthusiastic", 0.9],
    ["hyped", 0.9], ["pumped", 0.8], ["energized", 0.8], ["animated", 0.7],
    ["vibrant", 0.7], ["passionate", 0.7], ["exhilarated", 1.0], ["ready", 0.6],
    ["cant wait", 0.9], ["love this", 0.8], ["incredible", 0.7], ["wow", 0.6],
    ["omg", 0.6], ["insane", 0.6], ["fire", 0.5],
  ],
  overwhelmed: [
    ["overwhelmed", 1.0], ["overloaded", 0.9], ["swamped", 0.8], ["drowning", 0.9],
    ["exhausted", 0.8], ["chaos", 0.7], ["too much", 0.7], ["breaking down", 0.9],
    ["pressure", 0.6], ["burnout", 0.8], ["tired", 0.5], ["drained", 0.7],
    ["stuck", 0.5], ["behind", 0.4], ["failing", 0.7], ["mess", 0.6], ["disaster", 0.8],
  ],
};

// Negation words that flip or dampen emotional intensity
const NEGATIONS = ["not", "no", "dont", "doesn't", "can't", "won't", "isn't", "aren't", "wasn't", "weren't", "never", "neither", "nobody", "nothing", "nowhere"];

function isNegated(text: string, keywordIndex: number): boolean {
  // Check if there's a negation word within 2 words before the keyword
  const words = text.split(/\s+/);
  const contextStart = Math.max(0, keywordIndex - 3);
  const contextWords = words.slice(contextStart, keywordIndex);

  for (const neg of NEGATIONS) {
    if (contextWords.some((w) => w.toLowerCase().includes(neg))) {
      return true;
    }
  }
  return false;
}

export function analyzeVoiceEmotion(transcript: string): {
  emotion: EmotionKey;
  confidence: number;
  energy: number;
  secondaryEmotion?: EmotionKey;
  secondaryConfidence?: number;
} {
  if (!transcript.trim()) {
    return { emotion: "calm", confidence: 0, energy: 0 };
  }

  const lower = transcript.toLowerCase();
  const words = lower.split(/\s+/);
  const scores: Record<EmotionKey, number> = {
    happy: 0,
    calm: 0,
    sad: 0,
    angry: 0,
    anxious: 0,
    excited: 0,
    overwhelmed: 0,
  };
  let totalWeight = 0;

  // Keyword matching with negation handling
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const [keyword, weight] of keywords) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      let match;

      while ((match = regex.exec(lower)) !== null) {
        // Find which word index this match is at
        const textBeforeMatch = lower.substring(0, match.index);
        const wordCount = textBeforeMatch.split(/\s+/).filter((w) => w).length;

        // Check for negation
        const negated = isNegated(lower, wordCount);
        const scoreAdjustment = negated ? -weight * 0.5 : weight;

        scores[emotion as EmotionKey] += scoreAdjustment;
        totalWeight += Math.abs(scoreAdjustment);
      }
    }
  }

  // Find top 2 emotions
  const sortedEmotions = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);

  const topEmotion = (sortedEmotions[0]?.[0] as EmotionKey) || "calm";
  const topScore = sortedEmotions[0]?.[1] || 0;
  const secondaryEmotion = (sortedEmotions[1]?.[0] as EmotionKey) || undefined;
  const secondaryScore = sortedEmotions[1]?.[1] || 0;

  // Confidence: normalize by total weight
  const confidence = totalWeight > 0 ? Math.min(topScore / totalWeight, 1) : 0.2;
  const secondaryConfidence = totalWeight > 0 ? Math.min(secondaryScore / totalWeight, 1) : 0;

  // Energy: word count, punctuation, and speaking rate
  const wordCount = words.length;
  const questionMarks = (transcript.match(/\?/g) || []).length;
  const exclamations = (transcript.match(/!/g) || []).length;
  const allCaps = (transcript.match(/\b[A-Z]{2,}\b/g) || []).length;

  const energy = Math.min(
    1,
    (wordCount / 25) * 0.5 + // Penalize for word count (longer = more time = less intense)
      exclamations * 0.15 +
      allCaps * 0.08 -
      questionMarks * 0.05 // Questions slightly lower energy
  );

  return {
    emotion: topEmotion,
    confidence: Math.max(confidence, 0.1),
    energy,
    secondaryEmotion: secondaryConfidence > 0.05 ? secondaryEmotion : undefined,
    secondaryConfidence: secondaryConfidence > 0.05 ? secondaryConfidence : undefined,
  };
}
