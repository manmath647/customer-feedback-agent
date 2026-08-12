import os
import joblib
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple

from src.preprocessing.text_processing import preprocess_text

MODEL_DIR = Path(__file__).resolve().parent / "artifacts"

# Artifact loading with preference for v2 artifacts
def _load_artifacts():
    model_v2_path = MODEL_DIR / "logistic_model_v2.pkl"
    vec_v2_path = MODEL_DIR / "tfidf_vectorizer_v2.pkl"
    
    model_path = model_v2_path if model_v2_path.exists() else (MODEL_DIR / "logistic_model.pkl")
    vec_path = vec_v2_path if vec_v2_path.exists() else (MODEL_DIR / "tfidf_vectorizer.pkl")

    if not model_path.exists() or not vec_path.exists():
        raise FileNotFoundError(
            f"Model artifacts not found in {MODEL_DIR}. Run `python -m src.models.train_baseline` first."
        )

    model = joblib.load(model_path)
    vectorizer = joblib.load(vec_path)
    return model, vectorizer

_model, _vectorizer = _load_artifacts()


def predict_sentiment(text: str) -> str:
    """Legacy single-string sentiment prediction."""
    res = predict_sentiment_with_confidence(text)
    return res["predicted_sentiment"]


def predict_sentiment_with_confidence(text: str) -> Dict[str, Any]:
    """Single review inference returning label and confidence score."""
    batch_res = predict_sentiment_batch([text])
    return batch_res[0]


def predict_sentiment_batch(texts: List[str]) -> List[Dict[str, Any]]:
    """
    Matrix-vectorized batch inference across a list of review texts.
    Returns list of dicts with predicted sentiment label and confidence score.
    """
    if os.getenv("USE_TRANSFORMER_MODEL", "false").lower() == "true":
        try:
            from src.models.transformer_model import predict_transformer_batch
            return predict_transformer_batch(texts)
        except Exception as e:
            print(f"[Warning] Transformer prediction failed, falling back to LogReg: {e}")

    results: List[Dict[str, Any]] = []
    valid_indices: List[int] = []
    cleaned_texts: List[str] = []

    # Preprocess and handle empty/whitespace-only texts
    for idx, text in enumerate(texts):
        if not isinstance(text, str) or not text.strip():
            results.append({
                "review_text": "" if text is None else str(text),
                "predicted_sentiment": "insufficient_text",
                "confidence": 0.0
            })
            continue

        cleaned = preprocess_text(text)
        if not cleaned.strip():
            results.append({
                "review_text": str(text),
                "predicted_sentiment": "insufficient_text",
                "confidence": 0.0
            })
        else:
            cleaned_texts.append(cleaned)
            valid_indices.append(idx)
            results.append({
                "review_text": str(text),
                "predicted_sentiment": "neutral",
                "confidence": 0.0
            })

    # Batch transform and predict all valid texts in a single matrix call
    if cleaned_texts:
        X_vec = _vectorizer.transform(cleaned_texts)
        predictions = _model.predict(X_vec)
        probabilities = _model.predict_proba(X_vec)
        classes = list(_model.classes_)

        for idx, pred_label, proba_row in zip(valid_indices, predictions, probabilities):
            confidence = float(np.max(proba_row))
            results[idx]["predicted_sentiment"] = str(pred_label)
            results[idx]["confidence"] = round(confidence, 4)

    return results


if __name__ == "__main__":
    samples = [
        "This product is amazing, I love it!",
        "Terrible experience, would not recommend.",
        "It's okay, nothing special.",
        "The product works as expected.",
        "   ",
        "Average quality, does the job.",
        "I have no strong opinion about this.",
        "Received the item on time, standard packaging.",
    ]
    print("--- Testing Batch Prediction with Confidence Scores ---")
    predictions = predict_sentiment_batch(samples)
    for p in predictions:
        print(f"Text: '{p['review_text']}' -> {p['predicted_sentiment']} (Confidence: {p['confidence']})")

