import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, AlertTriangle, BedDouble, Gauge, Target, Activity, Scale, ArrowRight, Database, Brain, Sparkles, ClipboardList, CalendarCheck, Eye, Clock } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Card, DemoTag, KpiCard, chartTooltipStyle } from "@/components/readmit/ui";
import { overview, riskDistribution, trend, riskByAge, riskByAdmission, topFactors, models } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReadmitAI — Readmission Risk Command Center" },
      { name: "description", content: "Identify high-risk patients before discharge — and understand why. Prototype readmission-risk dashboard." },
      { property: "og:title", content: "ReadmitAI — Readmission Risk Command Center" },
      { property: "og:description", content: "Identify high-risk patients before discharge — and understand why." },
    ],
  }),
  component: Overview,
});

const journey = [
  { label: "Data", icon: Database }, { label: "AI", icon: Brain }, { label: "Risk", icon: Gauge },
  { label: "Explanation", icon: Sparkles }, { label: "Intervention", icon: ClipboardList }, { label: "Follow-up", icon: CalendarCheck },
];
const why = [
  { t: "Earlier identification", d: "Flag high-risk encounters while the patient is still on the ward.", icon: Clock },
  { t: "Explainable predictions", d: "Every score shows the factors that pushed it up or down.", icon: Eye },
  { t: "Targeted interventions", d: "Risk tier maps to a concrete, reviewable discharge plan.", icon: ClipboardList },
  { t: "Fairness monitoring", d: "Performance tracked across age, gender and race.", icon: Scale },
  { t: "Data-driven discharge planning", d: "Allocate follow-up capacity where it matters most.", icon: Target },
];
const tierColor: Record<string, string> = { Low: "var(--low)", Medium: "var(--medium)", High: "var(--high)" };
const fmt = (n: number) => n.toLocaleString("en-US");

function Overview() {
  const selected = models.find((m) => m.selected)!;
  return (
    <div className="space-y-6">
      <section className="hero-surface relative overflow-hidden rounded-2xl p-6 md:p-10">
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-foreground/70">ReadmitAI · Predict. Explain. Prevent.</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">Identify high-risk patients before discharge — and understand why.</h1>
          <p className="mt-4 max-w-xl text-sm text-navy-foreground/75 md:text-base">Readmission risk scoring for diabetic inpatient encounters, with transparent explanations, intervention planning and built-in fairness monitoring.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/assess" className="inline-flex items-center gap-2 rounded-lg bg-card px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-card/90">Assess a patient <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/models" className="inline-flex items-center gap-2 rounded-lg border border-navy-foreground/25 px-4 py-2.5 text-sm font-semibold text-navy-foreground transition hover:bg-navy-foreground/10">See 23 model comparison</Link>
          </div>
        </div>
        <div className="relative z-10 mt-8 flex flex-wrap items-center gap-2">
          {journey.map((j, i) => (
            <div key={j.label} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-foreground/10 px-3 py-1.5 text-xs font-semibold"><j.icon className="h-3.5 w-3.5" />{j.label}</span>
              {i < journey.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-navy-foreground/50" />}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border-[40px] border-navy-foreground/5" />
        <div className="pointer-events-none absolute -bottom-32 right-24 h-72 w-72 rounded-full border-[30px] border-navy-foreground/5" />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Hospital overview · UCI Diabetes 130-US cohort</h2>
        <DemoTag />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Total encounters" value={fmt(overview.totalEncounters)} hint="1999–2008, 130 hospitals" icon={<Users className="h-4 w-4" />} />
        <KpiCard label="High-risk patients" value={fmt(overview.highRisk)} hint="Score ≥ 40%" tone="high" icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard label="Predicted readmissions" value={fmt(overview.predictedReadmissions)} hint="<30 days" tone="medium" icon={<BedDouble className="h-4 w-4" />} />
        <KpiCard label="Average risk" value={`${(overview.avgRisk * 100).toFixed(1)}%`} hint="Cohort mean" icon={<Gauge className="h-4 w-4" />} />
        <KpiCard label="Model AUC" value={overview.auc.toFixed(3)} hint="Hold-out test" tone="low" icon={<Activity className="h-4 w-4" />} />
        <KpiCard label="Recall" value={`${Math.round(overview.recall * 100)}%`} hint="High-risk captured" tone="low" icon={<Target className="h-4 w-4" />} />
        <KpiCard label="Fairness disparity" value={overview.disparity.toFixed(2)} hint="Max demographic gap" tone="medium" icon={<Scale className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Readmission risk distribution" subtitle="Encounters by predicted tier">
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={riskDistribution} dataKey="count" nameKey="tier" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {riskDistribution.map((d) => <Cell key={d.tier} fill={tierColor[d.tier]} />)}
                </Pie>
                <Tooltip {...chartTooltipStyle} formatter={(v: number) => fmt(v)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Readmission trend" subtitle="Observed vs. predicted <30-day rate (%)" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[8, 13]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip {...chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="observed" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="predicted" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Risk by age group" subtitle="Mean predicted risk (%)">
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={riskByAge}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="group" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip {...chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="risk" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Risk by admission type" subtitle="Mean predicted risk (%)">
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={riskByAdmission}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip {...chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="risk" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Top risk factors" subtitle="Global feature importance">
          <div className="space-y-2">
            {topFactors.map((f) => (
              <div key={f.feature} className="text-xs">
                <div className="mb-1 flex justify-between"><span>{f.feature}</span><span className="num text-muted-foreground">{f.importance.toFixed(2)}</span></div>
                <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(f.importance / 0.21) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Model performance summary" subtitle={`Selected: ${selected.name}`} action={<Link to="/models" className="text-xs font-semibold text-primary hover:underline">All 23 models →</Link>}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[["Accuracy", selected.accuracy], ["Precision", selected.precision], ["Recall", selected.recall], ["AUC", selected.auc]].map(([k, v]) => (
            <div key={k as string}><p className="text-xs text-muted-foreground">{k}</p><p className="num text-xl font-semibold">{(v as number).toFixed(3)}</p></div>
          ))}
          <div><p className="text-xs text-muted-foreground">Decision threshold</p><p className="num text-xl font-semibold">0.12</p></div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Threshold tuned for recall: missing a genuinely high-risk patient is costlier than an extra follow-up call.</p>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-bold">Why ReadmitAI?</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {why.map((w, i) => (
            <div key={w.t} className="card-surface p-4">
              <div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-lg bg-info-soft text-primary"><w.icon className="h-4 w-4" /></span><span className="num text-xs text-muted-foreground">0{i + 1}</span></div>
              <p className="mt-3 text-sm font-bold">{w.t}</p>
              <p className="mt-1 text-xs text-muted-foreground">{w.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
