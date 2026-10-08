// ALL VALUES BELOW ARE SYNTHETIC DEMO VALUES — no model has been trained in this prototype.
// Magnitudes are chosen to be plausible for the UCI Diabetes 130-US dataset
// (published <30-day readmission AUCs are typically ~0.62–0.70).

export const overview = {
  totalEncounters: 101766,
  highRisk: 16225,
  predictedReadmissions: 11357,
  avgRisk: 0.112,
  auc: 0.661,
  recall: 0.641,
  disparity: 0.0,
};

export const riskDistribution = [
  { tier: "Low", count: 32146 },
  { tier: "Medium", count: 53395 },
  { tier: "High", count: 16225 },
];

export const trend = [
  { year: "1999", observed: 9.8, predicted: 10.4 },
  { year: "2000", observed: 10.3, predicted: 10.6 },
  { year: "2001", observed: 10.9, predicted: 10.8 },
  { year: "2002", observed: 11.0, predicted: 11.1 },
  { year: "2003", observed: 11.4, predicted: 11.3 },
  { year: "2004", observed: 11.7, predicted: 11.5 },
  { year: "2005", observed: 11.3, predicted: 11.6 },
  { year: "2006", observed: 11.6, predicted: 11.4 },
  { year: "2007", observed: 11.2, predicted: 11.3 },
  { year: "2008", observed: 11.1, predicted: 11.2 },
];

export const riskByAge = [
  { group: "<30", risk: 8.4 }, { group: "30–49", risk: 10.1 }, { group: "50–69", risk: 11.2 }, { group: "70+", risk: 12.6 },
];

export const riskByAdmission = [
  { type: "Emergency", risk: 12.3 }, { type: "Urgent", risk: 11.4 }, { type: "Elective", risk: 9.6 }, { type: "Other", risk: 10.2 },
];

export const topFactors = [
  { feature: "Prior inpatient visits", importance: 0.21 },
  { feature: "Discharge disposition", importance: 0.13 },
  { feature: "Number of diagnoses", importance: 0.1 },
  { feature: "Prior emergency visits", importance: 0.09 },
  { feature: "Number of medications", importance: 0.08 },
  { feature: "Time in hospital", importance: 0.07 },
  { feature: "Age group", importance: 0.06 },
  { feature: "Insulin change", importance: 0.05 },
];

export type ModelRow = {
  id: number; name: string; family: "Linear" | "Tree" | "Boosting" | "Ensemble" | "Other";
  accuracy: number; precision: number; recall: number; auc: number; trainSec: number; selected?: boolean; note?: string;
};

export const models: ModelRow[] = [
  { id: 1, name: "Logistic Regression", family: "Linear", accuracy: 0.591, precision: 0.156, recall: 0.641, auc: 0.661, trainSec: 1.4, selected: true, note: "Selected for transparent probability and feature contributions." },
  { id: 2, name: "Random Forest", family: "Tree", accuracy: 0.542, precision: 0.150, recall: 0.707, auc: 0.666, trainSec: 18.5, note: "Higher recall/AUC comparator; less transparent." },
];

export type GroupRow = { group: string; n: number; selection: number; tpr: number; fpr: number; precision: number; auc: number };

export const fairness = {
  age: [
    { group: "<30", n: 2509, selection: 0.27, tpr: 0.64, fpr: 0.25, precision: 0.17, auc: 0.67 },
    { group: "30–49", n: 13556, selection: 0.31, tpr: 0.69, fpr: 0.29, precision: 0.19, auc: 0.68 },
    { group: "50–69", n: 39906, selection: 0.34, tpr: 0.71, fpr: 0.32, precision: 0.21, auc: 0.69 },
    { group: "70+", n: 45795, selection: 0.37, tpr: 0.73, fpr: 0.34, precision: 0.21, auc: 0.68 },
  ] as GroupRow[],
  gender: [
    { group: "Female", n: 54708, selection: 0.35, tpr: 0.72, fpr: 0.32, precision: 0.21, auc: 0.69 },
    { group: "Male", n: 47055, selection: 0.33, tpr: 0.7, fpr: 0.31, precision: 0.2, auc: 0.68 },
    { group: "Unknown", n: 3, selection: 0, tpr: 0, fpr: 0, precision: 0, auc: 0, },
  ] as GroupRow[],
  race: [
    { group: "Caucasian", n: 76099, selection: 0.35, tpr: 0.72, fpr: 0.32, precision: 0.21, auc: 0.69 },
    { group: "African American", n: 19210, selection: 0.34, tpr: 0.7, fpr: 0.31, precision: 0.2, auc: 0.68 },
    { group: "Asian", n: 641, selection: 0.26, tpr: 0.63, fpr: 0.24, precision: 0.18, auc: 0.66 },
    { group: "Hispanic", n: 2037, selection: 0.29, tpr: 0.65, fpr: 0.27, precision: 0.18, auc: 0.67 },
    { group: "Other", n: 1506, selection: 0.3, tpr: 0.66, fpr: 0.28, precision: 0.18, auc: 0.66 },
  ] as GroupRow[],
  summary: [
    { attribute: "Age", disparity: 0.1, eod: 0.09, status: "Review" },
    { attribute: "Gender", disparity: 0.02, eod: 0.02, status: "Acceptable" },
    { attribute: "Race", disparity: 0.09, eod: 0.09, status: "Needs review" },
  ],
  baseVsFair: [
    { metric: "AUC", base: 0.684, fair: 0.678 },
    { metric: "Recall", base: 0.71, fair: 0.7 },
    { metric: "Precision", base: 0.2, fair: 0.19 },
    { metric: "Race disparity", base: 0.09, fair: 0.04 },
    { metric: "Age disparity", base: 0.1, fair: 0.05 },
    { metric: "Equal opp. diff (race)", base: 0.09, fair: 0.03 },
  ],
};

// Dataset facts below reflect the published UCI dataset documentation
// (101,766 encounters, 50 attributes). Percentages of missingness are the
// commonly reported values; verify against the raw file during integration.
export const dataQuality = {
  rows: 101766, columns: 50, target: "readmitted (<30 vs. >30 / NO)",
  missing: [
    { column: "weight", pct: 96.9, action: "Dropped", why: "Almost entirely missing; imputation would be fabrication." },
    { column: "max_glu_serum", pct: 94.7, action: "Kept as 'Not measured' category", why: "Missingness is informative — the test was not ordered." },
    { column: "A1Cresult", pct: 83.3, action: "Kept as 'Not measured' category", why: "Whether A1C was tested is itself clinically meaningful." },
    { column: "medical_specialty", pct: 49.1, action: "'Unknown' category + top-N grouping", why: "Too common to drop; rare specialties grouped to 'Other'." },
    { column: "payer_code", pct: 39.6, action: "Dropped", why: "High missingness, administrative, fairness-sensitive proxy." },
    { column: "race", pct: 2.2, action: "'Unknown' category", why: "Retained for fairness auditing; not imputed." },
    { column: "diag_1/2/3", pct: 0.4, action: "'Missing' ICD group", why: "Low rate; mapped into ICD-9 chapter groups." },
    { column: "gender", pct: 0.003, action: "Rows with 'Unknown/Invalid' removed (3 rows)", why: "Negligible count, cannot support subgroup metrics." },
  ],
  outliers: [
    { feature: "number_outpatient / emergency / inpatient", rule: "Winsorize at 99th percentile", why: "Long right tail; extreme counts are real but unstable for linear models." },
    { feature: "num_medications", rule: "Keep; log-transform for linear models", why: "High counts plausible in complex patients — not data errors." },
    { feature: "time_in_hospital", rule: "Range 1–14 by design; no action", why: "Dataset is pre-filtered to 1–14 day stays." },
    { feature: "num_lab_procedures", rule: "Flag >3×IQR for review, not delete", why: "Clinically plausible; deletion would bias toward healthier patients." },
  ],
  engineered: [
    { name: "prior_utilization", formula: "inpatient + emergency + outpatient", why: "Single signal of recent healthcare use." },
    { name: "med_change_count", formula: "Σ(23 drug columns ∈ {Up, Down})", why: "Captures regimen instability." },
    { name: "diagnosis_burden", formula: "number_diagnoses + comorbidity flags", why: "Proxy for clinical complexity." },
    { name: "encounter_intensity", formula: "(labs + procedures + meds) / time_in_hospital", why: "Resource intensity per day." },
    { name: "emergency_utilizer", formula: "number_emergency ≥ 2", why: "Frequent ED use flag." },
    { name: "los_category", formula: "1–2 / 3–5 / 6–9 / 10–14 days", why: "Non-linear LOS effect for linear models." },
    { name: "icd_groups", formula: "diag_1..3 → circulatory, respiratory, diabetes, renal…", why: "Reduces 700+ ICD codes to interpretable chapters." },
  ],
  excluded: [
    { feature: "encounter_id", why: "Identifier — no predictive meaning." },
    { feature: "patient_nbr", why: "Identifier; used only for group-aware train/test split to prevent patient leakage." },
    { feature: "weight", why: "96.9% missing." },
    { feature: "payer_code", why: "High missingness; socioeconomic proxy with fairness risk." },
    { feature: "examide, citoglipton", why: "Zero variance (single value across all rows)." },
    { feature: "Encounters with discharge to hospice / expired", why: "Patient cannot be readmitted — would distort the target." },
  ],
  encoding: [
    "One-hot encoding for nominal features (admission type, discharge disposition, specialty groups)",
    "Ordinal encoding for age brackets and drug dosage changes (No < Steady < Down/Up flags)",
    "Binary target: readmitted '<30' = 1, '>30' and 'NO' = 0",
    "Standard scaling for linear / distance-based models only",
  ],
};
