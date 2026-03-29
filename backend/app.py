from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import base64
import traceback

load_dotenv()

from gemini_handler      import analyze    as gemini_analyze
from emotion_synthesizer import synthesize as synthesize_emotions
from art_params          import build      as build_art_params

app = Flask(__name__)
CORS(app)


# ── POST /analyze ─────────────────────────────────────────────
#
# Request body (JSON):
# {
#   "frame":      string  — base64-encoded JPEG (from canvas.toDataURL)
#   "transcript": string  — voice transcript text (can be empty)
# }
@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        body       = request.get_json(force=True)
        transcript = body.get("transcript", "")
        frame_b64  = body.get("frame", "")

        if not frame_b64:
            return jsonify({"error": "Missing 'frame' in request body"}), 400

        if "," in frame_b64:
            frame_b64 = frame_b64.split(",")[1]

        frame_bytes = base64.b64decode(frame_b64)

        gemini_output    = gemini_analyze(frame_bytes, transcript)
        synthesis_output = synthesize_emotions(gemini_output)
        art_output       = build_art_params(synthesis_output)

        return jsonify(art_output)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ── GET /health ───────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    print("EmotiArt API running → http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
