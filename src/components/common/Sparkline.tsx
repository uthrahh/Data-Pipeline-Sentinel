"use client";

import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

export function Sparkline({ data, positive = true }: { data: number[]; positive?: boolean }) {
  const color = positive ? "var(--color-success-500)" : "var(--color-danger-500)";
  const points = data.map((value, i) => ({ i, value }));

  return (
    <div className="h-9 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${positive ? "up" : "down"}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#spark-${positive ? "up" : "down"})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
