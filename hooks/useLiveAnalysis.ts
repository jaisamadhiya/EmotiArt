"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { EmotionKey } from "@/lib/emotiart-types";
import type { ArtParams } from "@/lib/emotiart-types";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const ANALYSIS_INTERVAL_MS = 2500;

export type AnalysisResult = {
  emotion: EmotionKey;
  intensity: number;
  conflict: boolean;
  conflict_blend: number;
  art: ArtParams;
};

export type LiveStatus = "idle" | "loading" | "active" | "error";

export function useLiveAnalysis(onResult: (result: AnalysisResult) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<string>("");

  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<LiveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  // Stable ref so the interval closure always calls the latest onResult
  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  const runAnalysis = useCallback(async () => {
    const frame = captureFrame();
    if (!frame) return;
    try {
      const res = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame, transcript: transcriptRef.current }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data: AnalysisResult = await res.json();
      onResultRef.current(data);
    } catch {
      // silently skip failed frames — don't interrupt the loop
    }
  }, [captureFrame]);

  const startAnalysis = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      if (!videoRef.current) throw new Error("Video element not ready");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Web Speech API — graceful fallback if unsupported
      const SpeechRecognitionAPI =
        (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
        (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const text = Array.from(event.results)
            .map((r) => r[0].transcript)
            .join(" ");
          transcriptRef.current = text;
          setTranscript(text);
        };
        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      }

      setStatus("active");
      intervalRef.current = setInterval(runAnalysis, ANALYSIS_INTERVAL_MS);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start";
      setError(msg);
      setStatus("error");
    }
  }, [runAnalysis]);

  const stopAnalysis = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    transcriptRef.current = "";
    setTranscript("");
    setStatus("idle");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, transcript, status, error, startAnalysis, stopAnalysis };
}
