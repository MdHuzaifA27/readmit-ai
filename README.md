# ReadmitAI

ReadmitAI is a Lovable/TanStack Start frontend for **30-day hospital readmission risk analysis** using the UCI Diabetes 130-US hospitals dataset, paired with a Python/FastAPI machine-learning service.

## What is now implemented

- Real UCI dataset included under `backend/data/diabetic_data.csv`
- Binary target: `readmitted == "<30"`
- Patient-grouped 80/20 hold-out split using `patient_nbr` to prevent patient leakage
- Logistic Regression selected for transparent individual feature contributions
- Random Forest trained as a comparator
- Real model artifact: `backend/model.joblib`
- Real evaluation: `backend/metrics.json`
- Real subgroup snapshot: `backend/fairness.json`
- Real missingness/exclusion analysis: `backend/data_quality.json`
- FastAPI endpoints for prediction, metrics, model comparison, fairness and data quality
- Frontend Patient Risk page connected to the real API when configured
- Explainability factors derived from the trained logistic coefficients
- Prototype risk bands: Low <8%, Medium 8–<15%, High >=15%

## Run the ML backend

From `backend/`:

```bash
python -m pip install -r requirements.txt
python train_model.py
python -m uvicorn main:app --reload --port 8000
```

The supplied project already contains trained artifacts, so retraining is optional unless you change the preprocessing/model.

## Run the frontend

From the project root:

```bash
npm install
```

Create `.env.local` from `.env.example`:

```env
VITE_READMIT_API_URL=http://localhost:8000
```

Then:

```bash
npm run dev
```

## Important model notes

The current model is an academic/research prototype, not a clinically validated decision-support system. The probability bands and intervention recommendations must not be used for real patient care without independent clinical validation, calibration, prospective evaluation, and appropriate governance.

The current compact model deliberately excludes identifiers, `weight` (96.9% missing), `payer_code`, `medical_specialty`, and raw ICD-9 diagnosis strings. `A1Cresult` and `max_glu_serum` retain a not-measured category because missingness can itself carry information.
