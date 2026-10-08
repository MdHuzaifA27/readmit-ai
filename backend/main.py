from __future__ import annotations

from pathlib import Path
from typing import Any
import json
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "diabetic_data.csv"
ARTIFACT = ROOT / "model.joblib"
METRICS = ROOT / "metrics.json"
FAIRNESS = ROOT / "fairness.json"
QUALITY = ROOT / "data_quality.json"

app = FastAPI(title="ReadmitAI API", version="1.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

FEATURES = [
    "age", "gender", "race", "admission_type_id", "discharge_disposition_id", "admission_source_id",
    "time_in_hospital", "num_lab_procedures", "num_procedures", "num_medications",
    "number_outpatient", "number_emergency", "number_inpatient", "number_diagnoses",
    "max_glu_serum", "A1Cresult", "change", "diabetesMed", "insulin",
]
CATEGORICAL = [
    "age", "gender", "race", "admission_type_id", "discharge_disposition_id", "admission_source_id",
    "max_glu_serum", "A1Cresult", "change", "diabetesMed", "insulin",
]

class Patient(BaseModel):
    model_config = ConfigDict(extra="ignore")
    age: str
    gender: str
    race: str
    admissionType: str
    dischargeDisposition: str
    specialty: str = "Other"
    numberInpatient: int = 0
    numberEmergency: int = 0
    numberOutpatient: int = 0
    numberDiagnoses: int = 1
    numProcedures: int = 0
    priorReadmissions: int = 0
    numMedications: int = 1
    medChange: bool = False
    diabetesMed: bool = False
    insulin: str = "No"
    a1c: str = "None"
    glucose: str = "None"
    comorbidHeart: bool = False
    comorbidRenal: bool = False
    comorbidCirculatory: bool = False
    timeInHospital: int = 1
    numLabProcedures: int = 1
    priorEncounters: int = 0
    recentFollowUp: bool = False


def load_artifacts():
    if not ARTIFACT.exists() or not METRICS.exists():
        raise FileNotFoundError("Trained model artifacts are missing. Run `python train_model.py` first.")
    return joblib.load(ARTIFACT), json.loads(METRICS.read_text())


def frontend_row(p: Patient) -> pd.DataFrame:
    admission_map = {"Emergency": 1, "Urgent": 2, "Elective": 3, "Other": 4}
    discharge_map = {"Home": 1, "Home with health service": 6, "SNF / Rehab": 3, "Transferred": 2, "AMA": 7}
    return pd.DataFrame([{
        "age": p.age,
        "gender": p.gender,
        "race": p.race,
        "admission_type_id": admission_map.get(p.admissionType, 4),
        "discharge_disposition_id": discharge_map.get(p.dischargeDisposition, 1),
        "admission_source_id": 7,
        "time_in_hospital": p.timeInHospital,
        "num_lab_procedures": p.numLabProcedures,
        "num_procedures": p.numProcedures,
        "num_medications": p.numMedications,
        "number_outpatient": p.numberOutpatient,
        "number_emergency": p.numberEmergency,
        "number_inpatient": p.numberInpatient,
        "number_diagnoses": p.numberDiagnoses,
        "A1Cresult": p.a1c,
        "max_glu_serum": p.glucose,
        "change": "Ch" if p.medChange else "No",
        "diabetesMed": "Yes" if p.diabetesMed else "No",
        "insulin": p.insulin,
    }])


def tier(probability: float) -> str:
    # Prototype risk bands chosen from the model's operating characteristics.
    # They are not clinically validated thresholds.
    if probability >= 0.15:
        return "High"
    if probability >= 0.08:
        return "Medium"
    return "Low"


def readable_feature(name: str) -> tuple[str, str]:
    clean = name.replace("num__", "").replace("cat__", "")
    numeric_labels = {
        "number_inpatient": "Previous inpatient visits", "number_emergency": "Previous emergency visits",
        "number_outpatient": "Previous outpatient visits", "number_diagnoses": "Number of diagnoses",
        "num_medications": "Number of medications", "num_procedures": "Number of procedures",
        "num_lab_procedures": "Lab procedures", "time_in_hospital": "Time in hospital",
    }
    categorical_labels = {
        "age": "Age group", "gender": "Gender", "race": "Race", "admission_type_id": "Admission type",
        "discharge_disposition_id": "Discharge disposition", "admission_source_id": "Admission source",
        "max_glu_serum": "Max glucose serum", "A1Cresult": "A1C result", "change": "Medication change",
        "diabetesMed": "Diabetes medication", "insulin": "Insulin",
    }
    for base, label in categorical_labels.items():
        prefix = f"{base}_"
        if clean.startswith(prefix):
            value = clean[len(prefix):]
            return label, f"{label}: {value}"
    if clean in numeric_labels:
        return numeric_labels[clean], "Continuous feature contribution"
    return clean.replace("_", " ").title(), "Model feature contribution"

@app.get("/health")
def health():
    return {"status": "ok", "model_ready": ARTIFACT.exists() and METRICS.exists(), "dataset_present": DATA.exists(), "version": "1.1.0"}

@app.post("/predict")
def predict(p: Patient):
    try:
        model, metrics = load_artifacts()
        X = frontend_row(p)
        probability = float(model.predict_proba(X)[0, 1])
        t = tier(probability)

        Xt = model.named_steps["preprocess"].transform(X)
        if hasattr(Xt, "toarray"):
            Xt = Xt.toarray()
        coef = model.named_steps["model"].coef_[0]
        contributions = np.asarray(Xt * coef).ravel()
        names = model.named_steps["preprocess"].get_feature_names_out()
        order = np.argsort(np.abs(contributions))[::-1]
        factors = []
        for i in order:
            if abs(float(contributions[i])) < 0.01:
                continue
            label, detail = readable_feature(names[i])
            factors.append({
                "key": names[i],
                "label": label,
                "impact": float(contributions[i]),
                "detail": detail,
            })
            if len(factors) == 8:
                break

        return {
            "probability": probability,
            "tier": t,
            "readiness": "Needs intervention" if t == "High" else "Ready with support" if t == "Medium" else "Ready for discharge",
            "priority": "Urgent follow-up" if t == "High" else "Standard follow-up" if t == "Medium" else "Routine follow-up",
            "followUpWindow": "Within 48–72 hours" if t == "High" else "Within 7 days" if t == "Medium" else "Within 14–30 days",
            "factors": factors,
            "baseRate": float(metrics["positive_rate"]),
            "modelVersion": "UCI-logistic-regression-1.1",
            "target": "<30-day readmission",
            "thresholds": {"medium": 0.08, "high": 0.15},
            "prototype": True,
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

@app.get("/models")
def models():
    try:
        metrics = json.loads(METRICS.read_text())
        rows = []
        for idx, row in enumerate(metrics.get("comparison", []), 1):
            rows.append({"id": idx, **row, "selected": row["model"] == metrics["selected_model"]})
        return {"selected": metrics["selected_model"], "threshold": metrics["threshold"], "rows": rows, "split": metrics["split"]}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

@app.get("/metrics")
def metrics():
    try:
        return json.loads(METRICS.read_text())
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

@app.get("/data-quality")
def data_quality():
    if QUALITY.exists():
        return json.loads(QUALITY.read_text())
    raise HTTPException(status_code=503, detail="Data-quality artifact not found")

@app.get("/fairness")
def fairness():
    if FAIRNESS.exists():
        return {"threshold": 0.10, "groups": json.loads(FAIRNESS.read_text())}
    raise HTTPException(status_code=503, detail="Fairness artifact not found")
