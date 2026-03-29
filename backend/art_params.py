EMOTION_ART = {
    "happy":       {"color": "#FFD166", "colorRgb": [255, 209, 102], "shape": "circle"},
    "calm":        {"color": "#06AED4", "colorRgb": [6,   174, 212], "shape": "wave"},
    "sad":         {"color": "#9B72CF", "colorRgb": [155, 114, 207], "shape": "arc"},
    "angry":       {"color": "#EF233C", "colorRgb": [239, 35,  60],  "shape": "triangle"},
    "anxious":     {"color": "#F4A261", "colorRgb": [244, 162, 97],  "shape": "dot"},
    "excited":     {"color": "#FF6B9D", "colorRgb": [255, 107, 157], "shape": "star"},
    "overwhelmed": {"color": "#8ECAE6", "colorRgb": [142, 202, 230], "shape": "dense"},
}

# intensity (0.0 → 1.0) interpolates between (low, high) for each param
INTENSITY_SCALE = {
    "shapeCount": (10,   32  ),
    "sizeMin":    (12,   22  ),
    "sizeMax":    (30,   90  ),
    "opacityMin": (0.10, 0.25),
    "opacityMax": (0.40, 0.80),
}


def build(synthesis_output: dict) -> dict:
    emotion        = synthesis_output["emotion"]
    intensity      = synthesis_output["intensity"]
    conflict       = synthesis_output["conflict"]
    conflict_blend = synthesis_output["conflict_blend"]
    secondary_key  = synthesis_output.get("_secondary_emotion", emotion)

    def lerp(key):
        lo, hi = INTENSITY_SCALE[key]
        return lo + (hi - lo) * intensity

    art = {
        "primary":        EMOTION_ART[emotion],
        "secondary":      EMOTION_ART[secondary_key] if conflict else None,
        "shapeCount":     round(lerp("shapeCount")),
        "sizeMin":        round(lerp("sizeMin"),    1),
        "sizeMax":        round(lerp("sizeMax"),    1),
        "opacityMin":     round(lerp("opacityMin"), 2),
        "opacityMax":     round(lerp("opacityMax"), 2),
        "secondaryRatio": conflict_blend,
    }

    return {
        "emotion":        emotion,
        "intensity":      intensity,
        "conflict":       conflict,
        "conflict_blend": conflict_blend,
        "art":            art,
    }
