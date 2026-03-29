import math

# Each emotion is a point in 2D space:
#   valence = how positive/negative the mood is  (-1 to 1)
#   arousal = how much energy it carries          (-1 to 1)
EMOTION_VECTORS = {
    "happy":       {"valence":  0.8,  "arousal":  0.4},
    "excited":     {"valence":  0.7,  "arousal":  0.9},
    "calm":        {"valence":  0.4,  "arousal": -0.6},
    "anxious":     {"valence": -0.4,  "arousal":  0.7},
    "sad":         {"valence": -0.7,  "arousal": -0.5},
    "angry":       {"valence": -0.8,  "arousal":  0.8},
    "overwhelmed": {"valence": -0.5,  "arousal":  0.9},
}

# If the blended point is this far from any known emotion,
# the face and voice are genuinely conflicting
CONFLICT_THRESHOLD = 0.45


def synthesize(gemini_output: dict) -> dict:
    """
    Parameters
    ----------
    gemini_output : output from gemini_handler.analyze()

    Returns
    -------
    {
        "emotion":            str,
        "intensity":          float,
        "conflict":           bool,
        "conflict_blend":     float,
        "_secondary_emotion": str
    }
    """
    face  = gemini_output["face"]
    voice = gemini_output["voice"]

    fv = EMOTION_VECTORS[face["emotion"]]
    vv = EMOTION_VECTORS[voice["emotion"]]

    # Face weighted 60%, voice 40% — face is more reliable for emotion
    total   = face["confidence"] + voice["confidence"]
    w_face  = (face["confidence"]  / total) * 0.6
    w_voice = (voice["confidence"] / total) * 0.4
    w_sum   = w_face + w_voice

    blended_valence = (fv["valence"] * w_face + vv["valence"] * w_voice) / w_sum
    blended_arousal = (fv["arousal"] * w_face + vv["arousal"] * w_voice) / w_sum

    final_emotion, min_dist = _closest_emotion(blended_valence, blended_arousal)

    labels_differ  = face["emotion"] != voice["emotion"]
    conflict       = labels_differ and min_dist > CONFLICT_THRESHOLD
    conflict_blend = round(min(0.5, min_dist * 0.7), 2) if conflict else 0.0

    raw_intensity = math.sqrt(blended_valence**2 + blended_arousal**2) / math.sqrt(2)
    intensity     = round(min(1.0, raw_intensity * 0.7 + voice["energy"] * 0.3), 2)

    secondary = voice["emotion"] if w_face >= w_voice else face["emotion"]

    return {
        "emotion":            final_emotion,
        "intensity":          intensity,
        "conflict":           conflict,
        "conflict_blend":     conflict_blend,
        "_secondary_emotion": secondary,
    }


def _closest_emotion(valence: float, arousal: float) -> tuple[str, float]:
    best, best_dist = None, float("inf")
    for name, vec in EMOTION_VECTORS.items():
        dist = math.sqrt(
            (vec["valence"] - valence) ** 2 +
            (vec["arousal"] - arousal) ** 2
        )
        if dist < best_dist:
            best_dist = dist
            best = name
    return best, best_dist
