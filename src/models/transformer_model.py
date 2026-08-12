"""
Transformer Classifier Option (DistilBERT)
Provides an alternative, high-precision fine-tuned Transformer pipeline.

Note on Tradeoffs:
- Primary Production Path (Default): TF-IDF + LogisticRegression
  * Inference latency: ~2ms per batch
  * Memory footprint: ~15MB RAM
  * Cost: Free tier friendly (Render 512MB RAM cap)

- Transformer Path (Optional / Config-gated): DistilBERT Classifier
  * Inference latency: ~150-300ms per batch (CPU)
  * Memory footprint: ~750MB-1.2GB RAM
  * Accuracy boost: ~2-4% on complex ambiguous sentences
  * Enable by setting USE_TRANSFORMER_MODEL=True when container memory allows
"""

import os
from typing import List, Dict, Any, Union

_transformer_pipeline = None

def get_transformer_pipeline():
    """Lazy loader for HuggingFace Transformers pipeline."""
    global _transformer_pipeline
    if _transformer_pipeline is None:
        try:
            from transformers import pipeline
            model_name = os.getenv("TRANSFORMER_MODEL_NAME", "distilbert-base-uncased-finetuned-sst-2-english")
            _transformer_pipeline = pipeline("text-classification", model=model_name, top_k=None)
        except Exception as e:
            raise RuntimeError(
                f"Failed to load Transformer model. Ensure `transformers` and `torch` are installed. Error: {str(e)}"
            )
    return _transformer_pipeline


def predict_transformer_batch(texts: List[str]) -> List[Dict[str, Any]]:
    """
    Classify a batch of review texts using DistilBERT.
    Returns list of dicts with label and confidence score.
    """
    pipe = get_transformer_pipeline()
    raw_outputs = pipe(texts, truncation=True, max_length=512)
    
    results = []
    # SST-2 maps POSITIVE -> positive, NEGATIVE -> negative
    for text, scores in zip(texts, raw_outputs):
        # Sort scores by highest confidence
        top_score = max(scores, key=lambda x: x['score'])
        raw_label = top_score['label'].lower()
        
        # Map label names
        label_map = {"positive": "positive", "negative": "negative", "neutral": "neutral", "LABEL_0": "negative", "LABEL_1": "positive"}
        predicted_sentiment = label_map.get(raw_label, "neutral")
        confidence = float(top_score['score'])
        
        results.append({
            "review_text": text,
            "predicted_sentiment": predicted_sentiment,
            "confidence": round(confidence, 4),
            "model_type": "transformer"
        })
        
    return results
