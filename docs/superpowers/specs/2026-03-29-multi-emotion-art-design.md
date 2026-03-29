# Multi-Emotion Art Generation with Speech Bias

**Date:** 2026-03-29
**Feature:** Blended multi-emotion visualization with speech weighting

## Overview

Currently, the art generation shows only one dominant emotion even when multiple emotions are detected (e.g., happy speech + anxious face). This design implements layered, blended art that visualizes multiple emotions simultaneously, with a 70/30 bias toward speech over facial expressions.

**Problem:** When detecting happy speech + anxious face, the current system shows only happy circles. Users expect to see a visual blend that reflects both emotions.

**Solution:** Calculate a weighted blend ratio from speech/face confidences, then render primary and secondary emotion shapes on the same canvas with layered transparency.

## Architecture

### 1. Emotion Weighting Algorithm

**Location:** `lib/emotion-synthesizer.ts` (enhance existing `synthesize()` function)

**Input:**
- Face emotion + confidence from facial expression detection
- Voice emotion + confidence from speech analysis
- Current blended emotion and conflict detection

**Processing:**
```
speechWeight = 0.7
faceWeight = 0.3

// Normalize confidences to 0-1 range
faceNorm = face.confidence
voiceNorm = voice.confidence

// Weighted blend ratio: how much to show of primary vs secondary
blendRatio = (voiceNorm * speechWeight) + (faceNorm * faceWeight)

// Clamp to 0-1 range
blendRatio = Math.max(0, Math.min(1, blendRatio))

// Calculate shape distribution
primaryShapeCount = Math.round(totalShapes * blendRatio)
secondaryShapeCount = totalShapes - primaryShapeCount
```

**Output:**
- `blendRatio`: 0-1 value indicating proportion of primary emotion
- `primaryShapeCount`: number of primary emotion shapes to render
- `secondaryShapeCount`: number of secondary emotion shapes to render

### 2. Art Parameters Enhancement

**Location:** `lib/emotiart-types.ts` (update `ArtParams` interface)

Add to `ArtParams`:
```typescript
interface ArtParams {
  // Existing fields
  primary: { color: string; colorRgb: number[]; shape: string };
  secondary: { color: string; colorRgb: number[]; shape: string } | null;
  shapeCount: number;
  sizeMin: number;
  sizeMax: number;
  opacityMin: number;
  opacityMax: number;
  secondaryRatio: number;

  // NEW fields
  primaryShapeCount: number;        // Count of primary emotion shapes
  secondaryShapeCount: number;      // Count of secondary emotion shapes
  secondaryOpacityScale: number;    // 0.3-0.6, multiplier for secondary opacity
}
```

**Location:** `lib/art-params.ts` (update `buildArtParams()` function)

**Changes:**
1. Calculate `blendRatio` from synthesis result
2. Split `shapeCount` into `primaryShapeCount` and `secondaryShapeCount` using blendRatio
3. Set `secondaryOpacityScale = 0.4` (secondary shapes rendered at 40% of normal opacity)
4. Return both counts in `ArtParams`

### 3. Canvas Rendering

**Location:** `components/emotiart/art-canvas.tsx` (update rendering logic)

**Changes:**
1. Add helper function `buildSecondaryShapes()` - similar to existing shape building, but:
   - Uses `secondaryShapeCount` instead of `shapeCount`
   - Uses secondary color instead of primary
   - Uses secondary shape type instead of primary
   - Applies `secondaryOpacityScale` to all opacity values

2. Update `generateShapes()` to:
   - Call `buildShapes()` for primary emotion (existing logic)
   - Call `buildSecondaryShapes()` for secondary emotion (new)
   - Combine both arrays: `[...primaryShapes, ...secondaryShapes]`
   - Return combined array to canvas renderer

3. Rendering order:
   - First pass: Draw all primary shapes (fully opaque)
   - Second pass: Draw all secondary shapes on top (semi-transparent)
   - This creates visual layering where secondary emotions peek through

**Key:** Both shape types distribute randomly across full canvas. No spatial separation—pure layering via transparency.

### 4. Data Flow

```
Recording/Live Input
  ↓
Face emotion detection: { emotion: "anxious", confidence: 0.6 }
Voice emotion detection: { emotion: "happy", confidence: 0.85 }
  ↓
Emotion synthesizer:
  - Primary: happy (from speech bias)
  - Secondary: anxious
  - blendRatio = (0.85 * 0.7) + (0.6 * 0.3) = 0.775
  ↓
Art params builder:
  - primaryShapeCount = 100 * 0.775 = ~78 happy circles
  - secondaryShapeCount = 100 * 0.225 = ~22 anxious dots
  - secondaryOpacityScale = 0.4
  ↓
Canvas renderer:
  - Render 78 happy circles (100% opacity, yellow)
  - Render 22 anxious dots (40% opacity, orange) on top
  ↓
Final visual: Mostly yellow circles with semi-transparent orange dots interspersed
```

## Implementation Steps

1. **Update emotion synthesizer** - Calculate `blendRatio` and determine which emotion is primary vs secondary based on speech bias
2. **Update art parameters builder** - Split shape counts and add secondary opacity scale
3. **Update canvas renderer** - Implement dual-layer rendering with transparency
4. **Test with mixed emotions** - Verify happy+anxious, sad+excited, etc. produce believable blends

## Visual Behavior

| Speech | Face | Blend | Result |
|--------|------|-------|--------|
| 90% happy | 20% anxious | 77% happy / 23% anxious | Mostly circles, scattered dots |
| 50% calm | 80% angry | 65% calm / 35% angry | More waves, visible triangles |
| 85% excited | 60% overwhelmed | 75% excited / 25% overwhelmed | Starbursts with overlapping squares |

## Edge Cases

- **Single emotion:** If only one emotion detected, secondary shapes = 0, renders normally
- **Equal emotions:** If both at 50%, split 50/50 (speech weight still applies)
- **No secondary emotion:** Handled by existing null check in art-params

## Success Criteria

✓ Multiple emotions visualized simultaneously
✓ Speech emotion dominates (70% bias)
✓ Visual blend feels cohesive (layering, not separation)
✓ Art is no longer bland—secondary shapes add visual complexity
✓ Blend ratio accurately reflects confidence levels
