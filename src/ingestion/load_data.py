import pandas as pd 
from pathlib import Path

raw_data_path = Path("data/raw/sentiment_data.csv")

def load_raw_data(path : Path = raw_data_path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"File {path} does not exist")
    df = pd.read_csv(path)
    return df



if __name__ == "__main__":
    df = load_raw_data()
    print(f"Loaded {len(df)} rows")
    print(df.head())
    print(df.columns.tolist())
