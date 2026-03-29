"use client";

import { useState, useRef, useCallback } from "react";
import { LiveInputPanel } from "@/components/emotiart/live-input-panel";
import { EmotionDetectionPanel } from "@/components/emotiart/emotion-detection-panel";
import { VisualGuidePanel } from "@/components/emotiart/visual-guide-panel";
import { ArtCanvas } from "@/components/emotiart/art-canvas";
import { Navbar } from "@/components/navbar";
import type { EmotionKey, ArtParams } from "@/lib/emotiart-types";
import type { AnalysisResult } from "@/hooks/useLiveAnalysis";

interface LiveState {
  activeEmotion: EmotionKey;
  confidence: number;
  isListening: boolean;
  isGenerated: boolean;
  generationKey: number;
  artParams?: ArtParams;
}

export default function LiveAnalysisPage() {
  const [state, setState] = useState<LiveState>({
    activeEmotion: "calm",
    confidence: 0,
    isListening: false,
    isGenerated: false,
    generationKey: 0,
  });

  const canvasRef = useRef<{ regenerate: () => void; download: () => void }>(null);

  const handleResult = useCallback((result: AnalysisResult) => {
    setState((prev) => ({
      ...prev,
      activeEmotion: result.emotion,
      confidence: Math.round(result.intensity * 100),
      isGenerated: true,
      generationKey: prev.generationKey + 1,
      artParams: result.art,
    }));
  }, []);

  const setListening = useCallback((active: boolean) => {
    setState((prev) => ({ ...prev, isListening: active }));
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0d0d0f]">
      <Navbar />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 lg:order-2 min-h-[50vh] lg:min-h-0">
          <ArtCanvas
            ref={canvasRef}
            emotion={state.activeEmotion}
            isGenerated={state.isGenerated}
            generationKey={state.generationKey}
            artParams={state.artParams}
          />
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-[320px] lg:order-1 flex-shrink-0 p-3 flex flex-col gap-3 overflow-y-auto">
          <LiveInputPanel
            onResult={handleResult}
            onActiveChange={setListening}
            autoStart={true}
          />
          <EmotionDetectionPanel
            activeEmotion={state.activeEmotion}
            confidence={state.confidence}
          />
          <VisualGuidePanel />
        </aside>
      </main>
    </div>
  );
}
