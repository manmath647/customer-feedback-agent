# pyrefly: ignore [missing-import]
import joblib
from pathlib import Path

MODEL_DIR = Path("src/models/artifacts")

_model = joblib.load(MODEL_DIR/"logistic_model.pkl")
_vectorizer = joblib.load(MODEL_DIR/"tfidf_vectorizer.pkl")


def predict_sentiment(text:str) -> str:
    vec = _vectorizer.transform([text])
    prediction = _model.predict(vec)
    return prediction[0]


if __name__ == "__main__":
    samples = [
         "This product is amazing, I love it!",
        "Terrible experience, would not recommend.",
        "It's okay, nothing special.",
        "The product works as expected.",
        "Average quality, does the job.",
        "I have no strong opinion about this.",
        "Received the item on time, standard packaging.",
    ]
    for s in samples:
        print(f"{s} -> {predict_sentiment(s)}")

