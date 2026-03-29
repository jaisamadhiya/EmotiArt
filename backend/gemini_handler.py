import os
import json
import re
import io
import google.generativeai as genai
from PIL import Image

# Load API key from environment — never hardcode this
_api_key = os.environ.get("GEMINI_API_KEY")
if not _api_key:
    raise EnvironmentError("GEMINI_API_KEY environment variable is not set. See .env.example.")

genai.configure(api_key=_api_key)
_model = genai.GenerativeModel("gemini-1.5-flash")

VALID_EMOTIONS = {"happy", "calm", "sad", "angry", "anxious", "excited", "overwhelmed"}

_PROMPT = """You are an emotion classifier. Analyze the facial expression in the image
and the sentiment of the transcript. Return ONLY a JSON object — no markdown, no explanation.
Emotion must be exactly one of: happy, calm, sad, angry, anxious, excited, overwhelmed.
Confidence and energy are floats from 0.0 to 1.0.

Transcript: "{transcript}"

Return this exact structure:
{{
  "face":  {{ "emotion": str, "confidence": float }},
  "voice": {{ "emotion": str, "confidence": float, "energy": float }}
}}"""


def analyze(frame_bytes: bytes, transcript: str) -> dict:
    """
    Parameters
    ----------
    frame_bytes : raw JPEG or PNG bytes from any camera source
    transcript  : voice-to-text string (can be empty string)

    Returns
    -------
    {
        "face":  { "emotion": str, "confidence": float },
        "voice": { "emotion": str, "confidence": float, "energy": float }
    }
    """
    image = Image.open(io.BytesIO(frame_bytes))
    prompt = _PROMPT.format(transcript=transcript or "(no speech detected)")
    response = _model.generate_content([prompt, image])
    return _parse(response.text.strip())


def _parse(raw: str) -> dict:
    raw = re.sub(r"```json|```", "", raw).strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Gemini returned invalid JSON: {e}\nRaw: {raw}")

    for key in ("face", "voice"):
        block = data.get(key, {})
        emotion = str(block.get("emotion", "")).lower()
        data[key]["emotion"]    = emotion if emotion in VALID_EMOTIONS else "calm"
        data[key]["confidence"] = _clamp(block.get("confidence", 0.5))

    data["voice"]["energy"] = _clamp(data["voice"].get("energy", 0.5))
    return data


def _clamp(val, lo=0.0, hi=1.0):
    try:
        return max(lo, min(hi, float(val)))
    except (TypeError, ValueError):
        return 0.5
