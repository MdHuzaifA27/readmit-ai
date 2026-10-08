import type { ReactNode } from "react";
import { Info, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/model";

export function DemoTag({ label = "Demo / Synthetic Data", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-medium/40 bg-medium-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground", className)}>
      <FlaskConical className="h-3 w-3 text-medium" /> {label}
    </span>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>}
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, subtitle, action, children, className }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("card-surface p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-bold text-foreground">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function KpiCard({ label, value, hint, icon, tone = "default" }: { label: string; value: string; hint?: string; icon?: ReactNode; tone?: "default" | "high" | "medium" | "low" }) {
  const toneCls = { default: "bg-info-soft text-primary", high: "bg-high-soft text-high", medium: "bg-medium-soft text-medium", low: "bg-low-soft text-low" }[tone];
  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon && <span className={cn("grid h-8 w-8 place-items-center rounded-lg", toneCls)}>{icon}</span>}
      </div>
      <p className="num mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export const tierStyles: Record<Tier, { badge: string; text: string; bg: string; stroke: string }> = {
  Low: { badge: "bg-low-soft text-low border-low/30", text: "text-low", bg: "bg-low", stroke: "var(--low)" },
  Medium: { badge: "bg-medium-soft text-medium border-medium/30", text: "text-medium", bg: "bg-medium", stroke: "var(--medium)" },
  High: { badge: "bg-high-soft text-high border-high/30", text: "text-high", bg: "bg-high", stroke: "var(--high)" },
};

export function RiskBadge({ tier, size = "sm" }: { tier: Tier; size?: "sm" | "lg" }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wide", tierStyles[tier].badge, size === "lg" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-0.5 text-[11px]")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", tierStyles[tier].bg)} /> {tier} risk
    </span>
  );
}

export function RiskGauge({ probability, tier }: { probability: number; tier: Tier }) {
  const pct = Math.round(probability * 100);
  const r = 70, c = Math.PI * r;
  return (
    <div className="relative mx-auto w-[200px]">
      <svg viewBox="0 0 180 100" className="w-full">
        <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="var(--muted)" strokeWidth="14" strokeLinecap="round" />
        <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke={tierStyles[tier].stroke} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(probability, 1))} style={{ transition: "stroke-dashoffset 700ms ease, stroke 300ms" }} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className={cn("num text-4xl font-semibold", tierStyles[tier].text)}>{pct}%</p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">30-day readmission</p>
      </div>
    </div>
  );
}

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg bg-navy px-3 py-2 text-[11px] font-normal normal-case leading-snug tracking-normal text-navy-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

export function Disclaimer() {
  return (
    <div className="flex items-start gap-2 border-t bg-card/90 px-4 py-2.5 text-[11px] leading-snug text-muted-foreground backdrop-blur md:px-8">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <p>
        <strong className="text-foreground">ReadmitAI is a prototype clinical decision-support concept.</strong> Predictions and recommendations shown in this demonstration are not medical advice and have not been clinically validated. Final decisions must be made by qualified healthcare professionals.
      </p>
    </div>
  );
}

export const chartTooltipStyle = {
  contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 },
  labelStyle: { color: "var(--foreground)", fontWeight: 600 },
};
