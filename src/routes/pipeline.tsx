import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, Database, ShieldCheck, Filter, Wand2, Split, Layers, BarChart3, Scale, Trophy, Gauge, Stethoscope } from "lucide-react";
import { Card, PageHeader, DemoTag } from "@/components/readmit/ui";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Model Pipeline & Architecture — ReadmitAI" },
      { name: "description", content: "End-to-end AI pipeline from the UCI dataset to clinical decision support, plus technical architecture." },
      { property: "og:title", content: "Model Pipeline & Architecture — ReadmitAI" },
      { property: "og:description", content: "How ReadmitAI goes from raw data to explainable risk scores." },
    ],
  }),
  component: PipelinePage,
});

const stages = [
  { t: "UCI dataset", d: "101,766 encounters · 50 attributes", icon: Database },
  { t: "Data validation", d: "Schema, ranges, '?' tokens, duplicates", icon: ShieldCheck },
  { t: "Preprocessing", d: "Missing values, outliers, encoding", icon: Filter },
  { t: "Feature engineering", d: "Utilization, burden, ICD groups", icon: Wand2 },
  { t: "Train / validation / test", d: "Patient-grouped 70 / 15 / 15", icon: Split },
  { t: "23 model configurations", d: "Linear, trees, boosting, ensembles", icon: Layers },
  { t: "Performance evaluation", d: "Accuracy, precision, recall, AUC", icon: BarChart3 },
  { t: "Fairness evaluation", d: "Age, gender, race · DPD, EOD", icon: Scale },
  { t: "Model selection", d: "Recall-first with AUC & fairness gates", icon: Trophy },
  { t: "Risk scoring", d: "Probability → tier → readiness", icon: Gauge },
  { t: "Clinical decision support", d: "Explanation + intervention plan", icon: Stethoscope },
];

const arch = [
  { layer: "Frontend", items: ["React 19 + TanStack Start", "Tailwind CSS v4", "Recharts"], status: "Built" },
  { layer: "API adapter", items: ["src/lib/api.ts", "predict · getModels · getFairness · getDataQuality", "Mock ↔ real via VITE_READMIT_API_URL"], status: "Built (mock)" },
  { layer: "ML service", items: ["FastAPI (Python)", "POST /predict · POST /explain", "GET /models · /fairness · /data-quality"], status: "Planned" },
  { layer: "Modeling", items: ["pandas · scikit-learn", "XGBoost / LightGBM", "SHAP · Fairlearn"], status: "Planned" },
  { layer: "Data & MLOps", items: ["UCI CSV → Parquet", "MLflow model registry", "Drift & fairness monitoring"], status: "Planned" },
];

function PipelinePage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Architecture" title="Model pipeline" description="The intended end-to-end flow. In this prototype, the scoring stage is a transparent demo function." actions={<DemoTag label="Prototype architecture" />} />
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <Card>
          <ol className="space-y-1">
            {stages.map((s, i) => (
              <li key={s.t}>
                <div className="flex items-center gap-3 rounded-lg border bg-card p-3 transition hover:border-primary/40 hover:bg-info-soft">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy text-navy-foreground"><s.icon className="h-4 w-4" /></span>
                  <div><p className="font-display text-sm font-extrabold uppercase tracking-wide">{s.t}</p><p className="text-xs text-muted-foreground">{s.d}</p></div>
                </div>
                {i < stages.length - 1 && <ArrowDown className="mx-auto my-0.5 h-4 w-4 text-muted-foreground" />}
              </li>
            ))}
          </ol>
        </Card>
        <div className="space-y-5">
          <Card title="Technical architecture">
            <div className="space-y-2.5">
              {arch.map((a) => (
                <div key={a.layer} className="grid items-center gap-3 rounded-lg border p-3 md:grid-cols-[130px_1fr_110px]">
                  <p className="text-sm font-bold">{a.layer}</p>
                  <div className="flex flex-wrap gap-1.5">{a.items.map((i) => <span key={i} className="num rounded-md bg-muted px-2 py-1 text-[11px]">{i}</span>)}</div>
                  <span className={a.status === "Planned" ? "justify-self-start rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground md:justify-self-end" : "justify-self-start rounded-full bg-low-soft px-2.5 py-0.5 text-[11px] font-semibold text-low md:justify-self-end"}>{a.status}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Where the real model connects">
            <pre className="num overflow-x-auto rounded-lg bg-navy p-4 text-[12px] leading-relaxed text-navy-foreground">{`// src/lib/api.ts
export async function predict(p: Patient) {
  if (API) return post("/predict", p);  // ← Python service
  return scorePatient(p);              // ← demo logistic fn
}

# FastAPI (planned)
@app.post("/predict")
def predict(enc: Encounter):
    X = pipeline.transform(to_frame(enc))
    p = model.predict_proba(X)[0, 1]
    shap = explainer(X).values[0]
    return {"probability": p, "tier": tier(p),
            "factors": top_factors(shap), ...}`}</pre>
          </Card>
        </div>
      </div>
    </div>
  );
}
