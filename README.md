# 🤖 Customer Feedback Analysis Agent

<div align="center">

![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.140-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.9-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-3.0-150458?style=for-the-badge&logo=pandas&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**A production-ready sentiment analysis system that transforms raw customer reviews into actionable insights — served through an interactive, glassmorphism-styled web dashboard.**

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API Reference](#-api-reference)

</div>

---

## 📖 Overview

The **Customer Feedback Analysis Agent** is an end-to-end ML pipeline that automatically classifies customer reviews into **Positive**, **Negative**, or **Neutral** sentiments and surfaces those insights through a rich, interactive web dashboard.

It handles everything from raw data ingestion and cleaning, through model training and inference, to live visual reporting — all accessible through a clean REST API and a dark-mode web UI.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📥 **Data Ingestion** | Load `.csv`, `.xlsx`, and `.xls` review files |
| 🧹 **Data Preprocessing** | Automatic cleaning, deduplication, and label normalization |
| 🧠 **ML Classification** | TF-IDF + Logistic Regression — positive / negative / neutral |
| 📊 **Interactive Dashboard** | File upload, real-time sentiment charts, dark-mode UI |
| 📈 **Analytics Page** | Trend breakdowns and sentiment distribution visualizations |
| 📄 **Reports Page** | Exportable summary views of analysis results |
| ⚡ **REST API** | FastAPI backend with file upload and JSON prediction endpoint |
| 🌐 **WebGL Background** | Animated Three.js canvas for a premium visual experience |

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                   Customer Feedback Analysis Agent                  │
├──────────────┬──────────────────┬──────────────────┬───────────────┤
│   INGESTION  │  PREPROCESSING   │     MODELS       │      API      │
│              │                  │                  │               │
│  load_data   │   clean_data     │ train_baseline   │   FastAPI     │
│  ──────────  │   ───────────    │ ──────────────   │   ────────    │
│  .csv/.xlsx  │  Drop unnamed    │ TF-IDF (5000)    │  /dashboard   │
│  ──────────  │  Rename cols     │ LogisticRegr.    │  /analytics   │
│  pd.DataFrame│  Drop nulls      │ joblib .pkl      │  /reports     │
│              │  Deduplication   │                  │  /analyze     │
│              │  Label mapping   │  predict.py      │  /health      │
│              │  (0/1/2 → str)   │  ────────────    │               │
│              │                  │  Load model      │  HTML/CSS/JS  │
│              │                  │  TF-IDF → pred   │  Dashboard    │
└──────────────┴──────────────────┴──────────────────┴───────────────┘
```

### Data Flow Pipeline

```
  Raw CSV / XLSX
       │
       ▼
┌─────────────┐
│  Ingestion  │  load_raw_data()  →  pd.DataFrame
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Preprocessing  │  clean_data()
│                 │   ├── Drop "Unnamed: 0" artifact column
│                 │   ├── Rename: Comment → review_text
│                 │   ├── Rename: Sentiment → sentiment
│                 │   ├── Drop rows with NaN values
│                 │   ├── Deduplicate on review_text
│                 │   └── Map 0/1/2 → negative/neutral/positive
└──────┬──────────┘
       │
       ▼
┌──────────────┐
│    Models    │  train_baseline.py
│              │   ├── TfidfVectorizer (max_features=5000)
│              │   ├── LogisticRegression (max_iter=1000)
│              │   ├── 80/20 stratified train/test split
│              │   └── Saved → logistic_model.pkl
│              │              tfidf_vectorizer.pkl
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   FastAPI    │  POST /analyze
│              │   ├── Accept multipart file upload
│              │   ├── predict_sentiment() per row
│              │   └── Return JSON { total, counts, results }
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│         Web Dashboard            │
│   /dashboard  → Upload + Stats   │
│   /analytics  → Trend Charts     │
│   /reports    → Export Summary   │
└──────────────────────────────────┘
```

### ML Classification Pipeline

```
  review_text (raw string)
         │
         ▼
  TfidfVectorizer.transform()
         │   max_features = 5000
         │   sparse term-frequency matrix
         ▼
  LogisticRegression.predict()
         │   multi-class softmax
         │   classes: positive / negative / neutral
         ▼
  predicted_sentiment (string label)
```

---

## 📁 Project Structure

```
feedback-agent/
│
├── 📂 src/
│   ├── 📂 ingestion/
│   │   └── load_data.py            # Load .csv review datasets
│   │
│   ├── 📂 preprocessing/
│   │   └── clean_data.py           # Normalize, deduplicate, map labels
│   │
│   ├── 📂 models/
│   │   ├── train_baseline.py       # Train TF-IDF + Logistic Regression
│   │   ├── predict.py              # Load trained model & run inference
│   │   └── 📂 artifacts/
│   │       ├── logistic_model.pkl      # Trained classifier (~118 KB)
│   │       └── tfidf_vectorizer.pkl    # Fitted vectorizer (~178 KB)
│   │
│   ├── 📂 agent/                   # Analysis and decision logic
│   │
│   └── 📂 api/
│       ├── main.py                 # FastAPI application entrypoint
│       ├── 📂 routes/              # API endpoint definitions
│       ├── 📂 templates/
│       │   ├── dashboard.html      # Main upload & results view
│       │   ├── analytics.html      # Charts & trend breakdown
│       │   └── reports.html        # Exportable summaries
│       └── 📂 static/
│           ├── 📂 css/
│           │   └── style.css       # Glassmorphism dark theme
│           └── 📂 js/
│               ├── app.js          # Core utilities & WebGL background
│               ├── dashboard.js    # Upload handler & prediction display
│               ├── analytics.js    # Chart rendering & trend logic
│               └── reports.js      # Report generation & export
│
├── 📂 data/
│   ├── 📂 raw/                     # Original source data (never overwrite)
│   └── 📂 processed/               # Cleaned output data
│
├── 📂 tests/                       # Test suite
│
├── .env                            # Secrets & config (NOT committed)
├── .gitignore
├── AGENTS.md                       # AI agent coding conventions
├── requirements.txt                # Pinned Python dependencies
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

- **Python 3.x** installed
- **pip** package manager
- *(Optional)* Docker for containerized deployment

### 1. Clone & Set Up Virtual Environment

```bash
git clone <your-repo-url>
cd feedback-agent

# Create virtual environment
python -m venv venv

# Activate — Windows PowerShell
.\venv\Scripts\Activate.ps1

# Activate — macOS / Linux
source venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

### 2. Prepare Your Data

Place your review dataset at `data/raw/sentiment_data.csv`. The file must have these columns:

| Column | Type | Description |
|---|---|---|
| `Comment` | string | The review text |
| `Sentiment` | int | Label: `0` = negative, `1` = neutral, `2` = positive |

### 3. Train the Model

```bash
python -m src.models.train_baseline
```

Expected output:
```
Accuracy: 0.87
Classification Report:
              precision    recall  f1-score   support
    negative       0.85      0.83      0.84       ...
     neutral       0.80      0.79      0.79       ...
    positive       0.91      0.93      0.92       ...
Model and vectorizer saved to src/models/artifacts
```

### 4. Start the API Server

```bash
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

Open **[http://localhost:8000](http://localhost:8000)** in your browser.

### 5. Analyze Reviews via the Dashboard

1. Go to the **Dashboard** tab
2. Click **Upload** and select a `.csv` or `.xlsx` file with a `review_text` column
3. View real-time sentiment breakdown, individual predictions, and visual charts

---

## 🔌 API Reference

**Base URL:** `http://localhost:8000`

### Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Serves the dashboard (root redirect) |
| `GET` | `/dashboard` | Main dashboard page |
| `GET` | `/analytics` | Analytics & trend charts |
| `GET` | `/reports` | Reports summary page |
| `GET` | `/health` | Service health check |
| `POST` | `/analyze` | **Analyze uploaded review file** |

---

### `POST /analyze` — Sentiment Analysis

Upload a CSV or Excel file and receive per-review sentiment predictions plus aggregate counts.

**Request**

```http
POST /analyze
Content-Type: multipart/form-data

file: <your_reviews.csv>
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | File | ✅ | `.csv`, `.xlsx`, or `.xls`; must contain `review_text` column |

**Response `200 OK`**

```json
{
  "total_reviews": 500,
  "sentiment_counts": {
    "positive": 312,
    "negative": 88,
    "neutral": 100
  },
  "results": [
    {
      "review_text": "This product is amazing, I love it!",
      "predicted_sentiment": "positive"
    },
    {
      "review_text": "Terrible experience, would not recommend.",
      "predicted_sentiment": "negative"
    },
    {
      "review_text": "It's okay, nothing special.",
      "predicted_sentiment": "neutral"
    }
  ]
}
```

**Error Responses**

| HTTP Status | Condition |
|---|---|
| `400` | No file uploaded |
| `400` | Uploaded file is empty |
| `400` | Unsupported file format (not `.csv` / `.xlsx` / `.xls`) |
| `400` | Missing `review_text` column |
| `400` | File could not be parsed |

---

### `GET /health`

```json
{
  "status": "ok",
  "message": "API is running"
}
```

---

## 💾 Input Data Format

For the `/analyze` endpoint, your uploaded file must contain a `review_text` column:

**Example `reviews.csv`:**
```csv
review_text
"This product is absolutely fantastic!"
"Worst purchase I have ever made. Broken on arrival."
"It's okay, does what it's supposed to do."
"Great quality and fast shipping, very happy."
"Average product, nothing special about it."
```

> **Note:** The training data uses `Comment` and `Sentiment` columns. The preprocessing pipeline renames them internally. When uploading files for inference through the dashboard or API, use the `review_text` column name directly.

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Role |
|---|---|---|---|
| **API Framework** | FastAPI | 0.140.x | REST API + file routing |
| **ASGI Server** | Uvicorn | 0.51.x | Production-grade async server |
| **Data Processing** | Pandas | 3.0.x | DataFrame manipulation |
| **Numerical** | NumPy | 2.5.x | Array operations |
| **ML — Vectorization** | scikit-learn TfidfVectorizer | 1.9.x | Text feature extraction |
| **ML — Classifier** | scikit-learn LogisticRegression | 1.9.x | Sentiment classification |
| **ML — Evaluation** | scikit-learn metrics | 1.9.x | Accuracy, classification report |
| **Model Persistence** | joblib | 1.5.x | Save / load `.pkl` model files |
| **Excel Support** | openpyxl | 3.1.x | `.xlsx` file parsing |
| **Validation** | Pydantic | 2.13.x | API request / response schemas |
| **Frontend Styling** | Tailwind CSS (CDN) | v3 | Utility-first dark theme |
| **3D Background** | Three.js | r128 | WebGL animated canvas |
| **Icons** | Google Material Symbols | — | UI iconography |
| **Containerization** | Docker | — | Deployment |

---

## 🔒 Security & Configuration

All secrets and environment-specific config live in `.env` — this file is **never committed** to version control.

```env
# Add API keys and connection strings here
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:pass@host/db
```

Rule: **No secrets in source code. Ever.**

---

## 🧪 Testing

Tests live in `tests/`. To run the full suite:

```bash
pytest tests/ -v
```

---

## 🐳 Docker

```bash
docker compose up --build
# Access at http://localhost:8000
```

---

## 🤝 Conventions

| Rule | Detail |
|---|---|
| **Type Hints** | All function signatures must have type annotations |
| **Secrets** | All config in `.env` — never hardcoded, never committed |
| **Dependencies** | Pin with `pip freeze > requirements.txt` after every install |
| **Folder Structure** | Each folder maps to one pipeline stage — add new files inside existing folders |
| **Code Style** | Follow PEP 8. Use descriptive variable names |
| **Data Immutability** | `data/raw/` is read-only — cleaned output goes to `data/processed/` |

---

## 📄 License

This project is for internal / educational use. License TBD.

---

<div align="center">

Built with ❤️ using Python · FastAPI · scikit-learn

</div>
