import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, CheckCircle2, Trophy } from "lucide-react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { getModels, isRealModelConfigured } from "@/lib/api";
import { models as fallbackModels, type ModelRow } from "@/lib/demo-data";
import { Card, DemoTag, PageHeader, chartTooltipStyle } from "@/components/readmit/ui";

export const Route = createFileRoute("/models")({
  head: () => ({ meta: [
    { title: "Model Performance — ReadmitAI" },
    { name: "description", content: "Evaluation of the trained readmission models on a patient-grouped hold-out set." },
  ]}),
  component: ModelsPage,
});

type RealRow = { id: number; model: string; accuracy: number; precision: number; recall: number; f1: number; auc: number; selected?: boolean };
type Key = "model" | "accuracy" | "precision" | "recall" | "auc" | "f1";

function ModelsPage() {
  const [rows, setRows] = useState<RealRow[]>([]);
  const [split, setSplit] = useState("");
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "recall", dir: -1 });
  const [error, setError] = useState("");

  useEffect(() => {
    getModels().then((r) => {
      if (Array.isArray(r)) {
        setRows(r.map((x: any, i: number) => ({ id: i + 1, model: x.name, accuracy: x.accuracy, precision: x.precision, recall: x.recall, f1: x.f1 ?? 0, auc: x.auc, selected: x.selected })));
      } else {
        setRows(r.rows as RealRow[]); setSplit(r.split ?? "");
      }
    }).catch((e) => setError(String(e)));
  }, []);

  const display = rows.length ? rows : fallbackModels.slice(0, 2).map((m) => ({ id: m.id, model: m.name, accuracy: m.accuracy, precision: m.precision, recall: m.recall, f1: 0, auc: m.auc, selected: m.selected }));
  const sorted = useMemo(() => [...display].sort((a, b) => {
    const av = a[sort.key], bv = b[sort.key];
    return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir;
  }), [display, sort]);
  const selected = display.find((m) => m.selected) ?? display[0];
  const head = (key: Key, label: string) => <th className="px-3 py-2.5 text-left"><button onClick={() => setSort({ key, dir: sort.key === key ? (sort.dir * -1 as 1 | -1) : -1 })} className={cn("inline-flex items-center gap-1 hover:text-foreground", sort.key === key && "text-primary")}>{label}<ArrowUpDown className="h-3 w-3" /></button></th>;

  return <div className="space-y-5">
    <PageHeader eyebrow="Evaluation" title="Model performance" description="Actual trained metrics on a patient-grouped 80/20 hold-out split. The selected model prioritises transparent probability output and explainability." actions={<DemoTag label={isRealModelConfigured ? "Live model metrics" : "Fallback metrics"} />} />
    {error && <div className="rounded-lg bg-medium-soft p-3 text-xs">API unavailable — showing the local fallback view. Start the backend and set <code>VITE_READMIT_API_URL</code> to load trained artifacts.</div>}

    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <Card title="Recall vs. AUC" subtitle="Bubble size = precision. These are the two trained prototype configurations.">
        <div className="h-72"><ResponsiveContainer><ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="var(--border)" /><XAxis type="number" dataKey="auc" domain={[0.6, 0.7]} name="AUC" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" /><YAxis type="number" dataKey="recall" domain={[0, 0.8]} name="Recall" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" /><ZAxis type="number" dataKey="precision" range={[80, 280]} />
          <Tooltip {...chartTooltipStyle} content={({ payload }) => payload?.[0] ? <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow"><p className="font-semibold">{(payload[0].payload as RealRow).model}</p><p>AUC {(payload[0].payload as RealRow).auc.toFixed(3)} · Recall {(payload[0].payload as RealRow).recall.toFixed(3)}</p></div> : null} />
          <Scatter data={display}>{display.map((m) => <Cell key={m.id} fill={m.selected ? "var(--high)" : "var(--chart-2)"} fillOpacity={m.selected ? 1 : 0.65} />)}</Scatter>
        </ScatterChart></ResponsiveContainer></div>
      </Card>
      {selected && <Card className="border-primary/30"><div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Selected model</p></div>
        <p className="mt-2 font-display text-lg font-extrabold">{selected.model}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">{(["accuracy", "precision", "recall", "auc"] as const).map((k) => <div key={k} className="rounded-lg bg-muted p-2"><p className="text-[10px] uppercase text-muted-foreground">{k}</p><p className="num font-semibold">{selected[k].toFixed(3)}</p></div>)}</div>
        <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-low" /><span><strong className="text-foreground">Patient-grouped split.</strong> The same patient cannot appear in both train and test.</span></li>
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-low" /><span><strong className="text-foreground">AUC = {selected.auc.toFixed(3)}.</strong> This measures ranking performance independent of one threshold.</span></li>
          <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-medium" /><span><strong className="text-foreground">Recall-oriented threshold.</strong> The prototype uses a 10% operating threshold for alert classification.</span></li>
        </ul>
        <p className="mt-4 rounded-md bg-medium-soft p-2 text-[11px]">Research prototype only. Performance is not clinical validation.</p>
      </Card>}
    </div>

    <Card title="Trained configurations">
      <div className="-mx-5 overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead className="border-y bg-muted/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"><tr><th className="px-3 py-2.5 pl-5 text-left">#</th>{head("model", "Model")}{head("accuracy", "Accuracy")}{head("precision", "Precision")}{head("recall", "Recall")}{head("f1", "F1")}{head("auc", "AUC")}<th className="px-3 py-2.5 text-left">Selected</th></tr></thead>
        <tbody>{sorted.map((m) => <tr key={m.id} className={cn("border-b last:border-0", m.selected && "bg-info-soft")}><td className="num px-3 py-2.5 pl-5 text-muted-foreground">{m.id}</td><td className="px-3 py-2.5 font-medium">{m.model}</td>{(["accuracy", "precision", "recall", "f1", "auc"] as const).map((k) => <td key={k} className="num px-3 py-2.5">{m[k].toFixed(3)}</td>)}<td className="px-3 py-2.5">{m.selected ? <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground"><CheckCircle2 className="h-3 w-3" />Selected</span> : "—"}</td></tr>)}</tbody></table></div>
      <p className="mt-3 text-[11px] text-muted-foreground">{split || "Metrics are loaded from the local trained artifacts when the API is connected."}</p>
    </Card>
  </div>;
}
