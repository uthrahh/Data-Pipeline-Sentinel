"use client";

import { useEffect, useRef } from "react";

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts up to `value`. The text is written straight to the DOM node each frame,
 * so a count-up never re-renders React. `format` must be a stable function.
 */
export function AnimatedNumber({ value, format = String, duration = 1100 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      shown.current = value;
      el.textContent = format(value);
      return;
    }
    const from = shown.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      shown.current = from + (value - from) * eased;
      el.textContent = format(shown.current);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, format, duration]);

  return (
    <span ref={ref} className="num">
      {format(value)}
    </span>
  );
}
