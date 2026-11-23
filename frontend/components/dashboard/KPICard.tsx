"use client";

import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/lib/useCountUp";

const TONES = {
  violet: { chip: "bg-violet-500/15 text-violet-300 ring-violet-400/25", glow: "from-violet-500/25" },
  cyan: { chip: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/25", glow: "from-cyan-500/25" },
  emerald: { chip: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25", glow: "from-emerald-500/25" },
  rose: { chip: "bg-rose-500/15 text-rose-300 ring-rose-400/25", glow: "from-rose-500/25" },
} as const;

type Props = {
  label: string;
  value: number;
  format: (n: number) => string;
  hint?: string;
  icon: LucideIcon;
  tone: keyof typeof TONES;
};

export default function KPICard({ label, value, format, hint, icon: Icon, tone }: Props) {
  const animated = useCountUp(value);
  const t = TONES[tone];

  return (
    <div className="glass glass-hover relative overflow-hidden p-4 sm:p-5">
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${t.glow} to-transparent blur-2xl`}
      />

      <div className="relative flex items-center justify-between">
        <p className="text-xs text-slate-400 sm:text-sm">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ring-1 ${t.chip}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>

      <p className="relative mt-4 font-mono text-2xl font-semibold sm:text-3xl tabular-nums tracking-tight text-white">
        {format(animated)}
      </p>

      {hint && <p className="relative mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}