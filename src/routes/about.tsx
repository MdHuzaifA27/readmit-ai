import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { Card, PageHeader } from "@/components/readmit/ui";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ReadmitAI — Prototype & Safety" },
      { name: "description", content: "What ReadmitAI is, what is demo data, and what production deployment would require." },
      { property: "og:title", content: "About ReadmitAI" },
      { property: "og:description", content: "Hackathon prototype for explainable hospital readmission risk prediction." },
    ],
  }),
  component: AboutPage,
});

const real = ["UCI dataset structure, column names and missingness profile", "Preprocessing and feature-exclusion rationale", "Evaluation and fairness methodology", "Complete clinician workflow and UI", "API contract for a Python ML backend"];
const demo = ["Every model metric and the 23-model comparison table", "All fairness numbers and before/after comparison", "Dashboard KPIs, trends and charts", "Patient risk scores (hand-specified logistic function, not trained)", "Explanation values (approximated from demo function terms)"];
const prod = ["Train & validate models on the real dataset with patient-grouped splits", "Prospective / external validation on local hospital data", "Calibration and threshold setting with clinical stakeholders", "EHR integration (HL7 FHIR), authentication, audit logging", "HIPAA-compliant hosting, PHI handling and access control", "Ongoing drift, performance and fairness monitoring", "Clinical governance review and applicable regulatory assessment"];

function AboutPage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Hackathon 6B · Predictive analytics" title="About ReadmitAI" description="Predict. Explain. Prevent. — An explainable readmission-risk concept for discharge planners and clinicians." />
      <Card className="border-high/30 bg-high-soft">
        <div className="flex gap-3"><ShieldAlert className="h-5 w-5 shrink-0 text-high" /><p className="text-sm">ReadmitAI is a prototype clinical decision-support concept. Predictions and recommendations shown in this demonstration are not medical advice and have not been clinically validated. It has no regulatory approval, makes no guarantee of accuracy, reflects no real patient outcomes, and does not make autonomous clinical decisions. Final decisions must be made by qualified healthcare professionals.</p></div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Grounded in the real dataset design"><ul className="space-y-2">{real.map((r) => <li key={r} className="flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 shrink-0 text-low" />{r}</li>)}</ul></Card>
        <Card title="Demo / synthetic in this prototype"><ul className="space-y-2">{demo.map((r) => <li key={r} className="flex gap-2 text-sm"><XCircle className="h-4 w-4 shrink-0 text-medium" />{r}</li>)}</ul></Card>
        <Card title="Needed for production"><ul className="space-y-2">{prod.map((r) => <li key={r} className="flex gap-2 text-sm"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{r}</li>)}</ul></Card>
      </div>
      <Card title="Dataset">
        <p className="text-sm text-muted-foreground">Strack et al. (2014). <em>Impact of HbA1c Measurement on Hospital Readmission Rates.</em> UCI Machine Learning Repository — Diabetes 130-US hospitals for years 1999–2008. <a className="text-primary hover:underline" href="https://archive.ics.uci.edu/dataset/296/diabetes+130-us+hospitals+for+years+1999-2008" target="_blank" rel="noreferrer">View dataset ↗</a></p>
      </Card>
    </div>
  );
}
