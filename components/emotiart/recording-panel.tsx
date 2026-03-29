"use client";

import { useRecordingSession, type RecordingResult } from "@/hooks/useRecordingSession";
import { useEffect, useRef } from "react";

interface RecordingPanelProps {
  onResult?: (result: RecordingResult) => void;
}

export function RecordingPanel({ onResult }: RecordingPanelProps) {
  const {
    videoRef,
    transcript,
    status,
    error,
    recordedFrameCount,
    startRecording,
    finishRecording,
    reset,
  } = useRecordingSession(onResult);

  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Auto-play video when it's set
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoRef]);

  const isRecording = status === "recording";
  const isProcessing = status === "processing";
  const isDone = status === "done";

  return (
    <div className="w-full rounded-lg bg-[#1a1a1d] border border-[#333] p-4 flex flex-col gap-3">
      {/* Title */}
      <div className="text-sm font-semibold text-white">Record Session</div>

      {/* Video Preview */}
      <div
        ref={videoContainerRef}
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-[#333]"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isRecording && status !== "processing" && status !== "done" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-xs text-gray-400 text-center px-4">
              {status === "loading" ? "Loading models..." : "Ready to record"}
            </div>
          </div>
        )}
        {isRecording && (
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded px-3 py-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-red-400">RECORDING</span>
          </div>
        )}
      </div>

      {/* Transcript Display */}
      <div className="bg-black/40 rounded p-3 min-h-[60px] border border-[#333]">
        <div className="text-xs text-gray-500 mb-1">Transcript</div>
        <div className="text-xs text-gray-300 leading-relaxed">
          {transcript || <span className="text-gray-600 italic">No speech detected yet...</span>}
        </div>
      </div>

      {/* Emotion Frames Counter */}
      {isRecording && (
        <div className="text-xs text-gray-400 text-center">
          Captured {recordedFrameCount} emotion frames...
        </div>
      )}

      {/* Error Display */}
      {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded p-2">{error}</div>}

      {/* Processing Status */}
      {isProcessing && (
        <div className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded p-2 animate-pulse">
          Processing emotions...
        </div>
      )}

      {/* Done Status */}
      {isDone && (
        <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/30 rounded p-2">
          ✓ Recording processed successfully
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {status === "idle" && (
          <button
            onClick={startRecording}
            className="flex-1 h-10 bg-red-500/80 hover:bg-red-500 text-white font-semibold text-sm rounded-lg transition-colors active:scale-[0.98]"
          >
            Start Recording
          </button>
        )}

        {isRecording && (
          <>
            <button
              onClick={finishRecording}
              className="flex-1 h-10 bg-green-500/80 hover:bg-green-500 text-white font-semibold text-sm rounded-lg transition-colors active:scale-[0.98]"
            >
              Stop & Finish
            </button>
            <button
              onClick={reset}
              className="px-4 h-10 bg-gray-600/50 hover:bg-gray-600 text-white font-semibold text-sm rounded-lg transition-colors active:scale-[0.98]"
            >
              Cancel
            </button>
          </>
        )}

        {status === "loading" && (
          <button
            disabled
            className="flex-1 h-10 bg-gray-600/30 text-gray-500 font-semibold text-sm rounded-lg cursor-not-allowed"
          >
            Loading...
          </button>
        )}

        {status === "processing" && (
          <button
            disabled
            className="flex-1 h-10 bg-gray-600/30 text-gray-500 font-semibold text-sm rounded-lg cursor-not-allowed animate-pulse"
          >
            Processing...
          </button>
        )}

        {isDone && (
          <button
            onClick={reset}
            className="flex-1 h-10 bg-gray-600/50 hover:bg-gray-600 text-white font-semibold text-sm rounded-lg transition-colors active:scale-[0.98]"
          >
            New Recording
          </button>
        )}
      </div>
    </div>
  );
}
