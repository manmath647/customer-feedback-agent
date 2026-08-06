# pyrefly: ignore [missing-import]
from pathlib import Path
import io

import pandas as pd
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware

from src.models.predict import predict_sentiment

# ---------------------------------------------------------------------------
# Rate limiter (in-memory; fine for single-worker Render free tier)
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(title="Customer Feedback Analysis Agent")

# Attach rate-limit exceeded handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# CORS — same-origin only; no wild-card.
# Add your Render public URL to allow_origins when deployed, e.g.:
#   "https://your-app.onrender.com"
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this to your Render URL after first deploy
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    max_age=600,
)

# ---------------------------------------------------------------------------
# Security headers middleware
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        # Do NOT add HSTS here — Render's edge proxy handles it
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
EXPECTED_COLUMN = "review_text"
MAX_FILE_BYTES = 10 * 1024 * 1024   # 10 MB
MAX_ROWS = 5_000                     # prevent OOM on free tier


# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------
@app.get("/")
async def read_root():
    return FileResponse(TEMPLATES_DIR / "dashboard.html")


@app.get("/dashboard")
async def read_dashboard():
    return FileResponse(TEMPLATES_DIR / "dashboard.html")


@app.get("/analytics")
async def read_analytics():
    return FileResponse(TEMPLATES_DIR / "analytics.html")


@app.get("/reports")
async def read_reports():
    return FileResponse(TEMPLATES_DIR / "reports.html")


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API is running"}


# ---------------------------------------------------------------------------
# Analyze endpoint  — rate-limited to 30 calls / minute per IP
# ---------------------------------------------------------------------------
@app.post("/analyze")
@limiter.limit("30/minute")
async def analyze_reviews(request: Request, file: UploadFile = File(...)):
    # --- Basic filename checks ---
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    filename = file.filename.lower()
    if not filename.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Only .csv, .xlsx, or .xls files are accepted.",
        )

    # --- Read with hard size cap ---
    contents = await file.read(MAX_FILE_BYTES + 1)
    if len(contents) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_BYTES // (1024 * 1024)} MB.",
        )

    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # --- Parse ---
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded dataset contains no data rows")

    # --- Row cap ---
    if len(df) > MAX_ROWS:
        raise HTTPException(
            status_code=400,
            detail=f"Dataset too large: {len(df):,} rows found. Maximum allowed is {MAX_ROWS:,} rows.",
        )

    # --- Column check ---
    if EXPECTED_COLUMN not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File must contain a '{EXPECTED_COLUMN}' column. "
                f"Found columns: {df.columns.tolist()}"
            ),
        )

    # --- Inference ---
    df["predicted_sentiment"] = df[EXPECTED_COLUMN].astype(str).apply(predict_sentiment)

    counts = df["predicted_sentiment"].value_counts().to_dict()
    sentiment_counts = {
        "positive": int(counts.get("positive", 0)),
        "negative": int(counts.get("negative", 0)),
        "neutral":  int(counts.get("neutral",  0)),
    }

    return {
        "total_reviews":    len(df),
        "sentiment_counts": sentiment_counts,
        "results":          df[[EXPECTED_COLUMN, "predicted_sentiment"]].to_dict(orient="records"),
    }
