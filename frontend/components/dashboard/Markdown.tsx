import type { ReactNode } from "react";

/**
 * Tiny, dependency-free renderer for the markdown subset LLM agents emit:
 * headings, bullets, numbered lists, tables, **bold** and `code`.
 * Builds React nodes (never raw HTML), so model output cannot inject markup.
 */

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em] text-cyan-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

const BULLET = /^([-*\u2022])\s+/;
const ORDERED = /^\d+[.)]\s+/;

export default function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r/g, "").split("\n");
  const out: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line || /^-{3,}$/.test(line)) {
      i++;
      continue;
    }

    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) {
      out.push(
        <h4 key={i} className="mt-5 text-sm font-semibold tracking-wide text-white first:mt-0">
          {inline(heading[1])}
        </h4>
      );
      i++;
      continue;
    }

    if (line.startsWith("|")) {
      const rows: string[][] = [];
      const start = i;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      out.push(
        <div key={start} className="my-3 overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.05] text-slate-300">
              <tr>
                {head?.map((c, k) => (
                  <th key={k} className="px-3 py-2 font-medium">{inline(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-400">
              {body.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2">{inline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (BULLET.test(line) || ORDERED.test(line)) {
      const ordered = ORDERED.test(line);
      const re = ordered ? ORDERED : BULLET;
      const items: string[] = [];
      const start = i;
      while (i < lines.length && re.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(re, ""));
        i++;
      }
      const Tag = ordered ? "ol" : "ul";
      out.push(
        <Tag
          key={start}
          className={`my-2 space-y-1.5 pl-5 text-slate-300 marker:text-violet-400 ${ordered ? "list-decimal" : "list-disc"}`}
        >
          {items.map((it, k) => (
            <li key={k} className="pl-1">{inline(it)}</li>
          ))}
        </Tag>
      );
      continue;
    }

    out.push(
      <p key={i} className="my-2 text-slate-300">
        {inline(line)}
      </p>
    );
    i++;
  }

  return <div className="text-sm leading-relaxed">{out}</div>;
}