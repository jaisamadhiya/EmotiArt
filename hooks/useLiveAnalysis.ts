"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { EmotionKey, ArtParams } from "@/lib/emotiart-types";
import { analyzeVoiceEmotion } from "@/lib/voice-emotion";
import { synthesize } from "@/lib/emotion-synthesizer";
import { buildArtParams } from "@/lib/art-params";

export type AnalysisResult = {
  emotion: EmotionKey;
  intensity: number;
  conflict: boolean;
  conflict_blend: number;
  art: ArtParams;
};

export type LiveStatus = "idle" | "loading" | "active" | "error";

// face-api expression keys → EmotionKey
type FaceExpression = {
  happy: number; sad: number; angry: number;
  fearful: number; surprised: number; disgusted: number; neutral: number;
};

const FACE_MAP: Record<keyof FaceExpression, EmotionKey> = {
  happy:     "happy",
  neutral:   "calm",
  sad:       "sad",
  angry:     "angry",
  fearful:   "anxious",
  surprised: "excited",
  disgusted: "overwhelmed",
};

function dominantFaceEmotion(expressions: FaceExpression): { emotion: EmotionKey; confidence: number } {
  let best = "neutral" as keyof FaceExpression;
  let bestVal = 0;
  for (const [k, v] of Object.entries(expressions) as [keyof FaceExpression, number][]) {
    if (v > bestVal) { bestVal = v; best = k; }
  }
  return { emotion: FACE_MAP[best], confidence: bestVal };
}

export function useLiveAnalysis(onResult: (result: AnalysisResult) => void) {
  const videoRef   = useRef<HTMLVideoElement | null>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const animFrameRef   = useRef<number | null>(null);
  const transcriptRef  = useRef<string>("");
  const onResultRef    = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  const [transcript, setTranscript] = useState("");
  const [status, setStatus]         = useState<LiveStatus>("idle");
  const [error, setError]           = useState<string | null>(null);

  const stopAnalysis = useCallback(() => {
    if (animFrameRef.current)   { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (streamRef.current)      { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current)       videoRef.current.srcObject = null;
    transcriptRef.current = "";
    setTranscript("");
    setStatus("idle");
    setError(null);
  }, []);

  const startAnalysis = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      // ── Load face-api models ──────────────────────────────
      const faceapi = await import("@vladmandic/face-api");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);

      // ── Camera ────────────────────────────────────────────
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (!videoRef.current) throw new Error("Video element not ready");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // ── Web Speech API ────────────────────────────────────
      const SpeechRecognitionAPI =
        (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
        (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous     = true;
        recognition.interimResults = true;
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const text = Array.from(event.results).map(r => r[0].transcript).join(" ");
          transcriptRef.current = text;
          setTranscript(text);
        };
        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      }

      setStatus("active");

      // ── Detection loop ────────────────────────────────────
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
            const face  = dominantFaceEmotion(result.expressions as unknown as FaceExpression);
            const voice = analyzeVoiceEmotion(transcriptRef.current);
            const synthesis = synthesize(face, voice);
            const art = buildArtParams(synthesis);

            onResultRef.current({
              emotion:       synthesis.emotion,
              intensity:     synthesis.intensity,
              conflict:      synthesis.conflict,
              conflict_blend: synthesis.conflictBlend,
              art,
            });
          }
        }

        animFrameRef.current = requestAnimationFrame(detect);
      };

      animFrameRef.current = requestAnimationFrame(detect);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start";
      setError(msg);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current)   cancelAnimationFrame(animFrameRef.current);
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
      if (streamRef.current)      streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { videoRef, transcript, status, error, startAnalysis, stopAnalysis };
}
