"use client";

import { useEffect, useRef } from "react";
import { useLiveAnalysis } from "@/hooks/useLiveAnalysis";
import type { AnalysisResult } from "@/hooks/useLiveAnalysis";

interface LiveInputPanelProps {
  onResult: (result: AnalysisResult) => void;
  onActiveChange: (active: boolean) => void;
  autoStart?: boolean;
}

export function LiveInputPanel({ onResult, onActiveChange, autoStart = false }: LiveInputPanelProps) {
  const { videoRef, transcript, status, error, startAnalysis, stopAnalysis } = useLiveAnalysis(onResult);
  const hasAutoStarted = useRef(false);

  // Auto-start camera immediately on mount if autoStart is true
  useEffect(() => {
    if (autoStart && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      onActiveChange(true);
      startAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = async () => {
    onActiveChange(true);
    await startAnalysis();
  };

  const handleStop = () => {
    stopAnalysis();
    onActiveChange(false);
  };

  const isLoading = status === "loading";
  const isRunning = status === "active";

  return (
    <div className="bg-[#16161a] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 flex flex-col gap-3">
      {/* Camera Preview */}
      <div className="aspect-video bg-[#0a0a0c] rounded-lg border border-[rgba(255,255,255,0.07)] relative overflow-hidden">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`w-full h-full object-cover scale-x-[-1] ${isRunning ? "block" : "hidden"}`}
        />

        {/* Idle */}
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

        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-[rgba(255,255,255,0.1)] border-t-[#06AED4] rounded-full animate-spin" />
            <span className="font-mono text-xs text-[#6b6b7a]">Starting...</span>
          </div>
        )}

        {/* Live overlay */}
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

        {/* Error */}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <span className="font-mono text-xs text-red-400 text-center">{error}</span>
          </div>
        )}
      </div>

      {/* Start button */}
      {!isRunning && !isLoading && (
        <button
          onClick={handleStart}
          disabled={status === "error"}
          className="w-full h-9 bg-[#06AED4]/10 border border-[#06AED4]/30 text-[#06AED4] font-mono text-xs rounded-lg hover:bg-[#06AED4]/20 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === "error" ? "Unavailable" : "Start camera"}
        </button>
      )}

      {/* Voice transcript */}
      {isRunning && (
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6b6b7a]">
            Voice transcript
          </label>
          <div className="w-full min-h-[48px] bg-[#0a0a0c] border border-[rgba(255,255,255,0.07)] rounded-lg p-3 font-mono text-xs text-[#e8e8ec] leading-relaxed">
            {transcript || <span className="text-[#6b6b7a]">Listening for speech...</span>}
          </div>
        </div>
      )}
    </div>
  );
}
