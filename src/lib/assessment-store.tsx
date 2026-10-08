import { createContext, useContext, useState, type ReactNode } from "react";
import { defaultPatient, demoPatients, scorePatient, type Patient, type Prediction } from "./model";
import { predict } from "./api";

type Ctx = {
  patient: Patient;
  setPatient: (p: Patient) => void;
  prediction: Prediction;
  assessed: boolean;
  loading: boolean;
  assess: () => Promise<void>;
  loadDemo: (id: string) => void;
  reset: () => void;
  patientLabel: string;
};

const AssessmentContext = createContext<Ctx | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const high = demoPatients[2]!;
  const [patient, setPatientState] = useState<Patient>(high.patient);
  const [prediction, setPrediction] = useState<Prediction>(() => scorePatient(high.patient));
  const [assessed, setAssessed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [patientLabel, setLabel] = useState(high.name);

  const setPatient = (p: Patient) => { setPatientState(p); setAssessed(false); setLabel("Custom encounter"); };
  const assess = async () => {
    setLoading(true);
    try { setPrediction(await predict(patient)); setAssessed(true); } finally { setLoading(false); }
  };
  const loadDemo = (id: string) => {
    const d = demoPatients.find((x) => x.id === id);
    if (!d) return;
    setPatientState(d.patient); setLabel(d.name); setLoading(true);
    predict(d.patient).then((result) => { setPrediction(result); setAssessed(true); }).catch(() => {
      setPrediction(scorePatient(d.patient)); setAssessed(true);
    }).finally(() => setLoading(false));
  };
  const reset = () => { setPatientState(defaultPatient); setAssessed(false); setLabel("New encounter"); };

  return (
    <AssessmentContext.Provider value={{ patient, setPatient, prediction, assessed, loading, assess, loadDemo, reset, patientLabel }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const c = useContext(AssessmentContext);
  if (!c) throw new Error("useAssessment must be inside AssessmentProvider");
  return c;
}
