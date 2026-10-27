import { useId, type CSSProperties } from "react";

/** A dependency-free area sparkline. The stroke is drawn on once; the fill and end marker fade in. */
export function Sparkline({ data, color = "var(--color-accent-400)", className = "h-9 w-24" }: { data: number[]; color?: string; className?: string }) {
  const id = useId();
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const W = 100;
  const H = 32;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, H - 3 - ((v - min) / span) * (H - 8)] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const endY = pts[pts.length - 1][1];

  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="size-full" overflow="visible">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.28" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} className="animate-fade-in" style={{ animationDelay: "0.5s" }} />
        <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" pathLength={1} className="animate-draw" style={{ "--len": 1 } as CSSProperties} />
      </svg>
      {/* The end marker is HTML, not SVG, so the stretched viewBox can't squash it into an ellipse. */}
      <span
        className="animate-fade-in absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: "100%", top: `${(endY / H) * 100}%`, background: color, boxShadow: `0 0 8px ${color}`, animationDelay: "1s" }}
      />
    </div>
  );
}
