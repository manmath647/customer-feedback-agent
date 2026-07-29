# pyrefly: ignore [missing-import]
from pathlib import Path
import io
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from src.models.predict import predict_sentiment

app = FastAPI(title="Customer Feedback Analysis Agent")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

EXPECTED_COLUMN = "review_text"

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

@app.post("/analyze")
async def analyze_reviews(file: UploadFile = File(...)):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
        
    filename = file.filename.lower()
    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Only .csv, .xlsx, or .xls files are accepted."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse file: {str(e)}"
        )

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded dataset contains no data rows")

    if EXPECTED_COLUMN not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"File must contain a '{EXPECTED_COLUMN}' column. Found columns: {df.columns.tolist()}"
        )

    # Predict sentiments for each review
    df["predicted_sentiment"] = df[EXPECTED_COLUMN].astype(str).apply(predict_sentiment)
    
    # Ensure default dictionary structure with lowercase keys
    counts = df["predicted_sentiment"].value_counts().to_dict()
    sentiment_counts = {
        "positive": int(counts.get("positive", 0)),
        "negative": int(counts.get("negative", 0)),
        "neutral": int(counts.get("neutral", 0))
    }

    return {
        "total_reviews": len(df),
        "sentiment_counts": sentiment_counts,
        "results": df[[EXPECTED_COLUMN, "predicted_sentiment"]].to_dict(orient="records")
    }
