"use client";

import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { EMOTIONS, EmotionKey, ArtParams } from "@/lib/emotiart-types";

interface ArtCanvasProps {
  emotion: EmotionKey;
  isGenerated: boolean;
  generationKey: number;
  artParams?: ArtParams;
}

const EMOTION_SHAPE: Record<EmotionKey, string> = {
  happy:       "circle",
  calm:        "wave",
  sad:         "arc",
  angry:       "triangle",
  anxious:     "dot",
  excited:     "star",
  overwhelmed: "dense",
};

// Vibrant gradient colors for each emotion - bright and saturated
const EMOTION_GRADIENT: Record<EmotionKey, { primary: string; secondary: string; tertiary: string }> = {
  happy:       { primary: "#FFE747", secondary: "#FFAA00", tertiary: "#FF7700" },
  calm:        { primary: "#00E5FF", secondary: "#00BCD4", tertiary: "#26C6DA" },
  sad:         { primary: "#B388FF", secondary: "#9C27B0", tertiary: "#7C4DFF" },
  angry:       { primary: "#FF1744", secondary: "#FF5252", tertiary: "#FF8A80" },
  anxious:     { primary: "#FFAB40", secondary: "#FF6E40", tertiary: "#FF9100" },
  excited:     { primary: "#FF4081", secondary: "#F50057", tertiary: "#FF80AB" },
  overwhelmed: { primary: "#40C4FF", secondary: "#00B0FF", tertiary: "#80D8FF" },
};

interface Shape {
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  shapeType: string;
  color: string;
  // Animation properties
  vx: number;
  vy: number;
  pulsePhase: number;
  pulseSpeed: number;
  rotationSpeed: number;
  layer: "background" | "midground" | "foreground";
  // anxious dots cluster
  dots?: { dx: number; dy: number; r: number }[];
  // overwhelmed / dense rect cluster
  rects?: { dx: number; dy: number; w: number; h: number; opacity: number }[];
}

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

interface GenOptions {
  shapeType: string;
  color: string;
  count: number;
  sizeMin: number;
  sizeMax: number;
  opacityMin: number;
  opacityMax: number;
}

function buildShapes(opts: GenOptions, width: number, height: number): Shape[] {
  const { shapeType, color, count, sizeMin, sizeMax, opacityMin, opacityMax } = opts;
  const shapes: Shape[] = [];

  // Distribute shapes across layers
  const backgroundCount = Math.floor(count * 0.3);
  const midgroundCount = Math.floor(count * 0.4);
  const foregroundCount = count - backgroundCount - midgroundCount;

  const layerCounts = [
    { layer: "background" as const, count: backgroundCount, sizeScale: 0.6, opacityScale: 0.4 },
    { layer: "midground" as const, count: midgroundCount, sizeScale: 1.0, opacityScale: 0.7 },
    { layer: "foreground" as const, count: foregroundCount, sizeScale: 1.4, opacityScale: 1.0 },
  ];

  for (const layerConfig of layerCounts) {
    for (let i = 0; i < layerConfig.count; i++) {
      // Bias towards center for some shapes
      const centerBias = Math.random() > 0.6;
      let x, y;
      if (centerBias) {
        x = width / 2 + (Math.random() - 0.5) * width * 0.6;
        y = height / 2 + (Math.random() - 0.5) * height * 0.6;
      } else {
        x = Math.random() * width;
        y = Math.random() * height;
      }

      const baseSize = Math.random() * (sizeMax - sizeMin) + sizeMin;
      const size = baseSize * layerConfig.sizeScale;
      const baseOpacity = Math.random() * (opacityMax - opacityMin) + opacityMin;
      const opacity = baseOpacity * layerConfig.opacityScale;
      const rotation = (Math.random() - 0.5) * 0.8;

      // Animation properties
      const vx = (Math.random() - 0.5) * 0.3;
      const vy = (Math.random() - 0.5) * 0.3;
      const pulsePhase = Math.random() * Math.PI * 2;
      const pulseSpeed = 0.5 + Math.random() * 1.0;
      const rotationSpeed = (Math.random() - 0.5) * 0.01;

      if (shapeType === "dot") {
        const dotCount = Math.floor(Math.random() * 6) + 4;
        const dots = Array.from({ length: dotCount }, () => ({
          dx: (Math.random() - 0.5) * size,
          dy: (Math.random() - 0.5) * size,
          r: Math.random() * 5 + 2,
        }));
        shapes.push({ x, y, size, opacity, rotation, shapeType, color, dots, vx, vy, pulsePhase, pulseSpeed, rotationSpeed, layer: layerConfig.layer });
      } else if (shapeType === "dense") {
        const rectCount = Math.floor(Math.random() * 4) + 3;
        const rects = Array.from({ length: rectCount }, () => ({
          dx: (Math.random() - 0.5) * size * 0.5,
          dy: (Math.random() - 0.5) * size * 0.5,
          w: Math.random() * size * 0.5 + size * 0.2,
          h: Math.random() * size * 0.5 + size * 0.2,
          opacity: Math.random() * 0.4 + 0.2,
        }));
        shapes.push({ x, y, size, opacity, rotation, shapeType, color, rects, vx, vy, pulsePhase, pulseSpeed, rotationSpeed, layer: layerConfig.layer });
      } else {
        shapes.push({ x, y, size, opacity, rotation, shapeType, color, vx, vy, pulsePhase, pulseSpeed, rotationSpeed, layer: layerConfig.layer });
      }
    }
  }

  // Sort by layer for proper rendering order
  return shapes.sort((a, b) => {
    const order = { background: 0, midground: 1, foreground: 2 };
    return order[a.layer] - order[b.layer];
  });
}

function generateParticles(color: string, width: number, height: number, count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 4 + 2,
    opacity: Math.random() * 0.7 + 0.3,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6 - 0.3,
    color,
    life: Math.random() * 100,
    maxLife: 100 + Math.random() * 100,
  }));
}

function generateShapes(
  emotion: EmotionKey,
  width: number,
  height: number,
  artParams?: ArtParams
): Shape[] {
  const emotionData = EMOTIONS.find((e) => e.key === emotion)!;

  if (artParams) {
    const primaryCount = artParams.primaryShapeCount ||
      (artParams.secondaryRatio > 0 && artParams.secondary
        ? Math.round(artParams.shapeCount * (1 - artParams.secondaryRatio))
        : artParams.shapeCount);

    const primary = buildShapes(
      {
        shapeType: artParams.primary.shape,
        color: artParams.primary.color,
        count: primaryCount,
        sizeMin: artParams.sizeMin,
        sizeMax: artParams.sizeMax,
        opacityMin: artParams.opacityMin,
        opacityMax: artParams.opacityMax,
      },
      width,
      height
    );

    if (artParams.secondary && (artParams.secondaryShapeCount > 0 || artParams.secondaryRatio > 0)) {
      const secondaryCount = artParams.secondaryShapeCount || (artParams.shapeCount - primaryCount);
      const opacityScale = artParams.secondaryOpacityScale || 0.7;

      const secondary = buildShapes(
        {
          shapeType: artParams.secondary.shape,
          color: artParams.secondary.color,
          count: secondaryCount,
          sizeMin: artParams.sizeMin,
          sizeMax: artParams.sizeMax,
          opacityMin: artParams.opacityMin * opacityScale,
          opacityMax: artParams.opacityMax * opacityScale,
        },
        width,
        height
      );
      return [...primary, ...secondary].sort((a, b) => {
        const order = { background: 0, midground: 1, foreground: 2 };
        return order[a.layer] - order[b.layer];
      });
    }

    return primary;
  }

  return buildShapes(
    {
      shapeType: EMOTION_SHAPE[emotion],
      color: emotionData.color,
      count: Math.floor(Math.random() * 40) + 60,
      sizeMin: 15,
      sizeMax: 70,
      opacityMin: 0.2,
      opacityMax: 0.7,
    },
    width,
    height
  );
}

function drawGradientBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  emotion: EmotionKey,
  time: number,
  secondaryEmotion?: EmotionKey
) {
  const gradientColors = EMOTION_GRADIENT[emotion];
  const secondaryGradient = secondaryEmotion ? EMOTION_GRADIENT[secondaryEmotion] : null;

  // Animated gradient position
  const cx = width / 2 + Math.sin(time * 0.0005) * width * 0.1;
  const cy = height / 2 + Math.cos(time * 0.0007) * height * 0.1;

  // Dark base
  ctx.fillStyle = "#08080a";
  ctx.fillRect(0, 0, width, height);

  // Primary radial gradient from center - BRIGHT
  const primaryGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.9);
  primaryGradient.addColorStop(0, hexToRgba(gradientColors.primary, 0.35));
  primaryGradient.addColorStop(0.3, hexToRgba(gradientColors.secondary, 0.2));
  primaryGradient.addColorStop(0.6, hexToRgba(gradientColors.tertiary, 0.1));
  primaryGradient.addColorStop(1, "transparent");
  ctx.fillStyle = primaryGradient;
  ctx.fillRect(0, 0, width, height);

  // Secondary radial at opposite corner
  const cx2 = width - cx;
  const cy2 = height - cy;
  const secondaryGrad = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, Math.max(width, height) * 0.7);
  secondaryGrad.addColorStop(0, hexToRgba(gradientColors.tertiary, 0.25));
  secondaryGrad.addColorStop(0.5, hexToRgba(gradientColors.secondary, 0.1));
  secondaryGrad.addColorStop(1, "transparent");
  ctx.fillStyle = secondaryGrad;
  ctx.fillRect(0, 0, width, height);

  // Secondary emotion gradient (if exists)
  if (secondaryGradient) {
    const sx = width * 0.7 + Math.sin(time * 0.0006) * width * 0.1;
    const sy = height * 0.3 + Math.cos(time * 0.0008) * height * 0.1;
    const secondGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(width, height) * 0.5);
    secondGrad.addColorStop(0, hexToRgba(secondaryGradient.primary, 0.25));
    secondGrad.addColorStop(0.5, hexToRgba(secondaryGradient.secondary, 0.12));
    secondGrad.addColorStop(1, "transparent");
    ctx.fillStyle = secondGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Ambient moving glow orbs - bigger and brighter
  const orbCount = 4;
  for (let i = 0; i < orbCount; i++) {
    const angle = time * 0.0003 + (i * Math.PI * 2) / orbCount;
    const orbX = width / 2 + Math.cos(angle) * width * 0.35;
    const orbY = height / 2 + Math.sin(angle * 1.3) * height * 0.3;
    const orbGradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 200);
    orbGradient.addColorStop(0, hexToRgba(gradientColors.primary, 0.2));
    orbGradient.addColorStop(0.5, hexToRgba(gradientColors.secondary, 0.08));
    orbGradient.addColorStop(1, "transparent");
    ctx.fillStyle = orbGradient;
    ctx.fillRect(0, 0, width, height);
  }

  // Subtle grid overlay
  ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  progress: number,
  time: number,
  enableGlow: boolean = true
) {
  // Pulse animation - calmer for waves and triangles (angry)
  const isCalm = shape.shapeType === "wave";
  const isAngry = shape.shapeType === "triangle";
  const pulseTimeMultiplier = isCalm ? 0.0005 : isAngry ? 0.0008 : 0.002;
  const pulseAmount = isCalm ? 0.03 : isAngry ? 0.04 : 0.08;
  const pulseScale = 1 + Math.sin(time * pulseTimeMultiplier * shape.pulseSpeed + shape.pulsePhase) * pulseAmount;
  const animatedSize = shape.size * pulseScale;
  
  // Position animation (subtle drift) - calmer for waves and triangles
  const driftSpeed = isCalm ? 0.0003 : isAngry ? 0.0004 : 0.001;
  const driftAmount = isCalm ? 1.5 : isAngry ? 2 : 3;
  const animX = shape.x + Math.sin(time * driftSpeed + shape.pulsePhase) * driftAmount;
  const animY = shape.y + Math.cos(time * driftSpeed * 1.2 + shape.pulsePhase) * driftAmount;

  const alpha = shape.opacity * progress;
  const { shapeType, color } = shape;

  ctx.save();
  ctx.translate(animX, animY);

  // Glow effect for shapes - stronger for foreground
  if (enableGlow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = shape.layer === "foreground" ? 35 : shape.layer === "midground" ? 15 : 8;
  }

  switch (shapeType) {
    case "circle": {
      // Outer glow rings - multiple layers for intensity
      if (enableGlow) {
        ctx.fillStyle = hexToRgba(color, alpha * 0.08);
        ctx.beginPath();
        ctx.arc(0, 0, animatedSize / 2 + 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = hexToRgba(color, alpha * 0.15);
        ctx.beginPath();
        ctx.arc(0, 0, animatedSize / 2 + 18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = hexToRgba(color, alpha * 0.25);
        ctx.beginPath();
        ctx.arc(0, 0, animatedSize / 2 + 8, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Main circle with gradient fill for depth
      const mainGrad = ctx.createRadialGradient(
        -animatedSize * 0.1, -animatedSize * 0.1, 0,
        0, 0, animatedSize / 2
      );
      mainGrad.addColorStop(0, hexToRgba("#ffffff", alpha * 0.5));
      mainGrad.addColorStop(0.3, hexToRgba(color, alpha));
      mainGrad.addColorStop(1, hexToRgba(color, alpha * 0.8));
      ctx.fillStyle = mainGrad;
      ctx.beginPath();
      ctx.arc(0, 0, animatedSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Bright center highlight
      const highlight = ctx.createRadialGradient(
        -animatedSize * 0.12, -animatedSize * 0.12, 0,
        0, 0, animatedSize / 3
      );
      highlight.addColorStop(0, hexToRgba("#ffffff", alpha * 0.7));
      highlight.addColorStop(0.4, hexToRgba("#ffffff", alpha * 0.2));
      highlight.addColorStop(1, "transparent");
      ctx.fillStyle = highlight;
      ctx.beginPath();
      ctx.arc(0, 0, animatedSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Decorative outer ring
      ctx.strokeStyle = hexToRgba(color, alpha * 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, animatedSize / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "wave": {
      // NO rotation for calm waves - just gentle horizontal drift
      // Slow horizontal offset based on time for gentle side-to-side movement
      const horizontalDrift = Math.sin(time * 0.0003 + shape.pulsePhase) * 20;
      ctx.translate(horizontalDrift, 0);
      
      const amplitude = animatedSize * 0.3;
      const frequency = 0.035; // Fixed, gentle frequency
      const phaseShift = time * 0.0008; // Very slow phase shift for gentle undulation
      const length = animatedSize * 3;

      // Glow wave (wide, soft)
      if (enableGlow) {
        ctx.strokeStyle = hexToRgba(color, alpha * 0.12);
        ctx.lineWidth = 16;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-length / 2, 0);
        for (let x = -length / 2; x <= length / 2; x += 2) {
          ctx.lineTo(x, Math.sin(x * frequency + phaseShift) * amplitude);
        }
        ctx.stroke();
      }

      // Main wave - smooth and calm
      ctx.strokeStyle = hexToRgba(color, alpha);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-length / 2, 0);
      for (let x = -length / 2; x <= length / 2; x += 2) {
        ctx.lineTo(x, Math.sin(x * frequency + phaseShift) * amplitude);
      }
      ctx.stroke();

      // Soft white highlight on top
      ctx.strokeStyle = hexToRgba("#ffffff", alpha * 0.25);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-length / 2, 0);
      for (let x = -length / 2; x <= length / 2; x += 2) {
        ctx.lineTo(x, Math.sin(x * frequency + phaseShift) * amplitude - 1.5);
      }
      ctx.stroke();

      // Second wave layer - gentler, offset phase
      ctx.strokeStyle = hexToRgba(color, alpha * 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-length / 2, 0);
      for (let x = -length / 2; x <= length / 2; x += 2) {
        ctx.lineTo(x, Math.sin(x * frequency + phaseShift + Math.PI * 0.5) * amplitude * 0.5);
      }
      ctx.stroke();
      break;
    }
    case "arc": {
      // Glow arc
      if (enableGlow) {
        ctx.strokeStyle = hexToRgba(color, alpha * 0.15);
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 0, animatedSize / 2, Math.PI, 2 * Math.PI);
        ctx.stroke();
      }

      // Main arc - bright
      ctx.strokeStyle = hexToRgba(color, alpha);
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, animatedSize / 2, Math.PI, 2 * Math.PI);
      ctx.stroke();

      // White highlight arc
      ctx.strokeStyle = hexToRgba("#ffffff", alpha * 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -2, animatedSize / 2, Math.PI, 2 * Math.PI);
      ctx.stroke();

      // Second arc
      ctx.strokeStyle = hexToRgba(color, alpha * 0.6);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, animatedSize * 0.15, animatedSize / 2 * 0.7, Math.PI, 2 * Math.PI);
      ctx.stroke();

      // Third arc - smallest
      ctx.strokeStyle = hexToRgba(color, alpha * 0.35);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, animatedSize * 0.28, animatedSize / 2 * 0.5, Math.PI, 2 * Math.PI);
      ctx.stroke();
      break;
    }
    case "triangle": {
      // Minimal rotation for angry triangles - just a slow gentle sway, not spinning
      const gentleSway = Math.sin(time * 0.0003 + shape.pulsePhase) * 0.1; // Very subtle rotation
      ctx.rotate(shape.rotation + gentleSway);

      const h = animatedSize;
      const w = animatedSize * 0.8;

      // Multiple glow layers
      if (enableGlow) {
        ctx.fillStyle = hexToRgba(color, alpha * 0.08);
        const h3 = h * 1.5;
        const w3 = w * 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -h3 / 2);
        ctx.lineTo(w3 / 2, h3 / 2);
        ctx.lineTo(-w3 / 2, h3 / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = hexToRgba(color, alpha * 0.2);
        const h2 = h * 1.25;
        const w2 = w * 1.25;
        ctx.beginPath();
        ctx.moveTo(0, -h2 / 2);
        ctx.lineTo(w2 / 2, h2 / 2);
        ctx.lineTo(-w2 / 2, h2 / 2);
        ctx.closePath();
        ctx.fill();
      }

      // Triangle with gradient
      const triGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      triGrad.addColorStop(0, hexToRgba("#ffffff", alpha * 0.5));
      triGrad.addColorStop(0.3, hexToRgba(color, alpha));
      triGrad.addColorStop(1, hexToRgba(color, alpha * 0.7));
      ctx.fillStyle = triGrad;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.closePath();
      ctx.fill();

      // Bright edge highlights
      ctx.strokeStyle = hexToRgba("#ffffff", alpha * 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.stroke();

      ctx.strokeStyle = hexToRgba(color, alpha * 0.8);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.stroke();
      break;
    }
    case "dot": {
      if (shape.dots) {
        // Connecting lines between dots - brighter
        if (enableGlow && shape.dots.length > 1) {
          ctx.strokeStyle = hexToRgba(color, alpha * 0.35);
          ctx.lineWidth = 2;
          for (let i = 0; i < shape.dots.length - 1; i++) {
            ctx.beginPath();
            ctx.moveTo(shape.dots[i].dx, shape.dots[i].dy);
            ctx.lineTo(shape.dots[i + 1].dx, shape.dots[i + 1].dy);
            ctx.stroke();
          }
        }

        for (const dot of shape.dots) {
          const dotPulse = 1 + Math.sin(time * 0.003 + dot.dx * 0.1) * 0.25;
          const dotR = dot.r * dotPulse;

          // Glow around each dot
          if (enableGlow) {
            ctx.fillStyle = hexToRgba(color, alpha * 0.15);
            ctx.beginPath();
            ctx.arc(dot.dx, dot.dy, dotR + 6, 0, Math.PI * 2);
            ctx.fill();
          }

          // Main dot with gradient
          const dotGrad = ctx.createRadialGradient(
            dot.dx - dotR * 0.2, dot.dy - dotR * 0.2, 0,
            dot.dx, dot.dy, dotR
          );
          dotGrad.addColorStop(0, hexToRgba("#ffffff", alpha * 0.6));
          dotGrad.addColorStop(0.4, hexToRgba(color, alpha));
          dotGrad.addColorStop(1, hexToRgba(color, alpha * 0.7));
          ctx.fillStyle = dotGrad;
          ctx.beginPath();
          ctx.arc(dot.dx, dot.dy, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "star": {
      const animatedRotation = shape.rotation + time * shape.rotationSpeed * 2;
      ctx.rotate(animatedRotation);

      const outerR = animatedSize / 2;
      const innerR = outerR * 0.4;

      // Multiple glow layers for intense bloom effect
      if (enableGlow) {
        ctx.fillStyle = hexToRgba(color, alpha * 0.06);
        ctx.beginPath();
        ctx.arc(0, 0, outerR + 35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = hexToRgba(color, alpha * 0.12);
        ctx.beginPath();
        ctx.arc(0, 0, outerR + 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = hexToRgba(color, alpha * 0.2);
        ctx.beginPath();
        ctx.arc(0, 0, outerR + 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Star with gradient
      const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
      starGrad.addColorStop(0, hexToRgba("#ffffff", alpha));
      starGrad.addColorStop(0.3, hexToRgba(color, alpha));
      starGrad.addColorStop(1, hexToRgba(color, alpha * 0.7));
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / 6 - Math.PI / 2;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Intense center glow - white hot center
      const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, innerR * 1.5);
      centerGrad.addColorStop(0, hexToRgba("#ffffff", alpha));
      centerGrad.addColorStop(0.3, hexToRgba("#ffffff", alpha * 0.6));
      centerGrad.addColorStop(0.6, hexToRgba(color, alpha * 0.3));
      centerGrad.addColorStop(1, "transparent");
      ctx.fillStyle = centerGrad;
      ctx.beginPath();
      ctx.arc(0, 0, innerR * 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "dense": {
      if (shape.rects) {
        for (const rect of shape.rects) {
          const rectPulse = 1 + Math.sin(time * 0.002 + rect.dx * 0.05) * 0.1;
          ctx.fillStyle = hexToRgba(color, rect.opacity * progress);
          ctx.fillRect(
            (rect.dx - rect.w / 2) * rectPulse,
            (rect.dy - rect.h / 2) * rectPulse,
            rect.w * rectPulse,
            rect.h * rectPulse
          );
        }
      }
      break;
    }
  }

  ctx.restore();
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  width: number,
  height: number
) {
  for (const p of particles) {
    // Update position
    p.x += p.vx;
    p.y += p.vy;
    p.life++;

    // Wrap around edges
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;

    // Reset if life exceeded
    if (p.life > p.maxLife) {
      p.life = 0;
      p.x = Math.random() * width;
      p.y = Math.random() * height;
    }

    // Fade based on life
    const lifeFade = 1 - Math.abs(p.life - p.maxLife / 2) / (p.maxLife / 2);
    const alpha = p.opacity * lifeFade;

    ctx.fillStyle = hexToRgba(p.color, alpha);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const ArtCanvas = forwardRef<
  { regenerate: () => void; download: () => void },
  ArtCanvasProps
>(function ArtCanvas({ emotion, isGenerated, generationKey, artParams }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const continuousAnimRef = useRef<number>(0);
  const [timestamp, setTimestamp] = useState("");
  const startTimeRef = useRef<number>(0);

  const emotionData = EMOTIONS.find((e) => e.key === emotion)!;
  const secondaryEmotion = artParams?.secondary ? 
    (Object.keys(EMOTION_GRADIENT) as EmotionKey[]).find(k => 
      EMOTION_GRADIENT[k].primary === artParams.secondary?.color
    ) : undefined;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Continuous animation loop for living artwork
  useEffect(() => {
    if (!isGenerated || shapes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const animateLoop = (currentTime: number) => {
      if (!startTimeRef.current) startTimeRef.current = currentTime;
      const time = currentTime - startTimeRef.current;

      // Draw gradient background
      drawGradientBackground(ctx, dimensions.width * dpr, dimensions.height * dpr, emotion, time, secondaryEmotion);

      ctx.save();
      ctx.scale(dpr, dpr);

      // Draw particles
      drawParticles(ctx, particles, dimensions.width, dimensions.height);

      // Draw shapes with animation
      shapes.forEach((shape) => {
        drawShape(ctx, shape, 1, time, true);
      });

      // Timestamp
      ctx.font = "11px var(--font-dm-mono), monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.fillText(
        `${emotion} · ${timestamp}`,
        16,
        dimensions.height - 16
      );

      ctx.restore();

      continuousAnimRef.current = requestAnimationFrame(animateLoop);
    };

    continuousAnimRef.current = requestAnimationFrame(animateLoop);

    return () => {
      cancelAnimationFrame(continuousAnimRef.current);
    };
  }, [isGenerated, shapes, particles, dimensions, emotion, timestamp, secondaryEmotion]);

  const generateArt = useCallback(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const newShapes = generateShapes(emotion, dimensions.width, dimensions.height, artParams);
    const newParticles = generateParticles(emotionData.color, dimensions.width, dimensions.height, 50);
    
    setShapes(newShapes);
    setParticles(newParticles);
    setTimestamp(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    startTimeRef.current = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const startTime = performance.now();
    const duration = 800;

    // Stop continuous animation during intro
    cancelAnimationFrame(continuousAnimRef.current);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      drawGradientBackground(ctx, dimensions.width * dpr, dimensions.height * dpr, emotion, elapsed, secondaryEmotion);

      ctx.save();
      ctx.scale(dpr, dpr);

      // Fade in particles
      if (progress > 0.3) {
        const particleProgress = (progress - 0.3) / 0.7;
        ctx.globalAlpha = particleProgress;
        drawParticles(ctx, newParticles, dimensions.width, dimensions.height);
        ctx.globalAlpha = 1;
      }

      newShapes.forEach((shape, index) => {
        const shapeDelay = (index / newShapes.length) * 0.4;
        const shapeProgress = Math.max(0, Math.min(1, (easedProgress - shapeDelay) / 0.6));
        if (shapeProgress > 0) {
          drawShape(ctx, shape, shapeProgress, elapsed, shapeProgress > 0.5);
        }
      });

      ctx.font = "11px var(--font-dm-mono), monospace";
      ctx.fillStyle = `rgba(255, 255, 255, ${0.25 * easedProgress})`;
      ctx.fillText(
        `${emotion} · ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
        16,
        dimensions.height - 16
      );

      ctx.restore();

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  }, [dimensions, emotion, artParams, emotionData.color, secondaryEmotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Draw initial gradient background
    drawGradientBackground(ctx, dimensions.width * dpr, dimensions.height * dpr, emotion, 0);
  }, [dimensions, emotion]);

  useEffect(() => {
    if (isGenerated && generationKey > 0) generateArt();
  }, [generationKey, isGenerated, generateArt]);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    link.download = `emotiart-${emotion}-${ts}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [emotion]);

  useImperativeHandle(ref, () => ({ regenerate: generateArt, download }));

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={generateArt}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-[rgba(255,255,255,0.08)] transition-colors"
          title="Regenerate"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        </button>
        <button
          onClick={download}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-[rgba(255,255,255,0.08)] transition-colors"
          title="Download"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>
    </div>
  );
});
