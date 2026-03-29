# EmotiArt

EmotiArt transforms your emotions into abstract procedural art in real time. It detects emotions through your camera (facial expressions) or typed text, then generates unique canvas-based artwork that visually represents how you feel.

Built for BluHacks 2026.

---

## What It Does

**Live Analysis** — Point your camera at your face. EmotiArt uses on-device facial expression recognition (`@vladmandic/face-api`) to detect your emotion and continuously update the generated artwork as your expression changes. No data leaves your device.

**Text Analysis** — Paste a message, journal entry, or anything you've written. EmotiArt scans it for emotional keywords and generates art matching the dominant emotion it finds.

---

## The Seven Emotions

| Emotion | Color | Shape |
|---------|-------|-------|
| Happy | `#FFD166` yellow | Circles with outer rings |
| Calm | `#06AED4` cyan | Sine wave strokes |
| Sad | `#9B72CF` purple | Downward arcs |
| Angry | `#EF233C` red | Sharp triangles |
| Anxious | `#F4A261` orange | Scattered dot clusters |
| Excited | `#FF6B9D` pink | 6-point starbursts |
| Overwhelmed | `#8ECAE6` light blue | Overlapping rectangles |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Emotion Detection:** [`@vladmandic/face-api`](https://github.com/vladmandic/face-api) — runs entirely in-browser via TensorFlow.js (TinyFaceDetector + FaceExpressionNet)
- **Art Generation:** HTML5 Canvas — procedural shape generation with staggered fade-in animation
- **UI Components:** Radix UI primitives + shadcn/ui
- **Contact Form:** Web3Forms

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Live camera-based emotion detection + art generation |
| `/text-analysis` | Text input emotion analysis + art generation |
| `/about` | How EmotiArt works, emotion palette reference |
| `/contact` | Feedback and bug reports |

---

## Running Locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How the Live Detection Works

1. Click **Start camera** on the home page
2. `useFaceDetection` hook loads two small model files (~2.3MB) from `/public/models/`
3. Detection runs at ~7fps using `requestAnimationFrame` — entirely on your device
4. The dominant expression maps to one of the 7 emotions and drives the art canvas in real time

Face-api expression → EmotiArt emotion mapping:
`happy → happy` · `neutral → calm` · `sad → sad` · `angry → angry` · `fearful → anxious` · `surprised → excited` · `disgusted → overwhelmed`
