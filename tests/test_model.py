"""
Pytest unit tests for Model Inference & Batch Processing (src/models/predict.py)
"""

import pytest
from src.models.predict import predict_sentiment_batch, predict_sentiment_with_confidence

def test_single_prediction_confidence():
    text = "Absolutely fantastic product, five stars!"
    res = predict_sentiment_with_confidence(text)
    assert "predicted_sentiment" in res
    assert "confidence" in res
    assert res["predicted_sentiment"] == "positive"
    assert res["confidence"] > 0.5

def test_batch_prediction_structure():
    sample_batch = [
        "Fast shipping and superb quality",
        "Arrived broken, total waste of money",
        "It is average"
    ]
    results = predict_sentiment_batch(sample_batch)
    assert len(results) == 3
    for r in results:
        assert "review_text" in r
        assert "predicted_sentiment" in r
        assert "confidence" in r

def test_empty_text_handling():
    sample_batch = ["   ", "", None]
    results = predict_sentiment_batch(sample_batch)
    for r in results:
        assert r["predicted_sentiment"] == "insufficient_text"
        assert r["confidence"] == 0.0
