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
  artParams?: ArtParams; // rich params from Flask pipeline — optional
}

// Shape type strings coming from the backend / emotion map
const EMOTION_SHAPE: Record<EmotionKey, string> = {
  happy:       "circle",
  calm:        "wave",
  sad:         "arc",
  angry:       "triangle",
  anxious:     "dot",
  excited:     "star",
  overwhelmed: "dense",
};

interface Shape {
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  shapeType: string;
  color: string;
  // anxious dots cluster
  dots?: { dx: number; dy: number; r: number }[];
  // overwhelmed / dense rect cluster
  rects?: { dx: number; dy: number; w: number; h: number; opacity: number }[];
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * (sizeMax - sizeMin) + sizeMin;
    const opacity = Math.random() * (opacityMax - opacityMin) + opacityMin;
    const rotation = (Math.random() - 0.5) * 0.8;

    if (shapeType === "dot") {
      const dotCount = Math.floor(Math.random() * 5) + 3;
      const dots = Array.from({ length: dotCount }, () => ({
        dx: (Math.random() - 0.5) * size,
        dy: (Math.random() - 0.5) * size,
        r: Math.random() * 6 + 2,
      }));
      shapes.push({ x, y, size, opacity, rotation, shapeType, color, dots });
    } else if (shapeType === "dense") {
      const rectCount = Math.floor(Math.random() * 3) + 2;
      const rects = Array.from({ length: rectCount }, () => ({
        dx: (Math.random() - 0.5) * size * 0.5,
        dy: (Math.random() - 0.5) * size * 0.5,
        w: Math.random() * size * 0.6 + size * 0.3,
        h: Math.random() * size * 0.6 + size * 0.3,
        opacity: Math.random() * 0.3 + 0.2,
      }));
      shapes.push({ x, y, size, opacity, rotation, shapeType, color, rects });
    } else {
      shapes.push({ x, y, size, opacity, rotation, shapeType, color });
    }
  }

  return shapes;
}

function generateShapes(
  emotion: EmotionKey,
  width: number,
  height: number,
  artParams?: ArtParams
): Shape[] {
  const emotionData = EMOTIONS.find((e) => e.key === emotion)!;

  if (artParams) {
    const primaryCount = artParams.secondaryRatio > 0 && artParams.secondary
      ? Math.round(artParams.shapeCount * (1 - artParams.secondaryRatio))
      : artParams.shapeCount;

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

    if (artParams.secondary && artParams.secondaryRatio > 0) {
      const secondaryCount = artParams.shapeCount - primaryCount;
      const secondary = buildShapes(
        {
          shapeType: artParams.secondary.shape,
          color: artParams.secondary.color,
          count: secondaryCount,
          sizeMin: artParams.sizeMin,
          sizeMax: artParams.sizeMax,
          opacityMin: artParams.opacityMin * 0.7,
          opacityMax: artParams.opacityMax * 0.7,
        },
        width,
        height
      );
      // Interleave so secondary shapes are spread across the canvas
      return [...primary, ...secondary].sort(() => Math.random() - 0.5);
    }

    return primary;
  }

  // Fallback defaults (text analysis / no artParams)
  return buildShapes(
    {
      shapeType: EMOTION_SHAPE[emotion],
      color: emotionData.color,
      count: Math.floor(Math.random() * 11) + 18,
      sizeMin: 20,
      sizeMax: 80,
      opacityMin: 0.2,
      opacityMax: 0.7,
    },
    width,
    height
  );
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  progress: number
) {
  const alpha = shape.opacity * progress;
  const { shapeType, color } = shape;

  ctx.save();
  ctx.translate(shape.x, shape.y);

  switch (shapeType) {
    case "circle": {
      ctx.fillStyle = hexToRgba(color, alpha);
      ctx.beginPath();
      ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
      ctx.fill();
      if (Math.random() > 0.6) {
        ctx.strokeStyle = hexToRgba(color, alpha * 0.3);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, shape.size / 2 + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case "wave": {
      ctx.strokeStyle = hexToRgba(color, alpha);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      const amplitude = shape.size * 0.3;
      const frequency = 0.05 + Math.random() * 0.03;
      const length = shape.size * 2;
      ctx.moveTo(-length / 2, 0);
      for (let x = -length / 2; x <= length / 2; x += 2) {
        ctx.lineTo(x, Math.sin(x * frequency) * amplitude);
      }
      ctx.stroke();
      break;
    }
    case "arc": {
      ctx.strokeStyle = hexToRgba(color, alpha);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, shape.size / 2, Math.PI, 2 * Math.PI);
      ctx.stroke();
      break;
    }
    case "triangle": {
      ctx.rotate(shape.rotation);
      ctx.fillStyle = hexToRgba(color, alpha);
      ctx.beginPath();
      const h = shape.size;
      const w = shape.size * 0.8;
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "dot": {
      if (shape.dots) {
        ctx.fillStyle = hexToRgba(color, alpha);
        for (const dot of shape.dots) {
          ctx.beginPath();
          ctx.arc(dot.dx, dot.dy, dot.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "star": {
      ctx.rotate(shape.rotation);
      ctx.fillStyle = hexToRgba(color, alpha);
      ctx.beginPath();
      const outerR = shape.size / 2;
      const innerR = outerR * 0.4;
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
      break;
    }
    case "dense": {
      if (shape.rects) {
        for (const rect of shape.rects) {
          ctx.fillStyle = hexToRgba(color, rect.opacity * progress);
          ctx.fillRect(rect.dx - rect.w / 2, rect.dy - rect.h / 2, rect.w, rect.h);
        }
      }
      break;
    }
  }

  ctx.restore();
}

export const ArtCanvas = forwardRef<
  { regenerate: () => void; download: () => void },
  ArtCanvasProps
>(function ArtCanvas({ emotion, isGenerated, generationKey, artParams }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [shapes, setShapes] = useState<Shape[]>([]);
  const animationRef = useRef<number>(0);
  const [timestamp, setTimestamp] = useState("");

  const emotionData = EMOTIONS.find((e) => e.key === emotion)!;

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

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = "#0d0d0f";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  }, []);

  const generateArt = useCallback(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const newShapes = generateShapes(emotion, dimensions.width, dimensions.height, artParams);
    setShapes(newShapes);
    setTimestamp(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const startTime = performance.now();
    const duration = 600;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      drawGrid(ctx, dimensions.width * dpr, dimensions.height * dpr);

      ctx.save();
      ctx.scale(dpr, dpr);

      newShapes.forEach((shape, index) => {
        const shapeDelay = (index / newShapes.length) * 0.5;
        const shapeProgress = Math.max(0, Math.min(1, (progress - shapeDelay) / 0.5));
        if (shapeProgress > 0) drawShape(ctx, shape, shapeProgress);
      });

      ctx.font = "11px var(--font-dm-mono), monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      ctx.fillText(
        `${emotion} · ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
        16,
        dimensions.height - 16
      );

      ctx.restore();

      if (progress < 1) animationRef.current = requestAnimationFrame(animate);
    };

    cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  }, [dimensions, emotion, artParams, drawGrid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGrid(ctx, dimensions.width * dpr, dimensions.height * dpr);
    if (isGenerated && shapes.length > 0) {
      ctx.save();
      ctx.scale(dpr, dpr);
      shapes.forEach((shape) => drawShape(ctx, shape, 1));
      ctx.font = "11px var(--font-dm-mono), monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      ctx.fillText(`${emotion} · ${timestamp}`, 16, dimensions.height - 16);
      ctx.restore();
    }
  }, [dimensions, isGenerated, shapes, emotion, emotionData.color, timestamp, drawGrid]);

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
