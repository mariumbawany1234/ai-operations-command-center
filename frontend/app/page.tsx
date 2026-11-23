"use client";

import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { MotionConfig, motion } from "framer-motion";
import {
  ArrowRight,
  CircleAlert,
  Percent,
  Receipt,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { analyzeBusiness, reportUrl, type AnalysisResult } from "@/lib/api";
import { pct, usd } from "@/lib/format";

import KPICard from "@/components/dashboard/KPICard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import AgentCard from "@/components/dashboard/AgentCard";
import ReportCard from "@/components/dashboard/ReportCard";
import PipelineLoader from "@/components/dashboard/PipelineLoader";

const DEFAULT_OBJECTIVE =
  "Increase profitability, reduce unnecessary expenses, identify sales trends and recommend business improvements.";

const PRESETS = [
  { label: "Boost profitability", text: "Increase profitability and improve the profit margin." },
  { label: "Cut costs", text: "Identify and reduce unnecessary expenses without hurting growth." },
  { label: "Find growth trends", text: "Identify sales trends and recommend where to invest for growth." },
];

const STEPS = [
  { n: "01", title: "Business Manager", text: "Frames the objective, KPIs and key questions." },
  { n: "02", title: "Data Analyst", text: "Reads the numbers and finds trends and risks." },
  { n: "03", title: "Executive", text: "Turns insight into decisions and next actions." },
];

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

export default function Home() {
  const [company, setCompany] = useState("Demo Company");
  const [objective, setObjective] = useState(DEFAULT_OBJECTIVE);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ranFor, setRanFor] = useState("");
  const [elapsed, setElapsed] = useState(0);

  async function run(e?: FormEvent) {
    e?.preventDefault();
    if (loading || !company.trim() || !objective.trim()) return;

    const name = company.trim();
    const started = Date.now();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeBusiness(name, objective.trim());
      setResult(data);
      setRanFor(name);
      setElapsed(Math.round((Date.now() - started) / 1000));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const onObjectiveKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void run();
    }
  };

  // Loader and error render below the form: bring them into view
  useEffect(() => {
    if (loading || error) {
      document.getElementById("status")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, error]);

  // Bring the finished dashboard into view
  useEffect(() => {
    if (result) {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const m = result?.metrics;
  const monthly = result?.monthly;
  const first = monthly?.[0]?.month.slice(0, 3);
  const last = monthly?.[monthly.length - 1]?.month.slice(0, 3);

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-14">
        {/* ---------- Hero + command form ---------- */}
        <section id="overview" className="space-y-9">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" aria-hidden />
              Multi-agent business intelligence
            </span>

            <h1 className="gradient-text mt-6 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Turn raw numbers into boardroom-ready decisions.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Three AI agents analyze your business data, debate the findings and deliver an executive dashboard with a ready-to-share PDF report.
            </p>
          </div>

          <form onSubmit={run} className="glass p-5 sm:p-7">
            <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
              <div>
                <label htmlFor="company" className="mb-2 block text-sm font-medium text-slate-300">
                  Company
                </label>
                <input
                  id="company"
                  className="field"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  maxLength={80}
                  required
                  autoComplete="organization"
                  placeholder="Acme Inc."
                />
              </div>

              <div>
                <label htmlFor="objective" className="mb-2 block text-sm font-medium text-slate-300">
                  Business objective
                  <span className="ml-2 hidden font-normal text-slate-600 sm:inline">Ctrl / ⌘ + Enter to run</span>
                </label>
                <textarea
                  id="objective"
                  className="field resize-none"
                  rows={4}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  onKeyDown={onObjectiveKey}
                  maxLength={600}
                  required
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-600">Try:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setObjective(p.text)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400 transition-colors hover:border-white/20 hover:text-white"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Runs 3 agents (AutoGen + Groq) and builds a PDF report.
              </p>

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                    Analyzing…
                  </>
                ) : (
                  <>
                    Run analysis
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ---------- Loading ---------- */}
        {loading && (
          <div id="status">
            <PipelineLoader />
          </div>
        )}

        {/* ---------- Error ---------- */}
        {error && !loading && (
          <div id="status" role="alert" className="glass flex flex-col gap-4 border-rose-400/30 p-6 sm:flex-row sm:items-center">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30">
              <CircleAlert className="h-5 w-5" aria-hidden />
            </span>
            <div className="flex-1">
              <h2 className="font-semibold text-white">Analysis failed</h2>
              <p className="mt-0.5 text-sm text-slate-400">{error}</p>
            </div>
            <button type="button" onClick={() => void run()} className="btn-ghost">
              <RotateCcw className="h-4 w-4" aria-hidden />
              Try again
            </button>
          </div>
        )}

        {/* ---------- Empty state: how it works ---------- */}
        {!loading && !result && !error && (
          <section aria-label="How it works">
            <SectionHeading title="How it works" subtitle="Your executive dashboard appears here after the run." />
            <div className="grid gap-4 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="glass p-5">
                  <span className="font-mono text-xs text-violet-300">{s.n}</span>
                  <h3 className="mt-3 font-semibold text-white">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------- Results ---------- */}
        {result && !loading && (
          <div id="results" className="space-y-14">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
              <p className="flex items-center gap-2 text-sm text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                Analysis complete · {elapsed}s
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Executive dashboard <span className="text-slate-500">/</span> {ranFor}
              </h2>
            </motion.div>

            {m && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {[
                  <KPICard key="rev" label="Total revenue" value={m.total_sales} format={usd} icon={Wallet} tone="violet"
                    hint={`${usd(m.first_month_sales)} to ${usd(m.last_month_sales)} per month`} />,
                  <KPICard key="exp" label="Total expenses" value={m.total_expenses} format={usd} icon={Receipt} tone="rose"
                    hint={`${pct((m.total_expenses / m.total_sales) * 100, 0)} of revenue`} />,
                  <KPICard key="pro" label="Net profit" value={m.total_profit} format={usd} icon={TrendingUp} tone="emerald"
                    hint={`Best month: ${m.best_month} (${usd(m.best_month_profit)})`} />,
                  <KPICard key="mar" label="Profit margin" value={m.profit_margin_pct} format={(n) => pct(n)} icon={Percent} tone="cyan"
                    hint={`Lowest month: ${m.lowest_month}`} />,
                ].map((card, i) => (
                  <motion.div key={card.key} {...fadeUp} transition={{ duration: 0.45, delay: 0.08 * i }}>
                    {card}
                  </motion.div>
                ))}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {monthly && (
                <motion.section id="analytics" {...fadeUp} transition={{ duration: 0.5, delay: 0.3 }} className="glass p-6 lg:col-span-2">
                  <SectionHeading title="Performance trend" subtitle={`Revenue, expenses and profit · ${first}–${last}`} />
                  <RevenueChart data={monthly} />
                </motion.section>
              )}

              {result.pdf && (
                <motion.section
                  id="report"
                  {...fadeUp}
                  transition={{ duration: 0.5, delay: 0.38 }}
                  className={monthly ? "" : "lg:col-span-3"}
                >
                  <ReportCard url={reportUrl(result.pdf)} company={ranFor} />
                </motion.section>
              )}
            </div>

            <section id="agents">
              <SectionHeading title="Agent insights" subtitle="What each AI agent concluded, in the order they spoke." />
              <div className="grid gap-5 lg:grid-cols-3">
                {result.agents.map((a, i) => (
                  <motion.div key={`${a.agent}-${i}`} {...fadeUp} transition={{ duration: 0.5, delay: 0.45 + 0.1 * i }} className="h-full">
                    <AgentCard agent={a.agent} response={a.response} step={i + 1} />
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}