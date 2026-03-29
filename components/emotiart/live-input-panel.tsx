"use client";

import { useEffect, useRef } from "react";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import type { EmotionKey } from "@/lib/emotiart-types";

interface LiveInputPanelProps {
  onEmotionChange: (emotion: EmotionKey, confidence: number) => void;
  isActive: boolean;
  onActiveChange: (active: boolean) => void;
  autoStart?: boolean;
}

export function LiveInputPanel({ onEmotionChange, isActive, onActiveChange, autoStart = false }: LiveInputPanelProps) {
  const { videoRef, detectionState, startDetection, stopDetection } = useFaceDetection(onEmotionChange);
  const hasAutoStarted = useRef(false);

  // Auto-start camera when component mounts if autoStart is true
  useEffect(() => {
    if (autoStart && !hasAutoStarted.current && detectionState.status === "idle") {
      hasAutoStarted.current = true;
      onActiveChange(true);
      startDetection();
    }
  }, [autoStart, detectionState.status, onActiveChange, startDetection]);

  const handleStart = async () => {
    onActiveChange(true);
    await startDetection();
  };

  const handleStop = () => {
    stopDetection();
    onActiveChange(false);
  };

  const isLoading = detectionState.status === "loading";
  const isRunning = detectionState.status === "active";

  return (
    <div className="bg-[#16161a] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 flex flex-col gap-4">
      {/* Camera Preview Area */}
      <div className="aspect-video bg-[#0a0a0c] rounded-lg border border-[rgba(255,255,255,0.07)] relative overflow-hidden">
        {/* Video element — always mounted so ref is stable */}
        <video
          ref={videoRef}
          muted
          playsInline
          className={`w-full h-full object-cover scale-x-[-1] ${isRunning ? "block" : "hidden"}`}
        />

        {/* Idle state */}
        {!isRunning && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-[rgba(255,255,255,0.15)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                <path d="M15 10l4.553-2.069A1 1 0 0121 8.876V15.124a1 1 0 01-1.447.895L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
              </svg>
            </div>
            <span className="font-mono text-xs text-[#6b6b7a]">Camera off</span>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-[rgba(255,255,255,0.1)] border-t-[#06AED4] rounded-full animate-spin" />
            <span className="font-mono text-xs text-[#6b6b7a]">Loading models...</span>
          </div>
        )}

        {/* Emotion overlay — shown when running */}
        {isRunning && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-mono text-[11px] text-white/80">LIVE</span>
            </div>
            <button
              onClick={handleStop}
              className="bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 font-mono text-[11px] text-white/50 hover:text-white/80 transition-colors"
            >
              stop
            </button>
          </div>
        )}

        {/* Error state */}
        {detectionState.status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <span className="font-mono text-xs text-red-400 text-center">{detectionState.error}</span>
          </div>
        )}
      </div>

      {/* Start button — only show when not running and not loading */}
      {!isRunning && !isLoading && (
        <button
          onClick={handleStart}
          disabled={detectionState.status === "error"}
          className="w-full h-9 bg-[#06AED4]/10 border border-[#06AED4]/30 text-[#06AED4] font-mono text-xs rounded-lg hover:bg-[#06AED4]/20 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {detectionState.status === "error" ? "Camera unavailable" : "Start camera"}
        </button>
      )}
    </div>
  );
}
