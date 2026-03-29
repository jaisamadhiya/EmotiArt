# Emotion-Based Dynamic Background Design

**Date:** 2026-03-29
**Feature:** Enhance EmotiArt visual output with emotion-responsive background layers
**Status:** Design Approved

---

## Overview

Currently, EmotiArt renders emotion shapes on a plain black background with a subtle grid. While the multi-emotion shape blending works well, the visual experience feels static and minimal.

This feature adds a **hybrid background system** that:
- Creates emotion-responsive gradient backgrounds that blend emotion colors
- Overlays flowing organic curves that animate based on emotional intensity
- Varies curve characteristics (sharpness, movement, speed, density) per emotion
- Layers backgrounds behind shapes for depth and visual richness

The result is a more immersive, atmospheric visualization that reinforces the emotional narrative.

---

## Visual Design

### Architecture: Three-Layer Rendering

The canvas renders from back to front:

1. **Layer 1: Radial Gradients** (bottom)
   - Multi-radial gradient backgrounds emanating from emotion color centers
   - Primary emotion (70% weight) and secondary emotion (30% weight) if present
   - Colors determined by `EMOTION_ART` color mappings
   - Opacity/intensity scaled by overall emotion intensity

2. **Layer 2: Flowing Curves** (middle)
   - SVG-based animated curves/waves overlaid on gradients
   - Characteristics vary per emotion (sharpness, movement, speed, density)
   - Semi-transparent, blurred for soft, organic look
   - Adds movement and visual interest without overwhelming shapes

3. **Layer 3: Emotion Shapes** (top)
   - Existing shape layer (circles, arcs, triangles, etc.)
   - Primary shapes 70% opacity, secondary shapes 40% opacity
   - Rendered on top of animated background

### Gradient Configuration

**Multi-Radial Approach:**
- Primary emotion gradient: centered at (30-40% X, 40-50% Y) with 35-40% radius
- Secondary emotion gradient (if conflict): centered at (60-70% X, 60-70% Y) with 30-35% radius
- Linear overlay gradient: 135° angle blending both colors
- Base color always dark (#0d0d0f)

**Color Blending:**
- When single emotion: one radial gradient of that emotion's color
- When two emotions: two radial gradients, colors blend at overlap points
- Opacity: base 0.5 for primary, 0.4 for secondary, adjusted by intensity multiplier

---

## Emotion-Based Curve Attributes

Flowing curves adapt to emotional characteristics using the **valence-arousal** emotion model:

### Attribute Mapping

| Emotion | Movement | Sharpness | Speed | Density |
|---------|----------|-----------|-------|---------|
| **Happy** | ↗ Upward, ascending | Smooth, flowing curves | Medium (0.6x) | Medium (5-8 curves) |
| **Excited** | ↗ Sharp upward spikes | Angular, energetic | Fast (1.2x) | Dense (8-12 curves) |
| **Calm** | → Gentle horizontal waves | Very smooth | Slow/still (0.2x) | Sparse (2-4 curves) |
| **Sad** | ↘ Drooping, sagging | Smooth, heavy | Slow (0.3x) | Sparse (2-4 curves) |
| **Anxious** | ↙ Chaotic, scattered | Sharp, jagged | Fast (1.3x) | Very dense (10-15) |
| **Angry** | ↗ Sharp spikes upward | Harsh, angular | Fast (1.1x) | Dense (8-12 curves) |
| **Overwhelmed** | ⟳ Swirling, turbulent | Turbulent, chaotic | Very fast (1.5x) | Very dense (12-18) |

### Attribute Definitions

**Movement:** Direction and style of curve paths
- Upward (positive emotions): curves rise from bottom
- Downward/drooping (sad): curves sag downward
- Chaotic (anxious/overwhelmed): scattered, swirling patterns
- Horizontal (calm): gentle waves

**Sharpness:** Curve smoothness vs angular harshness
- Smooth (calm, sad, happy): 0.3-0.5 tension in bezier curves
- Medium (excited, angry): 0.6-0.8 tension
- Sharp/jagged (anxious, overwhelmed): 0.9-1.0 tension with angular breaks

**Speed:** Animation velocity multiplier (relative to base 0.5s per cycle)
- Slow: 0.2-0.3x (calm, sad)
- Medium: 0.6x (happy)
- Fast: 1.1-1.3x (excited, angry, anxious)
- Very fast: 1.5x (overwhelmed)

**Density:** Number of curves rendered
- Sparse: 2-4 curves (calm, sad)
- Medium: 5-8 curves (happy)
- Dense: 8-12 curves (excited, angry)
- Very dense: 12-18 curves (anxious, overwhelmed)

---

## Technical Architecture

### Integration with Existing Code

**File: `components/emotiart/art-canvas.tsx`**

Modifications:
1. Add `drawBackground()` function to render gradient + curves before shapes
2. Add `generateFlowingCurves()` function to create emotion-specific SVG curves
3. Update animation loop to animate curves alongside shapes
4. Modify `generateArt()` to accept background configuration

**Data Flow:**
```
SynthesisResult (with emotion + intensity + conflict)
    ↓
buildArtParams() [existing]
    ↓
ArtCanvas receives: emotion, intensity, secondaryEmotion
    ↓
generateBackground() creates:
    - Gradient config based on emotions
    - Curve config based on emotion attributes
    ↓
drawBackground() renders:
    - Radial gradients
    - Animated SVG curves
    ↓
[Then existing shape rendering]
```

### New Functions

**`generateBackground(emotion, secondaryEmotion, intensity): BackgroundConfig`**
- Input: primary emotion, optional secondary emotion, intensity (0-1)
- Output: configuration for gradients and curves
- Returns: `{ gradients: [...], curves: [...], baseOpacity: number }`

**`drawBackground(ctx, config, width, height, progress): void`**
- Draws gradient layer using canvas context
- Renders SVG curves with appropriate opacity/animation

**`getCurveAttributes(emotion): CurveAttributes`**
- Maps emotion to sharpness, movement, speed, density values
- Returns: `{ sharpness, movement, speed, density }`

**`generateFlowingCurves(attributes, width, height): SVGElement`**
- Creates SVG element with curves matching emotion attributes
- Returns SVG string for overlay

### Type Definitions

```typescript
interface BackgroundConfig {
  gradients: GradientStop[];
  curves: CurveConfig;
  baseOpacity: number;
  animationSpeed: number;
}

interface CurveConfig {
  sharpness: number;      // 0.3-1.0
  movement: 'upward' | 'downward' | 'horizontal' | 'chaotic' | 'swirling';
  speed: number;          // 0.2-1.5
  density: number;        // 2-18 (number of curves)
}

interface GradientStop {
  emotion: EmotionKey;
  centerX: number;        // 0-100 (percentage)
  centerY: number;        // 0-100 (percentage)
  radius: number;         // 0-100 (percentage)
  opacity: number;        // 0-1
}
```

---

## Animation

### Background Animation Cycle

- **Duration:** Varies by emotion (based on `speed` attribute)
- **Easing:** Smooth, continuous loop
- **Effect:** Curves flow/pulse at emotion-appropriate tempo
- **Intensity linked:** Animation opacity scales with overall emotion intensity

### Curve Animation Details

- Curves use SVG path animation or canvas path drawing
- Wave/flow patterns progress along paths
- Opacity fades in/out at cycle start/end
- Multiple curves stagger their animations for visual richness

**Animation Frame Integration:**
- Curves animate at same `requestAnimationFrame` as shapes
- Progress value (0-1) drives both shape entrance and curve cycling
- Continuous after initial generation (loop smoothly)

---

## Edge Cases

**Single Emotion (no conflict):**
- One radial gradient centered at primary position
- Curve attributes match primary emotion
- Full opacity for background

**Multi-Emotion Conflict:**
- Two radial gradients: primary at strong position, secondary at weaker position
- Curve attributes interpolated between both emotions
  - Sharpness: weighted average
  - Movement: blend (e.g., upward + downward = chaotic)
  - Speed: average of both
  - Density: higher of the two (more visual richness when conflicted)

**Low Intensity:**
- Background opacity reduced (0.3-0.5x)
- Curves render but move very slowly
- Gradients appear more subtle

**High Intensity:**
- Background opacity boosted (0.8-1.0x)
- Curves animate faster
- More density curves rendered
- Stronger color saturation

---

## Performance Considerations

1. **Canvas Rendering:** Gradients are fast (native canvas feature)
2. **SVG Curves:** Lightweight SVG overlay with blur filter for smoothness
3. **Animation:** Uses `requestAnimationFrame` (already in use)
4. **Optimization:** Curves SVG generated once per emotion change, reused during animation

---

## Success Criteria

1. ✓ Background renders without impacting shape animation performance
2. ✓ Emotion-based curves clearly differ between emotion types
3. ✓ Multi-emotion blending is visually apparent (gradient overlap)
4. ✓ Curves animate smoothly and loop seamlessly
5. ✓ Canvas download includes full background + shapes
6. ✓ Works with both single and multi-emotion recordings

---

## Questions for Implementation

None — design is complete and ready for implementation planning.
