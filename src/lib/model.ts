// Fallback scoring engine used only when the Python API is not configured.
// The real application uses POST /predict with the trained UCI model.

export type Patient = {
  age: string; // UCI age bracket e.g. "[70-80)"
  gender: "Female" | "Male" | "Unknown/Invalid";
  race: "Caucasian" | "AfricanAmerican" | "Asian" | "Hispanic" | "Other";
  admissionType: "Emergency" | "Urgent" | "Elective" | "Other";
  dischargeDisposition: "Home" | "Home with health service" | "SNF / Rehab" | "Transferred" | "AMA";
  specialty: "InternalMedicine" | "Cardiology" | "Surgery" | "Family/GeneralPractice" | "Nephrology" | "Emergency/Trauma" | "Other";
  numberInpatient: number;
  numberEmergency: number;
  numberOutpatient: number;
  numberDiagnoses: number;
  numProcedures: number;
  priorReadmissions: number;
  numMedications: number;
  medChange: boolean;
  diabetesMed: boolean;
  insulin: "No" | "Steady" | "Up" | "Down";
  a1c: "None" | "Norm" | ">7" | ">8";
  glucose: "None" | "Norm" | ">200" | ">300";
  comorbidHeart: boolean;
  comorbidRenal: boolean;
  comorbidCirculatory: boolean;
  timeInHospital: number;
  numLabProcedures: number;
  priorEncounters: number;
  recentFollowUp: boolean;
};

export type Tier = "Low" | "Medium" | "High";
export type Factor = { key: string; label: string; impact: number; detail: string };
export type Prediction = {
  probability: number;
  tier: Tier;
  readiness: "Ready for discharge" | "Ready with support" | "Needs intervention";
  priority: "Routine follow-up" | "Standard follow-up" | "Urgent follow-up";
  followUpWindow: string;
  factors: Factor[]; // positive impact = risk-increasing (percentage points)
  baseRate: number;
  modelVersion: string;
};

export const AGE_BRACKETS = ["[0-10)", "[10-20)", "[20-30)", "[30-40)", "[40-50)", "[50-60)", "[60-70)", "[70-80)", "[80-90)", "[90-100)"];

export const defaultPatient: Patient = {
  age: "[60-70)", gender: "Female", race: "Caucasian", admissionType: "Emergency",
  dischargeDisposition: "Home", specialty: "InternalMedicine",
  numberInpatient: 0, numberEmergency: 0, numberOutpatient: 0, numberDiagnoses: 7,
  numProcedures: 1, priorReadmissions: 0, numMedications: 15, medChange: false,
  diabetesMed: true, insulin: "Steady", a1c: "None", glucose: "None",
  comorbidHeart: false, comorbidRenal: false, comorbidCirculatory: false,
  timeInHospital: 4, numLabProcedures: 43, priorEncounters: 1, recentFollowUp: false,
};

export const demoPatients: { id: string; name: string; summary: string; patient: Patient }[] = [
  {
    id: "low", name: "Demo A · Low risk", summary: "52 y/o, elective, stable meds",
    patient: { ...defaultPatient, age: "[50-60)", gender: "Male", admissionType: "Elective", specialty: "Surgery",
      numberDiagnoses: 4, numMedications: 9, numberOutpatient: 2, timeInHospital: 2, numLabProcedures: 28,
      insulin: "No", a1c: "Norm", priorEncounters: 0, recentFollowUp: true },
  },
  {
    id: "medium", name: "Demo B · Medium risk", summary: "68 y/o, 1 prior admit, insulin change",
    patient: { ...defaultPatient, age: "[60-70)", numberInpatient: 1, numberEmergency: 1, numberDiagnoses: 8,
      numMedications: 18, medChange: true, insulin: "Up", a1c: ">7", timeInHospital: 5, numLabProcedures: 52,
      comorbidCirculatory: true, priorEncounters: 2, dischargeDisposition: "Home with health service" },
  },
  {
    id: "high", name: "Demo C · High risk", summary: "78 y/o, 4 prior admits, renal + cardiac",
    patient: { ...defaultPatient, age: "[70-80)", race: "AfricanAmerican", numberInpatient: 4, numberEmergency: 3,
      numberDiagnoses: 9, numProcedures: 2, priorReadmissions: 2, numMedications: 26, medChange: true, insulin: "Up",
      a1c: ">8", glucose: ">200", comorbidHeart: true, comorbidRenal: true, comorbidCirculatory: true,
      timeInHospital: 9, numLabProcedures: 71, priorEncounters: 6, dischargeDisposition: "SNF / Rehab",
      specialty: "Nephrology" },
  },
];

const INTERCEPT = -2.07; // ~11% base rate (UCI <30-day readmission rate ≈ 11.2%)
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

function terms(p: Patient): { key: string; label: string; z: number; detail: string }[] {
  const ageIdx = AGE_BRACKETS.indexOf(p.age);
  const t = [
    { key: "inpatient", label: "Previous inpatient visits", z: 0.32 * Math.min(p.numberInpatient, 8), detail: `${p.numberInpatient} inpatient visit(s) in prior year` },
    { key: "readmit", label: "Previous readmissions", z: 0.28 * Math.min(p.priorReadmissions, 5), detail: `${p.priorReadmissions} prior readmission(s)` },
    { key: "emergency", label: "Previous emergency visits", z: 0.18 * Math.min(p.numberEmergency, 8), detail: `${p.numberEmergency} ED visit(s)` },
    { key: "diagnoses", label: "Diagnosis burden", z: 0.09 * (p.numberDiagnoses - 7), detail: `${p.numberDiagnoses} coded diagnoses (cohort median 8)` },
    { key: "los", label: "Length of stay", z: 0.06 * (p.timeInHospital - 4), detail: `${p.timeInHospital} days (cohort median 4)` },
    { key: "meds", label: "Polypharmacy", z: 0.025 * (p.numMedications - 15), detail: `${p.numMedications} active medications` },
    { key: "medchange", label: "Medication changes", z: p.medChange ? 0.22 : -0.08, detail: p.medChange ? "Regimen changed this encounter" : "Stable medication regimen" },
    { key: "insulin", label: "Insulin adjustment", z: p.insulin === "Up" || p.insulin === "Down" ? 0.18 : 0, detail: `Insulin: ${p.insulin}` },
    { key: "a1c", label: "HbA1c result", z: p.a1c === ">8" ? 0.15 : p.a1c === "Norm" ? -0.1 : 0, detail: `A1C: ${p.a1c === "None" ? "not measured" : p.a1c}` },
    { key: "glucose", label: "Max glucose serum", z: p.glucose === ">300" ? 0.18 : p.glucose === ">200" ? 0.1 : 0, detail: `Glucose: ${p.glucose === "None" ? "not measured" : p.glucose}` },
    { key: "comorb", label: "Comorbidities", z: (p.comorbidHeart ? 0.14 : 0) + (p.comorbidRenal ? 0.2 : 0) + (p.comorbidCirculatory ? 0.08 : 0), detail: [p.comorbidHeart && "heart failure", p.comorbidRenal && "renal disease", p.comorbidCirculatory && "circulatory"].filter(Boolean).join(", ") || "None flagged" },
    { key: "age", label: "Age group", z: 0.06 * (ageIdx - 6), detail: `Age ${p.age.replace(/[\[\)]/g, "")}` },
    { key: "discharge", label: "Discharge disposition", z: ({ Home: -0.05, "Home with health service": 0.1, "SNF / Rehab": 0.3, Transferred: 0.2, AMA: 0.45 } as const)[p.dischargeDisposition], detail: p.dischargeDisposition },
    { key: "admission", label: "Admission type", z: p.admissionType === "Elective" ? -0.15 : p.admissionType === "Emergency" ? 0.05 : 0, detail: p.admissionType },
    { key: "outpatient", label: "Outpatient engagement", z: -0.08 * Math.min(p.numberOutpatient, 5), detail: `${p.numberOutpatient} outpatient visit(s)` },
    { key: "followup", label: "Recent outpatient follow-up", z: p.recentFollowUp ? -0.3 : 0, detail: p.recentFollowUp ? "Follow-up within 30 days pre-admission" : "No recent follow-up" },
    { key: "labs", label: "Lab procedure intensity", z: 0.004 * (p.numLabProcedures - 43), detail: `${p.numLabProcedures} lab procedures` },
  ];
  return t.filter((x) => Math.abs(x.z) > 0.001);
}

export function scorePatient(p: Patient): Prediction {
  const ts = terms(p);
  const z = INTERCEPT + 0.75 * ts.reduce((s, t) => s + t.z, 0);
  const probability = sigmoid(z);
  const baseRate = sigmoid(INTERCEPT);
  const totalZ = ts.reduce((s, t) => s + t.z, 0) || 1;
  const delta = probability - baseRate;
  // Distribute probability delta proportionally to log-odds contributions (SHAP-style approximation)
  const factors = ts
    .map((t) => ({ key: t.key, label: t.label, detail: t.detail, impact: Math.abs(totalZ) < 0.01 ? t.z * 0.1 : (t.z / totalZ) * delta }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const tier: Tier = probability >= 0.15 ? "High" : probability >= 0.08 ? "Medium" : "Low";
  return {
    probability, tier, factors, baseRate, modelVersion: "demo-fallback (API not configured)",
    readiness: tier === "High" ? "Needs intervention" : tier === "Medium" ? "Ready with support" : "Ready for discharge",
    priority: tier === "High" ? "Urgent follow-up" : tier === "Medium" ? "Standard follow-up" : "Routine follow-up",
    followUpWindow: tier === "High" ? "Within 48–72 hours" : tier === "Medium" ? "Within 7 days" : "Within 14–30 days",
  };
}

export type Intervention = { action: string; reason: string; owner: string };
export function interventionsFor(pred: Prediction, p: Patient): Intervention[] {
  const list: Intervention[] = [];
  const has = (k: string) => pred.factors.some((f) => f.key === k && f.impact > 0.005);
  if (pred.tier !== "Low" || p.medChange) list.push({ action: "Medication reconciliation", reason: p.medChange ? "Regimen changed during encounter" : `${p.numMedications} active medications`, owner: "Pharmacist" });
  list.push({ action: pred.tier === "High" ? "Schedule follow-up appointment before discharge" : "Schedule follow-up appointment", reason: `Target window: ${pred.followUpWindow.toLowerCase()}`, owner: "Discharge planner" });
  if (p.insulin !== "No" || p.a1c === ">8" || p.a1c === ">7") list.push({ action: "Diabetes self-management education", reason: `Insulin ${p.insulin.toLowerCase()}, A1C ${p.a1c}`, owner: "Diabetes educator" });
  if (pred.tier === "High") list.push({ action: "Post-discharge phone call (48h)", reason: "High predicted readmission probability", owner: "Care coordinator" });
  if (pred.tier !== "Low") list.push({ action: "Teach-back review of discharge instructions", reason: "Supports understanding of care plan", owner: "Nurse" });
  if (pred.tier === "High" || has("discharge")) list.push({ action: "Assess social / support needs", reason: `Disposition: ${p.dischargeDisposition}`, owner: "Social work" });
  if (p.comorbidRenal || p.comorbidHeart) list.push({ action: "Specialist coordination", reason: [p.comorbidHeart && "Heart failure", p.comorbidRenal && "Renal disease"].filter(Boolean).join(" + "), owner: "Attending physician" });
  return list;
}
