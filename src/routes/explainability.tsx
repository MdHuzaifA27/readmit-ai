import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquareText, ArrowLeft } from "lucide-react";
import { useAssessment } from "@/lib/assessment-store";
import { demoPatients } from "@/lib/model";
import { Card, DemoTag, PageHeader, RiskBadge, RiskGauge } from "@/components/readmit/ui";
import { ShapChart, narrative, InterventionPanel } from "@/components/readmit/clinical";

export const Route = createFileRoute("/explainability")({
  head: () => ({
    meta: [
      { title: "AI Explainability — ReadmitAI" },
      { name: "description", content: "SHAP-style breakdown of why an encounter received its readmission risk score, in plain language." },
      { property: "og:title", content: "AI Explainability — ReadmitAI" },
      { property: "og:description", content: "See which factors raised or lowered a patient's predicted readmission risk." },
    ],
  }),
  component: ExplainPage,
});

function ExplainPage() {
  const { prediction, patient, patientLabel, loadDemo } = useAssessment();
  const up = prediction.factors.filter((f) => f.impact > 0.002);
  const down = prediction.factors.filter((f) => f.impact < -0.002);
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Step 2 · Risk → Explanation" title={`Why is this patient ${prediction.tier.toLowerCase()} risk?`}
        description={`Explaining: ${patientLabel}. Contributions show how each factor moves the probability away from the cohort baseline.`}
        actions={<><DemoTag label="Demo explanation" />
          <select className="field !h-9 !w-auto" onChange={(e) => e.target.value && loadDemo(e.target.value)} defaultValue="">
            <option value="">Switch demo patient…</option>
            {demoPatients.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select></>} />

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <Card>
          <RiskGauge probability={prediction.probability} tier={prediction.tier} />
          <div className="mt-4 flex justify-center"><RiskBadge tier={prediction.tier} size="lg" /></div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Baseline</span><span className="num">{(prediction.baseRate * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span className="text-high">+ Risk drivers</span><span className="num text-high">+{(up.reduce((s, f) => s + f.impact, 0) * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span className="text-low">− Protective</span><span className="num text-low">{(down.reduce((s, f) => s + f.impact, 0) * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between border-t pt-2 font-semibold"><span>Predicted</span><span className="num">{(prediction.probability * 100).toFixed(1)}%</span></div>
          </div>
          <Link to="/assess" className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><ArrowLeft className="h-3.5 w-3.5" />Edit encounter</Link>
        </Card>

        <Card title="Risk contribution" subtitle="SHAP-style additive attribution (approximated from the demo model's log-odds terms)">
          <ShapChart prediction={prediction} limit={11} />
        </Card>
      </div>

      <Card>
        <div className="flex gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-info-soft text-primary"><MessageSquareText className="h-5 w-5" /></span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Plain-language explanation</p>
            <p className="mt-1.5 text-[15px] leading-relaxed">{narrative(prediction)}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[["What SHAP values mean", "Each bar shows how much a factor pushed this patient's risk up (red) or down (green) relative to the average encounter."],
          ["What they don't mean", "Contributions describe model behaviour, not causation. Changing a factor won't necessarily change real-world outcome."],
          ["In production", "Values would come from TreeSHAP on the trained gradient-boosting model via POST /explain."]].map(([t, d]) => (
          <div key={t} className="rounded-xl border bg-muted/60 p-4"><p className="text-sm font-bold">{t}</p><p className="mt-1 text-xs text-muted-foreground">{d}</p></div>
        ))}
      </div>

      <InterventionPanel key={prediction.probability} prediction={prediction} patient={patient} />
    </div>
  );
}
