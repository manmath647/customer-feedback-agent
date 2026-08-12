"""
Pytest unit tests for NLP Preprocessing Pipeline (src/preprocessing/text_processing.py)
"""

import pytest
from src.preprocessing.text_processing import preprocess_text, expand_contractions, normalize_emojis

def test_lowercase_and_url_stripping():
    raw = "Check out HTTPS://EXAMPLE.COM for GREAT feedback!"
    cleaned = preprocess_text(raw)
    assert "http" not in cleaned
    assert "example" not in cleaned
    assert "great" in cleaned or "feedback" in cleaned

def test_negation_preservation():
    # Negation words must NOT be removed as stopwords
    raw = "This is not good and cannot work"
    cleaned = preprocess_text(raw)
    assert "not" in cleaned
    assert "cannot" in cleaned

def test_contraction_expansion():
    raw = "don't buy this, won't recommend"
    expanded = expand_contractions(raw)
    assert "do not" in expanded
    assert "will not" in expanded

def test_emoji_mapping():
    raw = "Love it :) Bad experience :("
    mapped = normalize_emojis(raw)
    assert "emoji_positive" in mapped
    assert "emoji_negative" in mapped
