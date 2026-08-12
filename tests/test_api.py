"""
Pytest unit tests for FastAPI Endpoints (src/api/main.py)
"""

import pytest
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "API is running"}

def test_analyze_missing_file():
    response = client.post("/analyze")
    assert response.status_code in (400, 422)

def test_analyze_csv_upload():
    csv_content = "review_text\nGreat service!\nVery slow."
    files = {"file": ("test.csv", csv_content, "text/csv")}
    response = client.post("/analyze", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "total_reviews" in data
    assert data["total_reviews"] == 2
    assert "sentiment_counts" in data
    assert "results" in data
    assert "confidence" in data["results"][0]
