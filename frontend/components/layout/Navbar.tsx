"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { API_URL } from "@/lib/api";

type Status = "checking" | "waking" | "online" | "offline";

const STATUS_UI: Record<Status, { dot: string; label: string }> = {
  checking: { dot: "bg-amber-400", label: "Checking API" },
  waking: { dot: "bg-amber-400", label: "Waking up server…" },
  online: { dot: "bg-emerald-400", label: "API online" },
  offline: { dot: "bg-rose-400", label: "API offline" },
};

// A sleeping free-tier server needs up to ~1 minute to start,
// so keep retrying for a while before declaring it offline.
const WAKE_ATTEMPTS = 10;

export default function Navbar() {
  const [status, setStatus] = useState<Status>("checking");

  // Real health check against the FastAPI /health endpoint
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let everOnline = false;
    let misses = 0;

    const ping = async () => {
      let ok = false;
      try {
        const res = await fetch(`${API_URL}/health`, {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });
        ok = res.ok;
      } catch {
        ok = false;
      }
      if (!alive) return;

      if (ok) {
        everOnline = true;
        misses = 0;
        setStatus("online");
        timer = setTimeout(ping, 30_000);
      } else {
        misses += 1;
        if (!everOnline && misses < WAKE_ATTEMPTS) {
          setStatus("waking");
          timer = setTimeout(ping, 3_000);
        } else {
          setStatus("offline");
          timer = setTimeout(ping, 15_000);
        }
      }
    };

    ping();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const ui = STATUS_UI[status];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#05060b]/60 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
      {/* Mobile brand (sidebar is hidden below lg) */}
      <div className="flex items-center gap-2.5 lg:hidden">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400">
          <Sparkles className="h-4 w-4 text-white" aria-hidden />
        </div>
        <span className="text-sm font-semibold text-white">Command Center</span>
      </div>

      <p className="hidden text-sm text-slate-500 lg:block">
        Command Center
        <span className="mx-2 text-slate-700">/</span>
        <span className="text-slate-200">Business Intelligence</span>
      </p>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-xs text-slate-400 sm:inline">
          gpt-oss-20b
        </span>

        <span
          role="status"
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300"
        >
          <span className="relative flex h-2 w-2">
            {(status === "online" || status === "waking") && (
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${ui.dot}`}
              />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${ui.dot}`} />
          </span>
          {ui.label}
        </span>
      </div>
    </header>
  );
}