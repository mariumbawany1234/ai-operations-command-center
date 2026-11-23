"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyRow } from "@/lib/api";
import { usd, usdCompact } from "@/lib/format";

const SERIES = [
  { key: "sales", name: "Revenue", color: "#8b5cf6" },
  { key: "expenses", name: "Expenses", color: "#fb7185" },
  { key: "profit", name: "Profit", color: "#34d399" },
] as const;

/** Round the axis maximum up to a "nice" value (3,500 -> 4,000). */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => f <= s) ?? 10;
  return step * exp;
}

export default function RevenueChart({ data }: { data: MonthlyRow[] }) {
  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2" aria-label="Chart legend">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.name}
          </li>
        ))}
      </ul>

      <div
        className="h-72 w-full"
        role="img"
        aria-label="Area chart of monthly revenue, expenses and profit"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={s.key === "sales" ? 0.4 : 0.15} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />

            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => m.slice(0, 3)}
              tick={{ fill: "#8b8fa3", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tickFormatter={(v: number) => usdCompact(v)}
              tick={{ fill: "#8b8fa3", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={52}
              domain={[0, niceMax]}
              tickCount={5}
            />

            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.18)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-xl border border-white/10 bg-[#0b0d16]/95 px-3.5 py-3 shadow-2xl backdrop-blur">
                    <p className="mb-2 text-xs font-medium text-white">{String(label)}</p>
                    {payload.map((p) => (
                      <p key={String(p.dataKey)} className="flex items-center justify-between gap-6 text-xs text-slate-400">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                          {p.name}
                        </span>
                        <span className="font-mono text-slate-100">{usd(Number(p.value))}</span>
                      </p>
                    ))}
                  </div>
                );
              }}
            />

            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#fill-${s.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}