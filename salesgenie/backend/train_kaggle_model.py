import os
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, roc_auc_score

DATASET_PATH = "/run/media/askshubh/New Volume/Downloads/Brave/archive/Infosys internship/db for sales/Lead Scoring.csv"
MODEL_SAVE_PATH = os.path.join(os.path.dirname(__file__), "lead_scoring_model.pkl")

def train_and_save_model():
    if not os.path.exists(DATASET_PATH):
        print(f"Dataset not found at {DATASET_PATH}")
        return None

    print(f"Loading Kaggle Lead Scoring dataset from {DATASET_PATH}...")
    df = pd.read_csv(DATASET_PATH)

    # Clean numerical columns
    df['TotalVisits'] = df['TotalVisits'].fillna(0)
    df['Total Time Spent on Website'] = df['Total Time Spent on Website'].fillna(0)
    df['Page Views Per Visit'] = df['Page Views Per Visit'].fillna(0)

    # Feature mapping matching CRM features
    df['email_opens'] = df['Last Activity'].apply(
        lambda x: 1 if isinstance(x, str) and 'Email' in x else 0
    )
    df['demo_request'] = df['Last Activity'].apply(
        lambda x: 1 if isinstance(x, str) and ('Converted' in x or 'SMS' in x or 'Page' in x) else 0
    )

    X = df[['email_opens', 'TotalVisits', 'demo_request']]
    y = df['Converted']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred) * 100
    auc = roc_auc_score(y_test, y_prob)

    print(f"Training Complete! Accuracy: {acc:.2f}%, ROC-AUC: {auc:.4f}")

    with open(MODEL_SAVE_PATH, "wb") as f:
        pickle.dump(model, f)

    print(f"Model saved successfully to {MODEL_SAVE_PATH}")
    return model

if __name__ == "__main__":
    train_and_save_model()
