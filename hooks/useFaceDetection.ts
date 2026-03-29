"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { EmotionKey } from "@/lib/emotiart-types";

type FaceApiExpression = {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
};

function mapToEmotionKey(expressions: FaceApiExpression): { emotion: EmotionKey; confidence: number } {
  const mapping: Record<keyof FaceApiExpression, EmotionKey> = {
    happy: "happy",
    neutral: "calm",
    sad: "sad",
    angry: "angry",
    fearful: "anxious",
    surprised: "excited",
    disgusted: "overwhelmed",
  };

  let maxKey = "neutral" as keyof FaceApiExpression;
  let maxVal = 0;
  for (const [k, v] of Object.entries(expressions) as [keyof FaceApiExpression, number][]) {
    if (v > maxVal) {
      maxVal = v;
      maxKey = k;
    }
  }

  return {
    emotion: mapping[maxKey],
    confidence: Math.round(maxVal * 100),
  };
}

export type FaceDetectionState = {
  status: "idle" | "loading" | "active" | "error";
  error: string | null;
};

export function useFaceDetection(
  onEmotionChange: (emotion: EmotionKey, confidence: number) => void
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [detectionState, setDetectionState] = useState<FaceDetectionState>({
    status: "idle",
    error: null,
  });

  const stopDetection = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setDetectionState({ status: "idle", error: null });
  }, []);

  const startDetection = useCallback(async () => {
    setDetectionState({ status: "loading", error: null });

    try {
      // Dynamically import face-api (browser only)
      const faceapi = await import("@vladmandic/face-api");

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        setDetectionState({ status: "error", error: "Video element not ready." });
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setDetectionState({ status: "active", error: null });

      const INTERVAL_MS = 150;
      let lastRun = 0;

      const detect = async (timestamp: number) => {
        if (!videoRef.current || !streamRef.current) return;

        if (timestamp - lastRun >= INTERVAL_MS) {
          lastRun = timestamp;
          const result = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();

          if (result?.expressions) {
            const { emotion, confidence } = mapToEmotionKey(result.expressions as unknown as FaceApiExpression);
            onEmotionChange(emotion, confidence);
          }
        }

        animFrameRef.current = requestAnimationFrame(detect);
      };

      animFrameRef.current = requestAnimationFrame(detect);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access failed.";
      setDetectionState({ status: "error", error: msg });
    }
  }, [onEmotionChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, detectionState, startDetection, stopDetection };
}
