import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, Stethoscope, Sparkles, BarChart3, Scale, Database, Workflow, Info, Menu, X, Activity } from "lucide-react";
import { Disclaimer } from "./ui";
import { useAssessment } from "@/lib/assessment-store";
import { RiskBadge } from "./ui";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/assess", label: "Patient Risk", icon: Stethoscope },
  { to: "/explainability", label: "Explainability", icon: Sparkles },
  { to: "/models", label: "Model Performance", icon: BarChart3 },
  { to: "/fairness", label: "Fairness", icon: Scale },
  { to: "/data-quality", label: "Data Quality", icon: Database },
  { to: "/pipeline", label: "Model Pipeline", icon: Workflow },
  { to: "/about", label: "About", icon: Info },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Activity className="h-5 w-5" /></span>
      <div>
        <p className="font-display text-[15px] font-extrabold tracking-[0.12em] text-navy-foreground">READMITAI</p>
        <p className="text-[11px] text-navy-foreground/60">Predict. Explain. Prevent.</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { prediction, patientLabel, assessed } = useAssessment();
  const sidebar = (
    <nav className="flex h-full flex-col gap-6 p-5">
      <Brand />
      <ul className="space-y-1">
        {nav.map((n) => (
          <li key={n.to}>
            <Link to={n.to} onClick={() => setOpen(false)} activeOptions={{ exact: n.to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-navy-foreground/70 transition-colors hover:bg-navy-foreground/10 hover:text-navy-foreground"
              activeProps={{ className: "bg-navy-foreground/12 !text-navy-foreground font-semibold" }}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-auto rounded-xl border border-navy-foreground/10 bg-navy-foreground/5 p-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-foreground/50">Active encounter</p>
        <p className="mt-1 text-sm font-semibold text-navy-foreground">{patientLabel}</p>
        <div className="mt-2 flex items-center justify-between">
          {assessed ? <RiskBadge tier={prediction.tier} /> : <span className="text-xs text-navy-foreground/60">Not yet assessed</span>}
          {assessed && <span className="num text-sm text-navy-foreground">{Math.round(prediction.probability * 100)}%</span>}
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-navy">{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(!open)} aria-label="Toggle navigation" className="rounded-md p-1.5 hover:bg-muted">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <p className="font-display font-extrabold tracking-[0.12em] text-navy">READMITAI</p>
          <span className="w-8" />
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        <div className="sticky bottom-0 z-10"><Disclaimer /></div>
      </div>
    </div>
  );
}
