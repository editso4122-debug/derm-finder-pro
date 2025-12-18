# app.py — model-only, production-safe backend
#
# Changes made to meet the “STRICTLY MODEL-DRIVEN” requirement:
# - REMOVED demo/mocked responses and any “fallback” behavior.
# - If a required model fails to load or inference fails, the API returns an error (no fake outputs).
# - Added explicit CORS handling so the Lovable-hosted frontend can call this API via ngrok.
#
# Notes:
# - Disease prediction is generated ONLY from the CLIP model inference (no keyword/rule logic).
# - Explanations/recommendations are generated ONLY from the FLAN-T5 model inference.

import json
import os
from datetime import datetime

import numpy as np
import torch
from flask import Flask, jsonify, request
from PIL import Image
from transformers import CLIPModel, CLIPProcessor, AutoModelForSeq2SeqLM, AutoTokenizer
from werkzeug.utils import secure_filename

# -----------------------------
# CONFIG
# -----------------------------
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXT = {"jpg", "jpeg", "png"}

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# -----------------------------
# MODEL IDs
# -----------------------------
CLIP_ID = "openai/clip-vit-base-patch32"
FLAN_ID = "google/flan-t5-base"

# -----------------------------
# DISEASE LABELS
# (Label space for zero-shot scoring)
# -----------------------------
DISEASES = [
    "acne vulgaris",
    "rosacea",
    "hidradenitis suppurativa",
    "folliculitis",
    "seborrheic dermatitis",
    "atopic dermatitis",
    "contact dermatitis",
    "psoriasis vulgaris",
    "inverse psoriasis",
    "scalp psoriasis",
    "pityriasis rosea",
    "lichen planus",
    "urticaria (hives)",
    "impetigo",
    "cellulitis",
    "erysipelas",
    "tinea corporis (ringworm)",
    "tinea versicolor",
    "onychomycosis",
    "molluscum contagiosum",
    "herpes simplex",
    "herpes zoster",
    "scabies",
    "vitiligo",
    "hyperpigmentation",
    "melasma",
    "seborrheic keratosis",
    "actinic keratosis",
    "melanoma",
    "basal cell carcinoma",
    "squamous cell carcinoma",
    "dandruff",
    "alopecia areata",
    "granuloma annulare",
]

# -----------------------------
# APP
# -----------------------------
app = Flask(__name__)


# -----------------------------
# CORS
# -----------------------------
@app.after_request
def add_cors_headers(resp):
    # Needed so your Lovable-hosted frontend (different origin) can call this API through ngrok.
    origin = request.headers.get("Origin")
    resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, ngrok-skip-browser-warning"

    # Echo the Origin so the browser accepts the response.
    # (Using "*" is okay too, but echoing is more compatible with strict clients.)
    if origin:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Vary"] = "Origin"
    else:
        resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp


# -----------------------------
# GLOBAL MODELS (REQUIRED)
# -----------------------------
clip_processor: CLIPProcessor | None = None
clip_model: CLIPModel | None = None
flan_tokenizer: AutoTokenizer | None = None
flan_model: AutoModelForSeq2SeqLM | None = None


def load_models_or_die() -> None:
    """Load required models at startup.

    STRICT rule: no fallback logic.
    If any required model fails to load, the process should fail (or at minimum, API must error).
    """
    global clip_processor, clip_model, flan_tokenizer, flan_model

    try:
        print("[INFO] Loading CLIP…")
        clip_processor = CLIPProcessor.from_pretrained(CLIP_ID)
        clip_model = CLIPModel.from_pretrained(CLIP_ID).to(DEVICE)
        clip_model.eval()
        print("[INFO] CLIP loaded.")
    except Exception as e:
        raise RuntimeError(f"Failed to load CLIP model: {e}")

    try:
        print("[INFO] Loading FLAN-T5…")
        flan_tokenizer = AutoTokenizer.from_pretrained(FLAN_ID)
        flan_model = AutoModelForSeq2SeqLM.from_pretrained(FLAN_ID).to(DEVICE)
        flan_model.eval()
        print("[INFO] FLAN-T5 loaded.")
    except Exception as e:
        raise RuntimeError(f"Failed to load FLAN-T5 model: {e}")


load_models_or_die()


# -----------------------------
# UTILITIES
# -----------------------------

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


def open_image(path: str) -> Image.Image:
    # No silent fallback: if this fails, let the caller return a proper error.
    return Image.open(path).convert("RGB")


def build_prompts(symptoms: str) -> list[str]:
    s = symptoms.strip()
    if s:
        return [f"Clinical photo of {d}. Symptoms: {s}." for d in DISEASES]
    return [f"Clinical photo of {d}." for d in DISEASES]


def predict_with_clip(image: Image.Image, symptoms: str) -> list[dict]:
    """Return ranked predictions using ONLY CLIP inference."""
    if clip_processor is None or clip_model is None:
        raise RuntimeError("CLIP model not loaded")

    texts = build_prompts(symptoms)
    inputs = clip_processor(text=texts, images=image, return_tensors="pt", padding=True)
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        out = clip_model(**inputs)
        logits = out.logits_per_image[0]  # [num_labels]
        probs = torch.softmax(logits, dim=-1)

    probs_np = probs.detach().cpu().numpy().astype(float)
    order = np.argsort(probs_np)[::-1]

    predictions = [
        {
            "disease": DISEASES[int(i)],
            "confidence": float(probs_np[int(i)]),
        }
        for i in order[:5]
    ]
    return predictions


def generate_analysis_json(predictions: list[dict], symptoms: str) -> dict:
    """Generate explanation + recommendations using ONLY FLAN inference.

    STRICT rule: no placeholder text. If generation/parsing fails, raise and return an error.
    """
    if flan_tokenizer is None or flan_model is None:
        raise RuntimeError("FLAN-T5 model not loaded")

    top3 = predictions[:3]
    pred_lines = "\n".join(
        [f"- {p['disease']}: {p['confidence'] * 100:.1f}%" for p in top3]
    )

    prompt = (
        "You are a medical assistant for dermatology triage. "
        "Based ONLY on the predictions and symptoms, produce a single JSON object (no markdown).\n"
        "JSON keys must be: severity, suggestedDoctor, description, symptomAnalysis, recommendations.\n"
        "- severity must be one of: Low, Moderate, High\n"
        "- suggestedDoctor should be a short string (e.g., 'Dermatologist')\n"
        "- description: 1 sentence, not a diagnosis\n"
        "- symptomAnalysis: 2-4 sentences explaining the top prediction\n"
        "- recommendations: an array of 3-5 short, safe next steps\n\n"
        f"Symptoms: {symptoms.strip()}\n"
        f"Predictions:\n{pred_lines}\n"
    )

    inputs = flan_tokenizer(prompt, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        out = flan_model.generate(
            **inputs,
            max_new_tokens=220,
            do_sample=False,
            num_beams=3,
        )

    text = flan_tokenizer.decode(out[0], skip_special_tokens=True).strip()

    # STRICT: Must be valid JSON; otherwise fail (no fallback).
    try:
        parsed = json.loads(text)
    except Exception as e:
        raise ValueError(f"FLAN output was not valid JSON: {e}. Raw: {text[:400]}")

    # Basic schema enforcement (still strict; if missing, fail)
    for k in ["severity", "suggestedDoctor", "description", "symptomAnalysis", "recommendations"]:
        if k not in parsed:
            raise ValueError(f"FLAN JSON missing key: {k}")

    if not isinstance(parsed["recommendations"], list) or not parsed["recommendations"]:
        raise ValueError("FLAN JSON recommendations must be a non-empty array")

    return parsed


# -----------------------------
# ROUTES
# -----------------------------
@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze():
    # Preflight for CORS
    if request.method == "OPTIONS":
        return ("", 204)

    symptoms = (request.form.get("symptoms") or "").strip()
    file = request.files.get("file")

    if not file:
        return jsonify({"error": "Missing image file (field name: file)."}), 400

    if not allowed_file(file.filename or ""):
        return jsonify({"error": "Please upload a valid image (jpg/jpeg/png)."}), 400

    if not symptoms:
        return jsonify({"error": "Please describe your symptoms for accurate analysis."}), 400

    # Save image
    fname = secure_filename(file.filename)
    path = os.path.join(UPLOAD_FOLDER, fname)
    file.save(path)

    try:
        img = open_image(path)
    except Exception as e:
        return jsonify({"error": f"Unable to read image: {e}"}), 400

    # STRICTLY model-driven prediction
    try:
        predictions = predict_with_clip(img, symptoms)
    except Exception as e:
        return jsonify({"error": f"Model inference failed (prediction): {e}"}), 500

    top = predictions[0]

    # STRICTLY model-driven explanation/recommendations
    try:
        analysis = generate_analysis_json(predictions, symptoms)
    except Exception as e:
        return jsonify({"error": f"Model inference failed (explanation): {e}"}), 500

    return jsonify(
        {
            "condition": top["disease"],
            "confidence": round(float(top["confidence"]) * 100, 1),
            "description": analysis["description"],
            "severity": analysis["severity"],
            "suggestedDoctor": analysis["suggestedDoctor"],
            "symptomAnalysis": analysis["symptomAnalysis"],
            "recommendations": analysis["recommendations"],
            "predictions": predictions,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    )


if __name__ == "__main__":
    # debug=False for production safety; keep host/port for ngrok.
    app.run(host="0.0.0.0", port=5000, debug=False)
