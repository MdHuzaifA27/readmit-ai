import { useState } from "react";
import { ArrowDown, ArrowUp, CheckSquare, Square, ShieldAlert, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { interventionsFor, type Patient, type Prediction } from "@/lib/model";
import { Card, RiskBadge, tierStyles } from "./ui";

export function FactorList({ prediction, limit = 5 }: { prediction: Prediction; limit?: number }) {
  const up = prediction.factors.filter((f) => f.impact > 0.002).slice(0, limit);
  const down = prediction.factors.filter((f) => f.impact < -0.002).slice(0, 3);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-high">Top contributing factors</p>
        <ul className="space-y-1.5">
          {up.length === 0 && <li className="text-sm text-muted-foreground">No major risk drivers.</li>}
          {up.map((f) => (
            <li key={f.key} className="flex items-start gap-2 text-sm"><ArrowUp className="mt-0.5 h-4 w-4 shrink-0 text-high" /><span><span className="font-medium">{f.label}</span><span className="block text-xs text-muted-foreground">{f.detail}</span></span></li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-low">Protective factors</p>
        <ul className="space-y-1.5">
          {down.length === 0 && <li className="text-sm text-muted-foreground">None identified.</li>}
          {down.map((f) => (
            <li key={f.key} className="flex items-start gap-2 text-sm"><ArrowDown className="mt-0.5 h-4 w-4 shrink-0 text-low" /><span><span className="font-medium">{f.label}</span><span className="block text-xs text-muted-foreground">{f.detail}</span></span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ShapChart({ prediction, limit = 9 }: { prediction: Prediction; limit?: number }) {
  const items = prediction.factors.slice(0, limit);
  const max = Math.max(...items.map((f) => Math.abs(f.impact)), 0.01);
  return (
    <div className="space-y-2.5">
      {items.map((f) => {
        const pos = f.impact >= 0;
        const w = (Math.abs(f.impact) / max) * 50;
        return (
          <div key={f.key} className="grid grid-cols-[minmax(120px,180px)_1fr_56px] items-center gap-3 text-sm">
            <span className="truncate text-foreground" title={f.detail}>{f.label}</span>
            <div className="relative h-6 rounded bg-muted">
              <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
              <div className={cn("absolute inset-y-1 rounded-sm transition-all duration-500", pos ? "bg-high" : "bg-low")}
                style={pos ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }} />
            </div>
            <span className={cn("num text-right text-xs font-semibold", pos ? "text-high" : "text-low")}>{pos ? "+" : "−"}{Math.abs(f.impact * 100).toFixed(1)}%</span>
          </div>
        );
      })}
      <div className="grid grid-cols-[minmax(120px,180px)_1fr_56px] gap-3 pt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span /><div className="flex justify-between"><span>← lowers risk</span><span>raises risk →</span></div><span />
      </div>
    </div>
  );
}

export function narrative(prediction: Prediction): string {
  const up = prediction.factors.filter((f) => f.impact > 0.005).slice(0, 4).map((f) => f.label.toLowerCase());
  const down = prediction.factors.filter((f) => f.impact < -0.005).slice(0, 2).map((f) => f.label.toLowerCase());
  const join = (a: string[]) => a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;
  let s = `This encounter is classified as ${prediction.tier.toLowerCase()} risk (${Math.round(prediction.probability * 100)}% vs. a ${Math.round(prediction.baseRate * 100)}% cohort baseline)`;
  s += up.length ? ` primarily because of ${join(up)}.` : ".";
  if (down.length) s += ` Risk is partially offset by ${join(down)}.`;
  return s + " This explanation describes the demo model's reasoning — it is not a clinical judgement.";
}

export function InterventionPanel({ prediction, patient }: { prediction: Prediction; patient: Patient }) {
  const items = interventionsFor(prediction, patient);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const s = tierStyles[prediction.tier];
  return (
    <Card title="Clinical intervention plan" subtitle="Prototype recommendations — not autonomous medical orders. Review and adapt per clinical judgement."
      action={<RiskBadge tier={prediction.tier} />}>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className={cn("rounded-lg border p-3", s.badge)}>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"><ShieldAlert className="h-3.5 w-3.5" />Priority</p>
          <p className="mt-1 font-display text-sm font-extrabold uppercase">{prediction.priority}</p>
        </div>
        <div className="rounded-lg border bg-muted p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><Clock className="h-3.5 w-3.5" />Follow-up timeframe</p>
          <p className="mt-1 text-sm font-semibold">{prediction.followUpWindow}</p>
        </div>
        <div className="rounded-lg border bg-muted p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Discharge readiness</p>
          <p className="mt-1 text-sm font-semibold">{prediction.readiness}</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-[1fr_1fr_120px] gap-3 bg-muted px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>Recommended intervention</span><span>Reason</span><span>Owner</span>
        </div>
        {items.map((it) => (
          <button key={it.action} type="button" onClick={() => setDone({ ...done, [it.action]: !done[it.action] })}
            className="grid w-full grid-cols-[1fr_1fr_120px] items-center gap-3 border-t px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60">
            <span className="flex items-center gap-2 font-medium">
              {done[it.action] ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
              <span className={cn(done[it.action] && "text-muted-foreground line-through")}>{it.action}</span>
            </span>
            <span className="text-xs text-muted-foreground">{it.reason}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><User className="h-3 w-3" />{it.owner}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">{Object.values(done).filter(Boolean).length} of {items.length} actions acknowledged · Click a row to mark as addressed.</p>
    </Card>
  );
}
