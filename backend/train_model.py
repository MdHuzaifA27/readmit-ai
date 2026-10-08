"""Train ReadmitAI on the UCI Diabetes 130-US hospitals dataset.

Target: readmitted == '<30'.
Split: patient-grouped 80/20 hold-out using patient_nbr to prevent the same
patient from appearing in both train and test.
"""
from pathlib import Path
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "diabetic_data.csv"
FEATURES = ["age","gender","race","admission_type_id","discharge_disposition_id","admission_source_id","time_in_hospital","num_lab_procedures","num_procedures","num_medications","number_outpatient","number_emergency","number_inpatient","number_diagnoses","max_glu_serum","A1Cresult","change","diabetesMed","insulin"]
CATEGORICAL = ["age","gender","race","admission_type_id","discharge_disposition_id","admission_source_id","max_glu_serum","A1Cresult","change","diabetesMed","insulin"]
NUMERIC = [c for c in FEATURES if c not in CATEGORICAL]


def preprocessor():
    return ColumnTransformer([
        ("num", Pipeline([( "impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), NUMERIC),
        ("cat", Pipeline([( "impute", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore"))]), CATEGORICAL),
    ])


def score(y_true, probability, threshold=0.10):
    pred = (probability >= threshold).astype(int)
    return {
        "accuracy": float(accuracy_score(y_true, pred)),
        "precision": float(precision_score(y_true, pred, zero_division=0)),
        "recall": float(recall_score(y_true, pred, zero_division=0)),
        "f1": float(f1_score(y_true, pred, zero_division=0)),
        "auc": float(roc_auc_score(y_true, probability)),
        "confusion_matrix": confusion_matrix(y_true, pred).tolist(),
    }


def main():
    if not DATA.exists():
        raise SystemExit(f"Missing {DATA}")
    raw = pd.read_csv(DATA).replace("?", np.nan)
    y = (raw["readmitted"].astype(str).str.strip() == "<30").astype(int)
    X = raw[FEATURES]
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_idx, test_idx = next(splitter.split(X, y, groups=raw["patient_nbr"]))
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    candidates = {
        "Logistic Regression": LogisticRegression(max_iter=1200, solver="liblinear"),
        "Random Forest": RandomForestClassifier(n_estimators=250, max_depth=16, min_samples_leaf=4, n_jobs=-1, random_state=42),
    }
    trained = {}
    for name, estimator in candidates.items():
        pipe = Pipeline([("preprocess", preprocessor()), ("model", estimator)])
        pipe.fit(X_train, y_train)
        probability = pipe.predict_proba(X_test)[:, 1]
        trained[name] = (pipe, probability)

    selected = "Logistic Regression"
    selected_pipe, selected_probability = trained[selected]
    threshold = 0.10
    selected_score = score(y_test, selected_probability, threshold)
    comparison = [{"model": name, **score(y_test, prob, threshold)} for name, (_, prob) in trained.items()]

    metrics = {
        "dataset": "UCI Diabetes 130-US hospitals for years 1999-2008",
        "target": "<30-day readmission (readmitted == '<30')",
        "n_samples": int(len(raw)),
        "positive_count": int(y.sum()),
        "positive_rate": float(y.mean()),
        "features_used": FEATURES,
        "categorical_features": CATEGORICAL,
        "numeric_features": NUMERIC,
        "threshold": threshold,
        **selected_score,
        "split": "80/20 patient-grouped hold-out; patient_nbr groups kept entirely within train or test",
        "random_state": 42,
        "selected_model": selected,
        "selection_rationale": "Transparent feature contributions and probability output; Random Forest retained as a performance comparator.",
        "risk_bands": {"low": "< 8%", "medium": "8% to <15%", "high": ">= 15%"},
        "clinical_note": "Prototype/research model only; risk bands are not clinically validated thresholds.",
        "comparison": comparison,
    }
    joblib.dump(selected_pipe, ROOT / "model.joblib", compress=3)
    (ROOT / "metrics.json").write_text(json.dumps(metrics, indent=2))

    # Fairness snapshot at the 10% operating threshold.
    test = raw.iloc[test_idx][["gender", "race", "age"]].copy()
    test["target"] = y.iloc[test_idx].to_numpy()
    test["probability"] = selected_probability
    test["prediction"] = (selected_probability >= threshold).astype(int)
    fairness = []
    for feature in ["gender", "race", "age"]:
        for group, frame in test.groupby(feature, dropna=False):
            fairness.append({
                "feature": feature, "group": str(group), "n": int(len(frame)),
                "positive_rate": float(frame["target"].mean()),
                "selection_rate": float(frame["prediction"].mean()),
                "recall": float(recall_score(frame["target"], frame["prediction"], zero_division=0)) if frame["target"].sum() else None,
                "fpr": float(((frame["prediction"] == 1) & (frame["target"] == 0)).sum() / max((frame["target"] == 0).sum(), 1)),
                "precision": float(precision_score(frame["target"], frame["prediction"], zero_division=0)),
                "auc": float(roc_auc_score(frame["target"], frame["probability"])) if frame["target"].nunique() == 2 else None,
                "mean_predicted_probability": float(frame["probability"].mean()),
            })
    (ROOT / "fairness.json").write_text(json.dumps(fairness, indent=2))

    missing = (raw.isna().mean() * 100).sort_values(ascending=False).round(2)
    quality = {
        "rows": int(raw.shape[0]), "columns": int(raw.shape[1]),
        "target_distribution": {str(k): int(v) for k, v in raw["readmitted"].value_counts().items()},
        "duplicates": int(raw.duplicated().sum()),
        "missing": [{"feature": str(k), "missingRate": float(v)} for k, v in missing.head(15).items()],
        "exclusions": [
            {"feature": "encounter_id", "why": "Identifier; no clinical signal and risks memorisation."},
            {"feature": "patient_nbr", "why": "Identifier used only for patient-grouped splitting, never as a predictor."},
            {"feature": "weight", "why": "96.9% missing; imputation would be unreliable."},
            {"feature": "payer_code", "why": "39.6% missing and administrative/proxy-like; excluded from the prototype."},
            {"feature": "medical_specialty", "why": "49.1% missing and high-cardinality; excluded from the compact prototype feature set."},
            {"feature": "diag_1/diag_2/diag_3", "why": "Raw ICD-9 strings are high-cardinality; diagnosis complexity is represented by number_diagnoses in this version."},
        ],
        "retained_missingness": [
            {"feature": "A1Cresult", "why": "Missingness represented as 'None' because whether the test was ordered may carry information."},
            {"feature": "max_glu_serum", "why": "Missingness represented as 'None' for the same reason."},
        ],
    }
    (ROOT / "data_quality.json").write_text(json.dumps(quality, indent=2))
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
