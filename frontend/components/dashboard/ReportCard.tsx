"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, FileText } from "lucide-react";

export default function ReportCard({ url, company }: { url: string; company: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: ignore */
    }
  };

  return (
    <div className="glass relative flex h-full flex-col overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-400/10 blur-3xl"
      />

      <span className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-violet-500/25 to-cyan-400/15 text-violet-200 ring-1 ring-violet-400/30">
        <FileText className="h-6 w-6" aria-hidden />
      </span>

      <h3 className="relative mt-5 text-lg font-semibold text-white">Executive report</h3>
      <p className="relative mt-1 text-sm text-slate-400">
        Board-ready PDF for {company}: KPIs, monthly performance and agent analysis.
      </p>

      <ul className="relative mt-5 space-y-2 text-sm text-slate-400">
        {["KPI summary", "Monthly performance table", "Analysis from all 3 agents"].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" aria-hidden />
            {item}
          </li>
        ))}
      </ul>

      <div className="relative mt-auto flex flex-col gap-2.5 pt-6">
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
          <ExternalLink className="h-4 w-4" aria-hidden />
          Open PDF report
        </a>
        <button type="button" onClick={copy} className="btn-ghost w-full">
          {copied ? <Check className="h-4 w-4 text-emerald-400" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}