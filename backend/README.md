# ReadmitAI ML backend

FastAPI service for the ReadmitAI frontend.

## Dataset

Place `diabetic_data.csv` in `backend/data/` from the UCI Diabetes 130-US hospitals dataset (1999–2008).
The supplied project already contains this file.

## Target

Binary target: `readmitted == "<30"` (readmission within 30 days).
`>30` and `NO` are treated as the negative class.

## Preprocessing

- `?` is treated as missing.
- Numeric features: median imputation + standardisation.
- Categorical features: most-frequent imputation + one-hot encoding.
- `A1Cresult` and `max_glu_serum` retain a `None`/not-measured category.
- `patient_nbr` is used only to group the train/test split and is never a predictor.
- Identifiers, very-high-missingness administrative fields and raw ICD-9 strings are excluded from this compact prototype feature set.

## Train

```bash
python train_model.py
```

This creates `model.joblib`, `metrics.json`, `fairness.json`, and `data_quality.json`.
The split is patient-grouped 80/20 with `random_state=42`.

## Run API

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Health check: `GET /health`
Prediction: `POST /predict`
Model comparison: `GET /models`
Metrics: `GET /metrics`
Data quality: `GET /data-quality`
Fairness snapshot: `GET /fairness`

## Important

This is a research/academic prototype, not a clinically validated decision-support system. The probability bands and intervention suggestions must not be used for real patient care without independent clinical validation, calibration, governance and prospective evaluation.
