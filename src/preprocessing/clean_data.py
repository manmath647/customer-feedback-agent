import pandas as pd
from src.preprocessing.text_processing import preprocess_text

SENTIMENT_MAP = {0: "negative", 1: "neutral", 2: "positive"}

def clean_data(df: pd.DataFrame, use_stemming: bool = False) -> pd.DataFrame:
    df = df.copy()

    if "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])

    df = df.rename(columns={"Comment": "review_text", "Sentiment": "sentiment"})

    df = df.dropna(subset=["review_text", "sentiment"])

    df = df.drop_duplicates(subset=["review_text"])
    df["sentiment_label"] = df["sentiment"].map(SENTIMENT_MAP)
    
    # Process text through the NLP pipeline
    df["cleaned_review_text"] = df["review_text"].astype(str).apply(
        lambda t: preprocess_text(t, use_stemming=use_stemming)
    )
    
    # Filter out any rows that become completely empty after text cleaning
    df = df[df["cleaned_review_text"].str.strip() != ""].reset_index(drop=True)

    return df



if __name__ == "__main__":
    from src.ingestion.load_data import load_raw_data

    raw_df = load_raw_data()
    print(f"Raw rows: {len(raw_df)}")

    cleaned_df = clean_data(raw_df)
    print(f"Cleaned rows: {len(cleaned_df)}")
    print(cleaned_df.head())
    print(cleaned_df["sentiment_label"].value_counts())