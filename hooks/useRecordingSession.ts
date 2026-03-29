"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { EmotionKey, ArtParams } from "@/lib/emotiart-types";
import { analyzeVoiceEmotion } from "@/lib/voice-emotion";
import { buildArtParams } from "@/lib/art-params";
import { synthesize } from "@/lib/emotion-synthesizer";

export type RecordingStatus = "idle" | "loading" | "recording" | "processing" | "done" | "error";

export type EmotionFrame = {
  timestamp: number;
  emotion: EmotionKey;
  confidence: number;
};

export type RecordingResult = {
  transcript: string;
  emotionFrames: EmotionFrame[];
  primaryEmotion: EmotionKey;
  intensity: number;
  art: ArtParams;
};

type FaceExpression = {
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  surprised: number;
  disgusted: number;
  neutral: number;
};

const FACE_MAP: Record<keyof FaceExpression, EmotionKey> = {
  happy: "happy",
  neutral: "calm",
  sad: "sad",
  angry: "angry",
  fearful: "anxious",
  surprised: "excited",
  disgusted: "overwhelmed",
};

function dominantFaceEmotion(expressions: FaceExpression): { emotion: EmotionKey; confidence: number } {
  let best = "neutral" as keyof FaceExpression;
  let bestVal = 0;
  for (const [k, v] of Object.entries(expressions) as [keyof FaceExpression, number][]) {
    if (v > bestVal) {
      bestVal = v;
      best = k;
    }
  }
  return { emotion: FACE_MAP[best], confidence: bestVal };
}

// Aggregate emotion frames into a single dominant emotion
function aggregateEmotions(frames: EmotionFrame[]): { emotion: EmotionKey; intensity: number } {
  if (frames.length === 0) return { emotion: "calm", intensity: 0 };

  const scores: Record<EmotionKey, number> = {
    happy: 0,
    calm: 0,
    sad: 0,
    angry: 0,
    anxious: 0,
    excited: 0,
    overwhelmed: 0,
  };

  for (const frame of frames) {
    scores[frame.emotion] += frame.confidence;
  }

  let topEmotion: EmotionKey = "calm";
  let topScore = 0;
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > topScore) {
      topScore = score;
      topEmotion = emotion as EmotionKey;
    }
  }

  // Intensity: average confidence across all frames
  const avgConfidence = frames.reduce((sum, f) => sum + f.confidence, 0) / frames.length;
  const intensity = Math.min(1, avgConfidence);

  return { emotion: topEmotion, intensity };
}

export function useRecordingSession(onResult?: (result: RecordingResult) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const transcriptRef = useRef<string>("");
  const emotionFramesRef = useRef<EmotionFrame[]>([]);
  const recordingStartRef = useRef<number>(0);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [recordedFrameCount, setRecordedFrameCount] = useState(0);

  const stopRecording = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }, []);

  const startRecording = useCallback(async () => {
    setStatus("loading");
    setError(null);
    transcriptRef.current = "";
    emotionFramesRef.current = [];
    setTranscript("");
    setRecordedFrameCount(0);

    try {
      // Load face-api models
      const faceapi = await import("@vladmandic/face-api");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (!videoRef.current) throw new Error("Video element not ready");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Web Speech API
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

      recordingStartRef.current = Date.now();
      setStatus("recording");

      // Detection loop: capture emotions at intervals
      const INTERVAL_MS = 150;
      let lastRun = 0;
      let frameCount = 0;

      const detect = async (timestamp: number) => {
        if (!videoRef.current || !streamRef.current) return;

        if (timestamp - lastRun >= INTERVAL_MS) {
          lastRun = timestamp;

          const result = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();

          if (result?.expressions) {
            const face = dominantFaceEmotion(result.expressions as unknown as FaceExpression);
            const voice = analyzeVoiceEmotion(transcriptRef.current);

            // For recording, we blend face and voice at each frame
            const blendedEmotion = face.confidence > voice.confidence ? face.emotion : voice.emotion;
            const blendedConfidence = Math.max(face.confidence, voice.confidence);

            emotionFramesRef.current.push({
              timestamp: Date.now() - recordingStartRef.current,
              emotion: blendedEmotion,
              confidence: blendedConfidence,
            });

            frameCount++;
            setRecordedFrameCount(frameCount);
          }
        }

        animFrameRef.current = requestAnimationFrame(detect);
      };

      animFrameRef.current = requestAnimationFrame(detect);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start recording";
      setError(msg);
      setStatus("error");
    }
  }, []);

  const finishRecording = useCallback(async () => {
    setStatus("processing");
    stopRecording();

    try {
      // Aggregate collected face emotions
      const { emotion: faceEmotion, intensity: faceIntensity } = aggregateEmotions(emotionFramesRef.current);

      // Analyze voice from full transcript
      const voiceAnalysis = analyzeVoiceEmotion(transcriptRef.current);

      // Synthesize face and voice emotions (including voice secondary if available)
      const synthesis = synthesize(
        { emotion: faceEmotion, confidence: faceIntensity },
        {
          emotion: voiceAnalysis.emotion,
          confidence: voiceAnalysis.confidence,
          energy: voiceAnalysis.energy,
          secondaryEmotion: voiceAnalysis.secondaryEmotion,
          secondaryConfidence: voiceAnalysis.secondaryConfidence,
        }
      );

      // Build art params with synthesized result
      const art = buildArtParams(synthesis);

      const result: RecordingResult = {
        transcript: transcriptRef.current,
        emotionFrames: emotionFramesRef.current,
        primaryEmotion: synthesis.emotion,
        intensity: synthesis.intensity,
        art,
      };

      onResultRef.current?.(result);
      setStatus("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to process recording";
      setError(msg);
      setStatus("error");
    }
  }, [stopRecording]);

  const reset = useCallback(() => {
    stopRecording();
    transcriptRef.current = "";
    emotionFramesRef.current = [];
    setTranscript("");
    setRecordedFrameCount(0);
    setError(null);
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (recognitionRef.current)
        try {
          recognitionRef.current.stop();
        } catch {}
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    videoRef,
    transcript,
    status,
    error,
    recordedFrameCount,
    startRecording,
    finishRecording,
    reset,
  };
}
