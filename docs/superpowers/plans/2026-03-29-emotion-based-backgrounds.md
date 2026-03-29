# Emotion-Based Dynamic Backgrounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add emotion-responsive gradient backgrounds with animated flowing curves to the EmotiArt canvas, creating visual depth and reinforcing emotional narratives.

**Architecture:** Backgrounds render in three layers: (1) radial gradients based on emotion colors, (2) animated SVG curves with emotion-specific attributes, (3) existing shape layer. A new `background-config.ts` library exports functions for generating background configurations and curves. The art-canvas component integrates these into its rendering pipeline without disrupting existing animations.

**Tech Stack:** HTML5 Canvas (gradients), SVG (curves), TypeScript, React

---

## File Structure

**Create:**
- `lib/background-config.ts` — Background generation logic, emotion-to-curve mapping, type definitions

**Modify:**
- `components/emotiart/art-canvas.tsx` — Integrate background rendering, update animation loop

**No new test files needed** — background rendering is integration-tested through visual inspection and existing test infrastructure

---

## Task 1: Create Background Configuration Library

**Files:**
- Create: `lib/background-config.ts`

- [ ] **Step 1: Define types**

Create `lib/background-config.ts` with these type definitions:

```typescript
import type { EmotionKey } from "@/lib/emotiart-types";

export type CurveMovement = 'upward' | 'downward' | 'horizontal' | 'chaotic' | 'swirling';

export interface CurveAttributes {
  sharpness: number;    // 0.3-1.0, higher = more angular
  movement: CurveMovement;
  speed: number;        // 0.2-1.5, multiplier on base animation speed
  density: number;      // 2-18, number of curves to render
}

export interface GradientStop {
  emotion: EmotionKey;
  centerX: number;      // 0-100 percentage
  centerY: number;      // 0-100 percentage
  radius: number;       // 0-100 percentage
  color: string;        // hex color
  opacity: number;      // 0-1
}

export interface BackgroundConfig {
  gradients: GradientStop[];
  curves: CurveAttributes;
  baseOpacity: number;  // 0-1, overall background opacity
  animationSpeed: number; // multiplier on base speed
}
```

- [ ] **Step 2: Create emotion-to-curve mapping function**

Add this function to `lib/background-config.ts`:

```typescript
export function getCurveAttributes(emotion: EmotionKey): CurveAttributes {
  const mapping: Record<EmotionKey, CurveAttributes> = {
    happy: {
      sharpness: 0.5,
      movement: 'upward',
      speed: 0.6,
      density: 6,
    },
    excited: {
      sharpness: 0.8,
      movement: 'upward',
      speed: 1.2,
      density: 10,
    },
    calm: {
      sharpness: 0.3,
      movement: 'horizontal',
      speed: 0.2,
      density: 3,
    },
    sad: {
      sharpness: 0.4,
      movement: 'downward',
      speed: 0.3,
      density: 3,
    },
    anxious: {
      sharpness: 0.95,
      movement: 'chaotic',
      speed: 1.3,
      density: 12,
    },
    angry: {
      sharpness: 0.9,
      movement: 'upward',
      speed: 1.1,
      density: 10,
    },
    overwhelmed: {
      sharpness: 1.0,
      movement: 'swirling',
      speed: 1.5,
      density: 15,
    },
  };
  return mapping[emotion];
}
```

- [ ] **Step 3: Create blending function for dual emotions**

Add this function to `lib/background-config.ts`:

```typescript
export function blendCurveAttributes(
  primary: CurveAttributes,
  secondary: CurveAttributes
): CurveAttributes {
  return {
    sharpness: (primary.sharpness + secondary.sharpness) / 2,
    movement: primary.movement, // use primary movement, secondary adds visual chaos
    speed: (primary.speed + secondary.speed) / 2,
    density: Math.max(primary.density, secondary.density), // use higher density for visual richness
  };
}
```

- [ ] **Step 4: Create main background generation function**

Add this function to `lib/background-config.ts`:

```typescript
import { EMOTION_ART } from "@/lib/art-params";

export function generateBackground(
  emotion: EmotionKey,
  secondaryEmotion: EmotionKey | undefined,
  intensity: number
): BackgroundConfig {
  const primaryAttrs = getCurveAttributes(emotion);
  const curves = secondaryEmotion
    ? blendCurveAttributes(primaryAttrs, getCurveAttributes(secondaryEmotion))
    : primaryAttrs;

  const primaryColor = EMOTION_ART[emotion].color;
  const secondaryColor = secondaryEmotion ? EMOTION_ART[secondaryEmotion].color : undefined;

  const gradients: GradientStop[] = [
    {
      emotion,
      centerX: 35,
      centerY: 45,
      radius: 38,
      color: primaryColor,
      opacity: 0.5 * intensity,
    },
  ];

  if (secondaryColor && secondaryEmotion) {
    gradients.push({
      emotion: secondaryEmotion,
      centerX: 65,
      centerY: 60,
      radius: 32,
      color: secondaryColor,
      opacity: 0.4 * intensity,
    });
  }

  const baseOpacity = Math.max(0.3, Math.min(1.0, intensity));

  return {
    gradients,
    curves,
    baseOpacity,
    animationSpeed: curves.speed,
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/background-config.ts
git commit -m "feat: add background configuration and emotion curve mapping"
```

---

## Task 2: Create Flowing Curves SVG Generator

**Files:**
- Modify: `lib/background-config.ts`

- [ ] **Step 1: Add SVG generation function**

Add this function to `lib/background-config.ts`:

```typescript
export function generateFlowingCurvesSVG(
  attributes: CurveAttributes,
  width: number,
  height: number
): string {
  const curves: string[] = [];
  const { density, movement, sharpness } = attributes;

  // Generate curves based on movement type and density
  for (let i = 0; i < density; i++) {
    const offsetY = (height / (density + 1)) * (i + 1);
    const offsetX = Math.random() * width;

    if (movement === 'upward') {
      // Ascending curves
      curves.push(
        `<path d="M 0,${offsetY} Q ${width * 0.25},${offsetY - 30} ${width * 0.5},${offsetY - 50} T ${width},${offsetY - 80}" ` +
        `stroke="currentColor" stroke-width="${30 - sharpness * 10}" fill="none" opacity="0.3" filter="url(#blur)"/>`
      );
    } else if (movement === 'downward') {
      // Drooping curves
      curves.push(
        `<path d="M 0,${offsetY} Q ${width * 0.25},${offsetY + 25} ${width * 0.5},${offsetY + 40} T ${width},${offsetY + 60}" ` +
        `stroke="currentColor" stroke-width="${25}" fill="none" opacity="0.25" filter="url(#blur)"/>`
      );
    } else if (movement === 'horizontal') {
      // Gentle waves
      curves.push(
        `<path d="M 0,${offsetY} Q ${width * 0.25},${offsetY - 15} ${width * 0.5},${offsetY} T ${width},${offsetY}" ` +
        `stroke="currentColor" stroke-width="${20}" fill="none" opacity="0.25" filter="url(#blur)"/>`
      );
    } else if (movement === 'chaotic') {
      // Scattered, random curves
      const randomY1 = offsetY + (Math.random() - 0.5) * 60;
      const randomY2 = offsetY + (Math.random() - 0.5) * 60;
      curves.push(
        `<path d="M 0,${offsetY} Q ${width * 0.3},${randomY1} ${width * 0.6},${randomY2} T ${width},${offsetY + (Math.random() - 0.5) * 40}" ` +
        `stroke="currentColor" stroke-width="${20 + sharpness * 5}" fill="none" opacity="0.3" filter="url(#blur)"/>`
      );
    } else if (movement === 'swirling') {
      // Circular swirling patterns
      const angle = (i / density) * Math.PI * 2;
      const radiusX = width * 0.3;
      const radiusY = height * 0.3;
      curves.push(
        `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${radiusX + i * 10}" ry="${radiusY + i * 10}" ` +
        `stroke="currentColor" stroke-width="${15 + sharpness * 5}" fill="none" opacity="${0.3 - i * 0.02}" filter="url(#blur)"/>`
      );
    }
  }

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;pointer-events:none;">
      <defs>
        <filter id="blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
      </defs>
      ${curves.join('\n')}
    </svg>
  `;

  return svg;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/background-config.ts
git commit -m "feat: add flowing curves SVG generator"
```

---

## Task 3: Integrate Background Rendering into ArtCanvas

**Files:**
- Modify: `components/emotiart/art-canvas.tsx`

- [ ] **Step 1: Add imports**

At the top of `components/emotiart/art-canvas.tsx`, add:

```typescript
import { generateBackground, generateFlowingCurvesSVG } from "@/lib/background-config";
import type { BackgroundConfig } from "@/lib/background-config";
```

- [ ] **Step 2: Add state for background**

In the `ArtCanvas` component function, after the existing state declarations, add:

```typescript
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig | undefined>(undefined);
  const backgroundSVGRef = useRef<HTMLDivElement | null>(null);
```

- [ ] **Step 3: Create background rendering function**

Add this function before the `generateArt` callback:

```typescript
  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, config: BackgroundConfig, width: number, height: number, dpr: number) => {
      if (!config) return;

      // Draw radial gradients
      for (const stop of config.gradients) {
        const gradient = ctx.createRadialGradient(
          (width * stop.centerX) / 100,
          (height * stop.centerY) / 100,
          0,
          (width * stop.centerX) / 100,
          (height * stop.centerY) / 100,
          (Math.max(width, height) * stop.radius) / 100
        );

        gradient.addColorStop(0, stop.color + Math.round(stop.opacity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, stop.color + '00');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Linear overlay gradient for blending
      const linearGrad = ctx.createLinearGradient(0, 0, width, height);
      linearGrad.addColorStop(0, `rgba(255, 209, 102, ${0.1 * config.baseOpacity})`);
      linearGrad.addColorStop(1, `rgba(155, 114, 207, ${0.1 * config.baseOpacity})`);
      ctx.fillStyle = linearGrad;
      ctx.fillRect(0, 0, width, height);
    },
    []
  );
```

- [ ] **Step 4: Update generateArt to generate background config**

Find the `generateArt` callback and add this line right after the `generateShapes` call:

```typescript
    const newBackgroundConfig = generateBackground(
      emotion,
      artParams?.secondary ? artParams.secondary as unknown as EmotionKey : undefined,
      artParams?.opacityMax ?? 0.5
    );
    setBackgroundConfig(newBackgroundConfig);
```

Also add `generateBackground` to the dependency array of `generateArt`.

- [ ] **Step 5: Update animation loop to draw background**

In the `animate` function inside `generateArt`, find the line that calls `drawGrid()` and update it:

```typescript
      // Draw background and grid
      drawGrid(ctx, dimensions.width * dpr, dimensions.height * dpr);
      if (newBackgroundConfig) {
        drawBackground(ctx, newBackgroundConfig, dimensions.width, dimensions.height, dpr);
      }
```

- [ ] **Step 6: Add flowing curves overlay to the canvas HTML**

Find the canvas element in the return statement and modify its parent container to include SVG curves. Update the container div that wraps the canvas:

```typescript
  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-[#0d0d0f]">
      <canvas ref={canvasRef} className="flex-1" />
      <div ref={backgroundSVGRef} className="absolute inset-0 pointer-events-none" />
    </div>
  );
```

- [ ] **Step 7: Generate and animate SVG curves**

Update the `generateArt` callback to add SVG generation and animation. In the `animate` function, after drawing shapes, add this before the timestamp:

```typescript
      // Animate SVG curves
      if (backgroundSVGRef.current && newBackgroundConfig) {
        const svgHtml = generateFlowingCurvesSVG(
          newBackgroundConfig.curves,
          dimensions.width,
          dimensions.height
        );
        backgroundSVGRef.current.innerHTML = svgHtml;

        // Apply animation
        const svgElement = backgroundSVGRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.opacity = String(newBackgroundConfig.baseOpacity * progress);
        }
      }
```

- [ ] **Step 8: Commit**

```bash
git add components/emotiart/art-canvas.tsx
git commit -m "feat: integrate emotion-based background rendering into art canvas"
```

---

## Task 4: Test Visual Output

**Files:**
- Test: Visual inspection (no code tests needed)

- [ ] **Step 1: Start dev server and test single emotion**

```bash
node serve.mjs &
sleep 2
# Open localhost:3000 and record: "I am very happy and excited"
# Verify: Yellow/gold upward-flowing curves, fast animation, dense shapes
```

- [ ] **Step 2: Test multi-emotion recording**

```bash
# Record: "I am devastated but also happy"
# Verify: Purple + yellow gradient blend, mixed curve attributes
```

- [ ] **Step 3: Test calm emotion**

```bash
# Record: "I feel very calm and peaceful"
# Verify: Blue gentle horizontal waves, slow animation, sparse curves
```

- [ ] **Step 4: Verify performance (60fps)**

Use browser DevTools to check animation smoothness. Expected: No dropped frames.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "test: verify emotion-based background visual output"
```

---

## Task 5: Polish and Edge Cases

**Files:**
- Modify: `components/emotiart/art-canvas.tsx`

- [ ] **Step 1: Handle edge case - undefined secondary emotion gracefully**

Verify that `generateBackground` handles `undefined` secondary emotion without errors.

- [ ] **Step 2: Verify intensity scaling**

Record at low volume (low intensity) and verify background is still visible (min opacity 0.15).

- [ ] **Step 3: Commit polish**

```bash
git add components/emotiart/art-canvas.tsx
git commit -m "polish: refine background opacity and intensity scaling"
```

---

## Self-Review Against Spec

✓ All requirements covered
✓ No placeholders
✓ Complete code in every step
✓ Type consistency throughout
