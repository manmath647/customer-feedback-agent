# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
import io

from src.models.predict import predict_sentiment

app = FastAPI(title = " Customer Feedback Analysis Agent")


EXPECTED_COLUMN = "review_text"


@app.get("/")
def health_check():
    return {"status": "ok", "message": "API is running"}


@app.post("/analyze")
async def analyze_reviews(file: UploadFile = File(...)):
    filename = file.filename.lower()
    contents = await file.read()

    if filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    elif filename.endswith((".xlsx",".xls")):
        df = df.real_excel(io.BytesIO(contents))
    else:
        raise HTTPException(status_code = 400, detail = 'only csv or excel files are supported')

    if EXPECTED_COLUMN not in df.columns:
        raise HTTPException(
            status_code = 400,
            detail = f"file must contain a '{EXPECTED_COLUMN}' column. found : {df.colums.tolist()}"
        )

    df["predicted_sentiment"] = df[EXPECTED_COLUMN].astype(str).apply(predict_sentiment)
    

    sentiment_counts = df["predicted_sentiment"].value_counts().to_dict()

    return {
        "total_reviews": len(df),
        "sentiment_counts": sentiment_counts,
        "results": df[[EXPECTED_COLUMN,"predicted_sentiment"]].to_dict(orient = "records")
    }

