"""
Flask API Server — Skin Type Classifier & Recommender
======================================================
Run this AFTER you have trained and saved the model with:
    torch.save(model.state_dict(), 'skin_model.pth')

Start the server:
    python app.py
"""

import io
import os
import cv2
import torch
import torch.nn as nn
import numpy as np
import face_recognition

from flask import Flask, request, jsonify
from PIL import Image
from torchvision import transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

# --- NEW: Import your Groq Recommendation logic ---
from recommendation import get_recommendation, reset_session, chat

# =========================================================
# GPU CONFIG  
# =========================================================
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[INFO] Running on: {DEVICE}")
if DEVICE.type == "cuda":
    print(f"[INFO] GPU: {torch.cuda.get_device_name(0)}")

# =========================================================
# LABELS
# =========================================================
SKIN_LABELS = {"Dry": 0, "Oily": 1, "Normal": 2, "Combination": 3}
INDEX_SKIN  = {v: k for k, v in SKIN_LABELS.items()}

# =========================================================
# MODEL DEFINITION 
# =========================================================
class SkinClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = efficientnet_b0(weights=None)          
        num_ftrs = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Identity()
        self.fc = nn.Sequential(
            nn.BatchNorm1d(num_ftrs),
            nn.Dropout(0.3),
            nn.Linear(num_ftrs, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 4)
        )

    def forward(self, x):
        features = self.backbone(x)
        return self.fc(features)

# =========================================================
# LOAD SAVED WEIGHTS
# =========================================================
MODEL_PATH = os.getenv("MODEL_PATH", "skin_model.pth")

model = SkinClassifier().to(DEVICE)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.eval()
print(f"[INFO] Model loaded from '{MODEL_PATH}'")

# =========================================================
# TRANSFORMS  
# =========================================================
val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# =========================================================
# FACE CROP HELPER  
# =========================================================
def crop_face(img: Image.Image, margin: int = 80) -> Image.Image:
    img_np = np.array(img)
    faces = face_recognition.face_locations(img_np)
    if faces:
        top, right, bottom, left = faces[0]
        h, w = img_np.shape[:2]
        top    = max(0, top    - margin)
        left   = max(0, left   - margin)
        bottom = min(h, bottom + margin)
        right  = min(w, right  + margin)
        img_np = img_np[top:bottom, left:right]
    return Image.fromarray(img_np)

# =========================================================
# FLASK APP
# =========================================================
app = Flask(__name__)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "device": str(DEVICE),
        "gpu": torch.cuda.get_device_name(0) if DEVICE.type == "cuda" else "none"
    })

@app.route("/predict", methods=["POST"])
def predict():
    """
    Accepts: multipart/form-data with field 'image'
    Returns: JSON with skin_type, confidence, and AI recommendations
    """
    if "image" not in request.files:
        return jsonify({"error": "No 'image' field in request"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        # 1. Read and crop image
        img_bytes = file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img = crop_face(img)
        img.save("debug_cropped_face.jpg")
        # 2. Transform & predict on RTX 3050
        x = val_transform(img).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            out   = model(x)
            probs = torch.softmax(out, dim=1)
            pred_idx    = out.argmax(1).item()
            confidence  = probs[0][pred_idx].item()
            
        skin_type_result = INDEX_SKIN[pred_idx]

        # 3. Get AI Recommendations from Groq API
        # Reset session ensures previous users' data doesn't mix with this one
        reset_session() 
        
        # We pass "no condition detected" as default since your vision model predicts type, not disease
        # Grab the condition sent from the frontend questionnaire
        # If they didn't send anything, default to "no condition detected"
        user_condition = request.form.get("condition", "no condition detected")
        
        # Pass their actual condition to your AI so it adjusts the products!
        routine_advice = get_recommendation(skin_type=skin_type_result, condition=user_condition)

        # 4. Return everything to the frontend
        return jsonify({
            "skin_type": skin_type_result,
            "confidence": round(confidence, 4),
            "recommendations": routine_advice
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/chat", methods=["POST"])
def handle_chat():
    """
    Endpoint for follow-up chat messages after the initial scan.
    Accepts JSON: {"message": "Can I use vitamin C?"}
    """
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "No message provided"}), 400
        
    user_message = data["message"]
    reply = chat(user_message)
    
    return jsonify({"reply": reply})

# =========================================================
# ENTRY POINT
# =========================================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)