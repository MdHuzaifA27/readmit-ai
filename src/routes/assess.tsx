import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Loader2, RotateCcw, UserRound, History, Pill, SlidersHorizontal, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssessment } from "@/lib/assessment-store";
import { AGE_BRACKETS, demoPatients, type Patient } from "@/lib/model";
import { Card, DemoTag, PageHeader, RiskBadge, RiskGauge, InfoTip } from "@/components/readmit/ui";
import { FactorList, InterventionPanel } from "@/components/readmit/clinical";

export const Route = createFileRoute("/assess")({
  head: () => ({
    meta: [
      { title: "Patient Risk Assessment — ReadmitAI" },
      { name: "description", content: "Enter encounter details and get a demo readmission probability, risk tier, discharge readiness and intervention plan." },
      { property: "og:title", content: "Patient Risk Assessment — ReadmitAI" },
      { property: "og:description", content: "Interactive demo readmission risk scoring for a single patient encounter." },
    ],
  }),
  component: AssessPage,
});

function Field({ label, tip, children }: { label: string; tip?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">{label}{tip && <InfoTip text={tip} />}</span>
      {children}
    </label>
  );
}
function Select<T extends string>({ value, options, onChange }: { value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return <select className="field" value={value} onChange={(e) => onChange(e.target.value as T)}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
}
function Stepper({ value, onChange, min = 0, max = 99 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="flex h-10 overflow-hidden rounded-md border border-input bg-card">
      <button type="button" onClick={() => set(value - 1)} className="w-9 text-muted-foreground hover:bg-muted">−</button>
      <input type="number" value={value} min={min} max={max} onChange={(e) => set(Number(e.target.value) || 0)} className="num w-full min-w-0 border-x border-input bg-transparent text-center text-sm outline-none" />
      <button type="button" onClick={() => set(value + 1)} className="w-9 text-muted-foreground hover:bg-muted">+</button>
    </div>
  );
}
function Range({ value, onChange, min, max, unit }: { value: number; onChange: (v: number) => void; min: number; max: number; unit?: string }) {
  return (
    <div className="flex items-center gap-3">
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
      <span className="num w-14 rounded-md bg-muted px-2 py-1 text-center text-xs font-semibold">{value}{unit}</span>
    </div>
  );
}
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={cn("flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm transition-colors", checked ? "border-primary/40 bg-info-soft text-foreground" : "border-input bg-card text-muted-foreground")}>
      {label}
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", checked ? "bg-primary" : "bg-border")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-all", checked ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}
function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="border-t pt-5 first:border-t-0 first:pt-0">
      <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{icon}{title}</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </div>
  );
}

function AssessPage() {
  const { patient, setPatient, prediction, assessed, loading, assess, loadDemo, reset } = useAssessment();
  const up = <K extends keyof Patient>(k: K) => (v: Patient[K]) => setPatient({ ...patient, [k]: v });

  return (
    <div>
      <PageHeader eyebrow="Step 1 · Patient → Risk" title="Patient risk assessment"
        description="Enter or load an encounter. The trained UCI model returns a readmission probability, risk tier, discharge readiness and recommended actions when the ML API is connected."
        actions={<DemoTag label="UCI trained model" />} />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">Load demo patient:</span>
        {demoPatients.map((d) => (
          <button key={d.id} onClick={() => loadDemo(d.id)} className="rounded-lg border bg-card px-3 py-1.5 text-left text-xs transition hover:border-primary/50 hover:bg-info-soft">
            <span className="block font-semibold">{d.name}</span><span className="text-muted-foreground">{d.summary}</span>
          </button>
        ))}
        <button onClick={reset} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"><RotateCcw className="h-3.5 w-3.5" />Reset patient</button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card className="space-y-5">
          <Section icon={<UserRound className="h-3.5 w-3.5" />} title="Patient information">
            <Field label="Age group"><Select value={patient.age} options={AGE_BRACKETS} onChange={up("age")} /></Field>
            <Field label="Gender"><Select value={patient.gender} options={["Female", "Male", "Unknown/Invalid"] as const} onChange={up("gender")} /></Field>
            <Field label="Race" tip="Used only for fairness auditing in the full design; retained here to mirror the dataset."><Select value={patient.race} options={["Caucasian", "AfricanAmerican", "Asian", "Hispanic", "Other"] as const} onChange={up("race")} /></Field>
            <Field label="Admission type"><Select value={patient.admissionType} options={["Emergency", "Urgent", "Elective", "Other"] as const} onChange={up("admissionType")} /></Field>
            <Field label="Discharge disposition"><Select value={patient.dischargeDisposition} options={["Home", "Home with health service", "SNF / Rehab", "Transferred", "AMA"] as const} onChange={up("dischargeDisposition")} /></Field>
            <Field label="Medical specialty"><Select value={patient.specialty} options={["InternalMedicine", "Cardiology", "Surgery", "Family/GeneralPractice", "Nephrology", "Emergency/Trauma", "Other"] as const} onChange={up("specialty")} /></Field>
          </Section>
          <Section icon={<History className="h-3.5 w-3.5" />} title="Encounter history (prior 12 months)">
            <Field label="Inpatient visits"><Stepper value={patient.numberInpatient} onChange={up("numberInpatient")} max={20} /></Field>
            <Field label="Emergency visits"><Stepper value={patient.numberEmergency} onChange={up("numberEmergency")} max={20} /></Field>
            <Field label="Outpatient visits"><Stepper value={patient.numberOutpatient} onChange={up("numberOutpatient")} max={40} /></Field>
            <Field label="Number of diagnoses" tip="UCI caps coded diagnoses at 16."><Stepper value={patient.numberDiagnoses} onChange={up("numberDiagnoses")} min={1} max={16} /></Field>
            <Field label="Number of procedures"><Stepper value={patient.numProcedures} onChange={up("numProcedures")} max={6} /></Field>
            <Field label="Previous readmissions"><Stepper value={patient.priorReadmissions} onChange={up("priorReadmissions")} max={10} /></Field>
          </Section>
          <Section icon={<Pill className="h-3.5 w-3.5" />} title="Clinical / medication">
            <Field label="Number of medications"><Range value={patient.numMedications} onChange={up("numMedications")} min={1} max={60} /></Field>
            <Field label="Insulin"><Select value={patient.insulin} options={["No", "Steady", "Up", "Down"] as const} onChange={up("insulin")} /></Field>
            <Field label="A1C result" tip="'None' = test not performed during encounter."><Select value={patient.a1c} options={["None", "Norm", ">7", ">8"] as const} onChange={up("a1c")} /></Field>
            <Field label="Max glucose serum"><Select value={patient.glucose} options={["None", "Norm", ">200", ">300"] as const} onChange={up("glucose")} /></Field>
            <Field label="Medication change"><Toggle checked={patient.medChange} onChange={up("medChange")} label="Changed" /></Field>
            <Field label="Diabetes medication"><Toggle checked={patient.diabetesMed} onChange={up("diabetesMed")} label="Prescribed" /></Field>
            <Field label="Comorbidity · Heart failure"><Toggle checked={patient.comorbidHeart} onChange={up("comorbidHeart")} label="Present" /></Field>
            <Field label="Comorbidity · Renal disease"><Toggle checked={patient.comorbidRenal} onChange={up("comorbidRenal")} label="Present" /></Field>
            <Field label="Comorbidity · Circulatory"><Toggle checked={patient.comorbidCirculatory} onChange={up("comorbidCirculatory")} label="Present" /></Field>
          </Section>
          <Section icon={<SlidersHorizontal className="h-3.5 w-3.5" />} title="Other features">
            <Field label="Time in hospital"><Range value={patient.timeInHospital} onChange={up("timeInHospital")} min={1} max={14} unit="d" /></Field>
            <Field label="Lab procedures"><Range value={patient.numLabProcedures} onChange={up("numLabProcedures")} min={1} max={132} /></Field>
            <Field label="Prior encounters"><Stepper value={patient.priorEncounters} onChange={up("priorEncounters")} max={40} /></Field>
            <Field label="Recent outpatient follow-up"><Toggle checked={patient.recentFollowUp} onChange={up("recentFollowUp")} label="Within 30 days" /></Field>
          </Section>
          <button onClick={assess} disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-sm font-extrabold tracking-[0.1em] text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-70">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} ASSESS READMISSION RISK
          </button>
        </Card>

        <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <Card className={cn("transition-opacity", !assessed && "opacity-60")}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Readmission risk</p>
              <RiskBadge tier={prediction.tier} />
            </div>
            <div className="mt-4"><RiskGauge probability={prediction.probability} tier={prediction.tier} /></div>
            {!assessed && <p className="mt-3 rounded-md bg-medium-soft px-3 py-2 text-center text-xs">Inputs changed — click <strong>Assess</strong> to update.</p>}
            <dl className="mt-5 space-y-2.5 text-sm">
              {[["Risk probability", `${(prediction.probability * 100).toFixed(1)}%`], ["Cohort baseline", `${(prediction.baseRate * 100).toFixed(1)}%`], ["Target", "<30-day readmission"], ["Discharge readiness", prediction.readiness], ["Follow-up priority", prediction.priority], ["Model", prediction.modelVersion]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-dashed pb-2 last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
              ))}
            </dl>
          </Card>
          <Card title="Key drivers"><FactorList prediction={prediction} /></Card>
          <Link to="/explainability" className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm font-semibold transition hover:border-primary/50">
            Why is this patient {prediction.tier.toLowerCase()} risk? <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
        </div>
      </div>

      <div className="mt-5"><InterventionPanel key={prediction.probability} prediction={prediction} patient={patient} /></div>
    </div>
  );
}
