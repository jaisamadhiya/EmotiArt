import { Navbar } from "@/components/navbar";

const liveAnalysisSteps = [
  {
    step: "01",
    title: "Start Recording",
    description:
      "Grant camera and microphone access, then hit Start Recording. EmotiArt captures your facial expressions and speech in real time.",
    color: "#00E5FF",
  },
  {
    step: "02",
    title: "AI Emotion Detection",
    description:
      "While you record, face-api.js reads your facial expressions frame by frame and Whisper transcribes your speech. Both signals are combined to determine your dominant emotion.",
    color: "#FFE747",
  },
  {
    step: "03",
    title: "Stop & Process",
    description:
      "Hit Stop & Finish. EmotiArt aggregates the emotion frames from the whole session and picks the strongest result, along with a confidence score.",
    color: "#FF4081",
  },
  {
    step: "04",
    title: "Vibrant Art Generated",
    description:
      "The detected emotion drives a fully animated canvas — gradient backgrounds, glowing shapes, floating particles, and layered depth all shift to match your emotional state.",
    color: "#B388FF",
  },
];

const textAnalysisSteps = [
  {
    step: "01",
    title: "Paste Your Text",
    description:
      "Copy in any text — a journal entry, a message, an email — and paste it into the text input panel.",
    color: "#00E5FF",
  },
  {
    step: "02",
    title: "Keyword Analysis",
    description:
      "EmotiArt scans your text for emotion-specific keywords across all 7 emotion categories and scores which one dominates.",
    color: "#FFE747",
  },
  {
    step: "03",
    title: "Analyze & Generate",
    description:
      "Hit Analyze Text. The dominant emotion and a confidence percentage are shown instantly, and the art canvas updates to reflect it.",
    color: "#FF4081",
  },
  {
    step: "04",
    title: "Download Your Art",
    description:
      "Save your generated artwork as a PNG directly from the canvas to keep or share.",
    color: "#B388FF",
  },
];

const emotions = [
  { name: "Happy", color: "#FFE747", shape: "Circles", description: "Glowing, pulsing circles with bright highlights" },
  { name: "Calm", color: "#00E5FF", shape: "Waves", description: "Slow, horizontally drifting sine waves" },
  { name: "Sad", color: "#B388FF", shape: "Arcs", description: "Layered downward arcs with soft glow" },
  { name: "Angry", color: "#FF1744", shape: "Triangles", description: "Sharp triangles with a slow sway" },
  { name: "Anxious", color: "#FFAB40", shape: "Dots", description: "Scattered dot clusters connected by faint lines" },
  { name: "Excited", color: "#FF4081", shape: "Starbursts", description: "12-point stars with a white-hot center bloom" },
  { name: "Overwhelmed", color: "#40C4FF", shape: "Squares", description: "Layered overlapping rectangles" },
];

const artFeatures = [
  {
    title: "Animated Gradient Backgrounds",
    description: "Each emotion gets a unique color palette that fills the background with moving radial gradients and orbiting glow blobs.",
    color: "#FFE747",
  },
  {
    title: "40 – 120 Layered Shapes",
    description: "Shapes are spread across three depth layers — background, midground, foreground — for a rich, full-canvas look.",
    color: "#00E5FF",
  },
  {
    title: "Continuous Animation",
    description: "Everything on the canvas is always moving: shapes pulse, drift, sway, and rotate at speeds tuned to each emotion's character.",
    color: "#FF4081",
  },
  {
    title: "Glow & Bloom Effects",
    description: "Foreground shapes emit multi-layered glows and shadow blurs for an intense, luminous feel.",
    color: "#B388FF",
  },
  {
    title: "Floating Particles",
    description: "50 ambient particles drift across the canvas, fading in and out to fill the space with life.",
    color: "#FFAB40",
  },
  {
    title: "Emotion-Specific Motion",
    description: "Calm waves drift gently sideways. Angry triangles sway at moderate speed. Each emotion's shapes behave differently.",
    color: "#40C4FF",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d0f]">
      <Navbar />

      <main className="flex-1 overflow-y-auto">
        {/* Hero */}
        <section className="px-6 py-20 text-center max-w-4xl mx-auto">
          <h1 className="font-sans font-bold text-4xl md:text-5xl text-white mb-6 text-balance">
            How <span className="text-[#00E5FF]">EmotiArt</span> Works
          </h1>
          <p className="font-sans text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            EmotiArt detects your emotions through live camera and voice recording or written text, then turns that emotional data into a fully animated, generative art piece in real time.
          </p>
        </section>

        {/* Live Analysis */}
        <section className="px-6 py-16 max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="font-sans font-semibold text-2xl text-white mb-3">
              Live Analysis
            </h2>
            <p className="font-sans text-white/50 max-w-xl mx-auto">
              Record yourself speaking or expressing emotion — face-api.js and Whisper work together to detect what you&apos;re feeling.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveAnalysisSteps.map((step) => (
              <div
                key={step.step}
                className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] transition-colors"
              >
                <div className="font-mono text-sm font-medium mb-3" style={{ color: step.color }}>
                  {step.step}
                </div>
                <h3 className="font-sans font-semibold text-lg text-white mb-2">{step.title}</h3>
                <p className="font-sans text-sm text-white/50 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Text Analysis */}
        <section className="px-6 py-16 max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="font-sans font-semibold text-2xl text-white mb-3">
              Text Analysis
            </h2>
            <p className="font-sans text-white/50 max-w-xl mx-auto">
              Paste any text and EmotiArt scores it against 7 emotion keyword sets to find the dominant tone.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {textAnalysisSteps.map((step) => (
              <div
                key={step.step}
                className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] transition-colors"
              >
                <div className="font-mono text-sm font-medium mb-3" style={{ color: step.color }}>
                  {step.step}
                </div>
                <h3 className="font-sans font-semibold text-lg text-white mb-2">{step.title}</h3>
                <p className="font-sans text-sm text-white/50 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Art System */}
        <section className="px-6 py-16 max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="font-sans font-semibold text-2xl text-white mb-3">
              The Art Engine
            </h2>
            <p className="font-sans text-white/50 max-w-xl mx-auto">
              Every emotion drives a distinct visual system rendered on an HTML canvas with continuous animation.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {artFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] transition-colors"
              >
                <div className="w-2 h-2 rounded-full mb-4" style={{ backgroundColor: feature.color }} />
                <h3 className="font-sans font-semibold text-sm text-white mb-2">{feature.title}</h3>
                <p className="font-sans text-xs text-white/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Emotion Map */}
        <section className="px-6 py-16 max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="font-sans font-semibold text-2xl text-white mb-3">
              Emotion to Art Map
            </h2>
            <p className="font-sans text-white/50 max-w-xl mx-auto">
              Each of the 7 emotions maps to a unique color, shape type, and motion behavior.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            {emotions.map((emotion) => (
              <div
                key={emotion.name}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] flex flex-col items-center text-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: emotion.color,
                    boxShadow: `0 0 16px ${emotion.color}55`,
                  }}
                />
                <div>
                  <div className="font-sans font-semibold text-sm text-white mb-1">{emotion.name}</div>
                  <div className="font-mono text-xs text-white/40 mb-2">{emotion.shape}</div>
                  <div className="font-sans text-xs text-white/30 leading-snug">{emotion.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 text-center">
          <p className="font-sans text-white/40 text-sm mb-8">Ready to see it in action?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/text-analysis"
              className="inline-flex items-center justify-center h-12 px-8 bg-white text-black font-sans font-semibold text-sm rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-150"
            >
              Try Text Analysis
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center h-12 px-8 font-sans font-semibold text-sm rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-150"
              style={{ backgroundColor: "#00E5FF", color: "#0d0d0f" }}
            >
              Try Live Analysis
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
