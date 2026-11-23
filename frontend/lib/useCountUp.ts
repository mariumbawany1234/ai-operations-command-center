"use client";

import { useEffect, useState } from "react";

/** Animates 0 -> target. Respects prefers-reduced-motion. */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = reduce ? 0 : duration;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = total === 0 ? 1 : Math.min((now - start) / total, 1);
      setValue(target * (1 - Math.pow(1 - p, 3))); // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}