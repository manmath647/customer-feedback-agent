import pandas as pd

SENTIMENT_MAP = {0: "negative", 1: "neutral", 2: "positive"}

def clean_data(df:pd.DataFrame)->pd.DataFrame:
    df = df.copy()
   

    if "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])


    df = df.rename(columns={"Comment": "review_text", "Sentiment": "sentiment"})


    df = df.dropna(subset=["review_text", "sentiment"])


    df = df.drop_duplicates(subset=["review_text"])
    df["sentiment_label"] = df["sentiment"].map(SENTIMENT_MAP)

    return df


if __name__ == "__main__":
    from src.ingestion.load_data import load_raw_data

    raw_df = load_raw_data()
    print(f"Raw rows: {len(raw_df)}")

    cleaned_df = clean_data(raw_df)
    print(f"Cleaned rows: {len(cleaned_df)}")
    print(cleaned_df.head())
    print(cleaned_df["sentiment_label"].value_counts())