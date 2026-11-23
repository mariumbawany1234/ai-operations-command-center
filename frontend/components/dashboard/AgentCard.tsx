import { Bot, Briefcase, ChartBar, Crown, type LucideIcon } from "lucide-react";
import Markdown from "./Markdown";

const META: Record<
  string,
  { label: string; role: string; icon: LucideIcon; chip: string; bar: string }
> = {
  business_manager: {
    label: "Business Manager",
    role: "Strategy & KPIs",
    icon: Briefcase,
    chip: "bg-violet-500/15 text-violet-300 ring-violet-400/25",
    bar: "from-violet-500",
  },
  data_analyst: {
    label: "Data Analyst",
    role: "Trends & insights",
    icon: ChartBar,
    chip: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/25",
    bar: "from-cyan-400",
  },
  executive: {
    label: "Executive",
    role: "Decisions & next steps",
    icon: Crown,
    chip: "bg-amber-500/15 text-amber-300 ring-amber-400/25",
    bar: "from-amber-400",
  },
};

const FALLBACK = {
  label: "",
  role: "AI agent",
  icon: Bot,
  chip: "bg-slate-500/15 text-slate-300 ring-slate-400/25",
  bar: "from-slate-400",
};

export default function AgentCard({
  agent,
  response,
  step,
}: {
  agent: string;
  response: string;
  step: number;
}) {
  const meta = META[agent] ?? {
    ...FALLBACK,
    label: agent.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };
  const Icon = meta.icon;

  return (
    <article className="glass glass-hover relative flex h-full flex-col overflow-hidden p-6">
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${meta.bar} to-transparent`}
      />

      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${meta.chip}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <h3 className="font-semibold text-white">{meta.label}</h3>
            <p className="text-xs text-slate-500">{meta.role}</p>
          </div>
        </div>
        <span className="font-mono text-xs text-slate-600">
          {String(step).padStart(2, "0")}
        </span>
      </header>

      <div className="mt-5 flex-1">
        <Markdown content={response} />
      </div>
    </article>
  );
}