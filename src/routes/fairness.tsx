import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { getFairness, isRealModelConfigured } from "@/lib/api";
import { fairness as fallbackFairness, type GroupRow } from "@/lib/demo-data";
import { Card, DemoTag, PageHeader, InfoTip, chartTooltipStyle } from "@/components/readmit/ui";

export const Route = createFileRoute("/fairness")({
  head: () => ({ meta: [
    { title: "Fairness & Governance — ReadmitAI" },
    { name: "description", content: "Subgroup evaluation across age, gender and race on the held-out test set." },
  ]}),
  component: FairnessPage,
});

type Attr = "age" | "gender" | "race";
type RealGroup = { feature: Attr; group: string; n: number; positive_rate: number; selection_rate: number; recall: number | null; fpr: number; precision: number; auc: number | null };
const metricDefs = [
  ["Selection rate", "Share flagged at the 10% operating threshold."],
  ["True positive rate (recall)", "Share of actual <30-day readmissions caught."],
  ["False positive rate", "Share of non-readmitted encounters flagged."],
  ["Precision", "Share of flagged encounters that were actually readmitted."],
  ["AUC", "Within-group ranking performance independent of threshold."],
  ["Demographic disparity", "Largest selection-rate gap between groups."],
  ["Equal opportunity difference", "Largest recall gap between groups."],
];
const status = (d: number) => d <= 0.05 ? "Acceptable" : d <= 0.10 ? "Review" : "Needs review";
const statusCls = (s: string) => s === "Acceptable" ? "bg-low-soft text-low" : s === "Review" ? "bg-medium-soft text-medium" : "bg-high-soft text-high";

function FairnessPage() {
  const [attr, setAttr] = useState<Attr>("race");
  const [all, setAll] = useState<RealGroup[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getFairness().then((r: any) => setAll(r.groups ?? null)).catch((e) => setError(String(e))); }, []);

  const groupsFor = (a: Attr): GroupRow[] => {
    if (!all) return fallbackFairness[a];
    return all.filter((x) => x.feature === a && x.n > 50).map((x) => ({ group: x.group, n: x.n, selection: x.selection_rate, tpr: x.recall ?? 0, fpr: x.fpr, precision: x.precision, auc: x.auc ?? 0 }));
  };
  const summaries = useMemo(() => (["age", "gender", "race"] as Attr[]).map((a) => {
    const r = groupsFor(a); const selection = r.map(x => x.selection); const tpr = r.map(x => x.tpr);
    const disparity = Math.max(...selection) - Math.min(...selection); const eod = Math.max(...tpr) - Math.min(...tpr);
    return { attribute: a, disparity, eod, status: status(Math.max(disparity, eod)) };
  }), [all]);
  const rows = groupsFor(attr);

  return <div className="space-y-5">
    <PageHeader eyebrow="Governance" title="Fairness & governance" description="Subgroup behaviour is computed from the held-out test set at the 10% operating threshold. These are monitoring metrics, not proof of clinical fairness." actions={<DemoTag label={isRealModelConfigured ? "Live fairness snapshot" : "Fallback snapshot"} />} />
    {error && <div className="rounded-lg bg-medium-soft p-3 text-xs">API unavailable — showing the bundled fallback view. Start the backend to use the trained test-set metrics.</div>}

    <div className="grid gap-4 md:grid-cols-3">{summaries.map((s) => <button key={s.attribute} onClick={() => setAttr(s.attribute as Attr)} className={cn("card-surface p-5 text-left transition", attr === s.attribute && "ring-2 ring-primary")}><div className="flex items-center justify-between"><p className="font-display font-bold capitalize">{s.attribute}</p><span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold", statusCls(s.status))}>{s.status}</span></div><div className="mt-3 grid grid-cols-2 gap-3"><div><p className="text-[11px] text-muted-foreground">Selection disparity</p><p className="num text-2xl font-semibold">{s.disparity.toFixed(2)}</p></div><div><p className="text-[11px] text-muted-foreground">Equal opp. diff</p><p className="num text-2xl font-semibold">{s.eod.toFixed(2)}</p></div></div></button>)}</div>

    <Card title={`Subgroup metrics · ${attr}`} subtitle="Groups with fewer than 50 held-out encounters are hidden" action={<div className="flex gap-1">{(["age", "gender", "race"] as Attr[]).map((a) => <button key={a} onClick={() => setAttr(a)} className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", attr === a ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{a}</button>)}</div>}>
      <div className="grid gap-5 lg:grid-cols-2"><div className="h-64"><ResponsiveContainer><BarChart data={rows}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="group" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" /><YAxis domain={[0, 1]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" /><Tooltip {...chartTooltipStyle} cursor={{ fill: "var(--muted)" }} /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="selection" name="Selection rate" fill="var(--chart-2)" radius={[4, 4, 0, 0]} /><Bar dataKey="tpr" name="TPR" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /><Bar dataKey="fpr" name="FPR" fill="var(--chart-4)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-[11px] uppercase tracking-wider text-muted-foreground"><tr className="border-b">{["Group","n","Sel.","TPR","FPR","Prec.","AUC"].map(h => <th key={h} className="py-2 text-left font-bold">{h}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.group} className="border-b last:border-0"><td className="py-2 font-medium">{r.group}</td>{[r.n.toLocaleString(),r.selection.toFixed(2),r.tpr.toFixed(2),r.fpr.toFixed(2),r.precision.toFixed(2),r.auc.toFixed(2)].map((v,i)=><td key={i} className="num py-2">{v}</td>)}</tr>)}</tbody></table><p className="mt-3 text-[11px] text-muted-foreground">Small subgroups can have wide uncertainty. Bootstrap confidence intervals should be added before any production governance decision.</p></div></div>
    </Card>

    <Card title="Metric guide" subtitle="How to interpret the governance view"><ul className="space-y-3">{metricDefs.map(([t,d])=><li key={t} className="flex gap-2 text-sm"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"/><span><strong>{t}</strong> <span className="text-muted-foreground">— {d}</span></span></li>)}</ul><div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground"><InfoTip text="Demographic parity alone can be misleading when true outcome rates differ. Equal opportunity focuses on whether patients who actually readmit are caught equally often."/>Why equal opportunity matters</div></Card>
  </div>;
}
