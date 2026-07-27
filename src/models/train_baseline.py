

import pandas as pd
# pyrefly: ignore [missing-import]
import joblib 
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report , accuracy_score


from src.ingestion.load_data import load_raw_data
from src.preprocessing.clean_data import clean_data
MODEL_DIR = Path("src/models/artifacts")


def train_model():
    raw_df = load_raw_data()
    df = clean_data(raw_df)

    X = df["review_text"]
    Y = df["sentiment_label"]

    X_train, X_test,Y_train, Y_test = train_test_split(X,Y,test_size = 0.2, random_state= 42,stratify = Y)


    vectorizer = TfidfVectorizer(max_features = 5000)
    X_train_vec  = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)


    model = LogisticRegression(max_iter = 1000)
    model.fit(X_train_vec,Y_train)


    y_pred = model.predict(X_test_vec)
    print("Accuracy:",accuracy_score(Y_test,y_pred))

    print("Classification Report:")
    print(classification_report(Y_test,y_pred))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_DIR / "logistic_model.pkl")
    joblib.dump(vectorizer, MODEL_DIR / "tfidf_vectorizer.pkl")
    print(f"Model and vectorizer saved to {MODEL_DIR}")


if __name__ == "__main__":
    train_model()

