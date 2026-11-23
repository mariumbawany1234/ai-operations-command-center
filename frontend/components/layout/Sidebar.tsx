"use client";

import { useEffect, useState } from "react";
import { Bot, ChartBar, FileText, LayoutDashboard, Sparkles } from "lucide-react";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: ChartBar },
  { id: "agents", label: "AI Agents", icon: Bot },
  { id: "report", label: "Report", icon: FileText },
] as const;

const STACK = ["Next.js", "FastAPI", "AutoGen", "Groq"];

export default function Sidebar() {
  const [active, setActive] = useState<string>("overview");
  const [present, setPresent] = useState<string[]>(["overview"]);

  // Highlight the section in view; sections after "Overview" only exist
  // once an analysis has run, so their links are disabled until then.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );

    const scan = () => {
      const found = NAV.map((n) => n.id).filter((id) =>
        document.getElementById(id)
      );
      setPresent((prev) => (prev.join() === found.join() ? prev : found));
      found.forEach((id) => observer.observe(document.getElementById(id)!));
    };

    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.07] bg-[#05060b]/70 px-4 py-6 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 shadow-lg shadow-violet-500/30">
          <Sparkles className="h-5 w-5 text-white" aria-hidden />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Command Center</p>
          <p className="text-xs text-slate-500">AI Operations</p>
        </div>
      </div>

      <nav aria-label="Primary" className="mt-10 flex flex-1 flex-col gap-1">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-widest text-slate-600">
          Workspace
        </p>

        {NAV.map(({ id, label, icon: Icon }) => {
          const enabled = present.includes(id);
          const isActive = enabled && active === id;
          const base =
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors";

          if (!enabled) {
            return (
              <span
                key={id}
                aria-disabled="true"
                title="Available after you run an analysis"
                className={`${base} cursor-not-allowed text-slate-600`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </span>
            );
          }

          return (
            <a
              key={id}
              href={`#${id}`}
              aria-current={isActive ? "true" : undefined}
              className={`${base} ${
                isActive
                  ? "bg-white/[0.07] text-white shadow-[inset_2px_0_0_0_#8b5cf6]"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </a>
          );
        })}
      </nav>

      <div className="glass p-4">
        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
          Powered by
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STACK.map((s) => (
            <span
              key={s}
              className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-300"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}