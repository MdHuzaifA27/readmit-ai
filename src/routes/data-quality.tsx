import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Ban, Wand2, AlertCircle, Binary, Ruler } from "lucide-react";
import { dataQuality as dq } from "@/lib/demo-data";
import { Card, DemoTag, PageHeader } from "@/components/readmit/ui";

export const Route = createFileRoute("/data-quality")({
  head: () => ({
    meta: [
      { title: "Data Quality & Preprocessing — ReadmitAI" },
      { name: "description", content: "Documented missing-value, outlier, encoding, feature engineering and exclusion rationale for the UCI diabetes dataset." },
      { property: "og:title", content: "Data Quality & Preprocessing — ReadmitAI" },
      { property: "og:description", content: "How ReadmitAI's preprocessing pipeline is designed for the UCI Diabetes 130-US data." },
    ],
  }),
  component: DataQualityPage,
});

const steps = ["Raw data", "Missing value analysis", "Outlier analysis", "Feature cleaning", "Encoding", "Feature engineering", "Feature selection", "Train/test split", "Model training", "Evaluation", "Fairness analysis"];

function DataQualityPage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Data governance" title="Data quality & preprocessing"
        description={`UCI Diabetes 130-US hospitals · ${dq.rows.toLocaleString()} encounters · ${dq.columns} attributes · target: ${dq.target}`}
        actions={<DemoTag label="Executed on supplied UCI dataset" />} />

      <Card title="Preprocessing pipeline">
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs font-semibold"><span className="num grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{i + 1}</span>{s}</span>
              {i < steps.length - 1 && <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Missing values" subtitle={`Encoded in raw file as "?" and "Unknown/Invalid" — converted to NaN before analysis`} action={<AlertCircle className="h-5 w-5 text-medium" />}>
        <div className="space-y-3">
          {dq.missing.map((m) => (
            <div key={m.column} className="grid items-center gap-3 border-b pb-3 last:border-0 md:grid-cols-[160px_180px_1fr]">
              <div><p className="num text-sm font-semibold">{m.column}</p><p className="text-[11px] text-muted-foreground">{m.pct}% missing</p></div>
              <div className="h-2 rounded-full bg-muted"><div className={m.pct > 50 ? "h-full rounded-full bg-high" : m.pct > 10 ? "h-full rounded-full bg-medium" : "h-full rounded-full bg-low"} style={{ width: `${Math.max(m.pct, 1.5)}%` }} /></div>
              <div className="text-sm"><span className="font-semibold">{m.action}.</span> <span className="text-muted-foreground">{m.why}</span></div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Outlier strategy" subtitle="Clinically / data-driven rules — no blind deletion of extreme values" action={<Ruler className="h-5 w-5 text-primary" />}>
          <ul className="space-y-3">{dq.outliers.map((o) => (
            <li key={o.feature} className="rounded-lg border p-3"><p className="num text-xs font-semibold">{o.feature}</p><p className="mt-1 text-sm font-medium">{o.rule}</p><p className="text-xs text-muted-foreground">{o.why}</p></li>
          ))}</ul>
        </Card>
        <Card title="Feature engineering" subtitle="Candidate engineering documented separately; current compact model uses the listed raw/encoded features" action={<Wand2 className="h-5 w-5 text-primary" />}>
          <ul className="space-y-3">{dq.engineered.map((f) => (
            <li key={f.name} className="border-b pb-2.5 last:border-0"><p className="num text-sm font-semibold text-primary">{f.name}</p><p className="num text-xs">{f.formula}</p><p className="text-xs text-muted-foreground">{f.why}</p></li>
          ))}</ul>
        </Card>
        <Card title="Feature exclusions" subtitle="Each exclusion documented with rationale" action={<Ban className="h-5 w-5 text-high" />}>
          <ul className="space-y-2.5">{dq.excluded.map((e) => (
            <li key={e.feature} className="flex gap-3 text-sm"><span className="num shrink-0 rounded bg-high-soft px-2 py-0.5 text-xs font-semibold text-high">{e.feature}</span><span className="text-muted-foreground">{e.why}</span></li>
          ))}</ul>
        </Card>
        <Card title="Encoding" action={<Binary className="h-5 w-5 text-primary" />}>
          <ul className="space-y-2.5">{dq.encoding.map((e) => <li key={e} className="flex gap-2 text-sm"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{e}</li>)}</ul>
          <div className="mt-4 rounded-lg bg-info-soft p-3 text-xs"><strong>Leakage control:</strong> the supplied training script splits by <span className="num">patient_nbr</span> so the same patient never appears in both train and test; preprocessing is fitted on training data only.</div>
        </Card>
      </div>
    </div>
  );
}
