import pandas as pd
import joblib 
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

from src.ingestion.load_data import load_raw_data
from src.preprocessing.clean_data import clean_data

MODEL_DIR = Path(__file__).resolve().parent / "artifacts"


def train_model():
    raw_df = load_raw_data()
    df = clean_data(raw_df, use_stemming=False)

    X = df["cleaned_review_text"]
    Y = df["sentiment_label"]

    print("--- Class Distribution in Training Data ---")
    print(Y.value_counts(normalize=False))
    print(Y.value_counts(normalize=True).apply(lambda x: f"{x:.2%}"))
    print("-------------------------------------------\n")

    X_train, X_test, Y_train, Y_test = train_test_split(
        X, Y, test_size=0.2, random_state=42, stratify=Y
    )

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=2,
        max_df=0.9,
        max_features=15000
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # Candidate Algorithms Benchmark
    candidates = {
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42, C=2.0),
        "LinearSVC (Calibrated)": CalibratedClassifierCV(LinearSVC(random_state=42, C=1.0, max_iter=2000)),
        "MultinomialNB": MultinomialNB(alpha=0.5),
        "SGDClassifier (LogLoss)": SGDClassifier(loss="log_loss", random_state=42, max_iter=1000)
    }

    best_model = None
    best_name = ""
    best_acc = 0.0
    best_pred = None

    print("=== BENCHMARKING ALGORITHMS ===")
    for name, clf in candidates.items():
        clf.fit(X_train_vec, Y_train)
        y_pred = clf.predict(X_test_vec)
        acc = accuracy_score(Y_test, y_pred)
        print(f"[{name}] Accuracy: {acc:.4f}")

        if acc > best_acc:
            best_acc = acc
            best_name = name
            best_model = clf
            best_pred = y_pred

    print(f"\nWINNER: '{best_name}' with Accuracy: {best_acc:.4f}\n")

    print(f"Classification Report ({best_name}):")
    print(classification_report(Y_test, best_pred))

    labels = ["negative", "neutral", "positive"]
    cm = confusion_matrix(Y_test, best_pred, labels=labels)
    cm_df = pd.DataFrame(cm, index=[f"Actual_{l}" for l in labels], columns=[f"Pred_{l}" for l in labels])
    print("\nConfusion Matrix:")
    print(cm_df)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    # Save best model and vectorizer
    joblib.dump(best_model, MODEL_DIR / "logistic_model_v2.pkl")
    joblib.dump(vectorizer, MODEL_DIR / "tfidf_vectorizer_v2.pkl")
    
    # Also update primary artifacts for backward compatibility
    joblib.dump(best_model, MODEL_DIR / "logistic_model.pkl")
    joblib.dump(vectorizer, MODEL_DIR / "tfidf_vectorizer.pkl")

    print(f"\nBest model ({best_name}) and vectorizer saved to {MODEL_DIR}")


if __name__ == "__main__":
    train_model()
