"use client";

import { useEffect, useState } from "react";
import { Briefcase, ChartBar, Crown, FileText } from "lucide-react";

const NODES = [
  { label: "Manager", icon: Briefcase },
  { label: "Analyst", icon: ChartBar },
  { label: "Executive", icon: Crown },
  { label: "PDF report", icon: FileText },
];

export default function PipelineLoader() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <div className="glass p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Agents are collaborating…</h2>
            <p className="mt-1 text-sm text-slate-400">
              Three AI agents review your data, then the report is generated. This usually takes under a minute.
            </p>
          </div>
          <span className="font-mono text-2xl tabular-nums text-slate-300">
            {mm}:{ss}
          </span>
        </div>

        {seconds >= 25 && (
          <p className="mt-4 text-sm text-amber-300/90">
            Still working. If the server was asleep, the first run takes a little longer.
          </p>
        )}

        <div className="mt-8 flex items-center">
          {NODES.map(({ label, icon: Icon }, i) => (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <span
                  className="grid h-12 w-12 animate-pulse place-items-center rounded-2xl border border-violet-400/30 bg-violet-500/10 text-violet-200"
                  style={{ animationDelay: `${i * 250}ms` }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              {i < NODES.length - 1 && (
                <div className="flow-bar mx-3 mb-6 h-0.5 flex-1 rounded bg-white/10" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="shimmer h-32 rounded-2xl border border-white/[0.06]" />
        ))}
      </div>
      <div aria-hidden className="shimmer h-72 rounded-2xl border border-white/[0.06]" />
    </div>
  );
}