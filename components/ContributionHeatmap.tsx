"use client";

import { useMemo } from "react";

export interface DayCount {
  date: string;
  count: number;
}

const COLORS = {
  empty: "#F3F4F6",
  light: "#E9D8FD",
  medium: "#C4B5FD",
  heavy: "#A855F7",
};

function getColor(count: number): string {
  if (count === 0) return COLORS.empty;
  if (count <= 3) return COLORS.light;
  if (count <= 6) return COLORS.medium;
  return COLORS.heavy;
}

/** 圆形阵列热力图，90 天 */
export function ContributionHeatmap({ data }: { data: DayCount[] }) {
  const map = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data) m.set(d.date, d.count);
    return m;
  }, [data]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const cells = useMemo(() => {
    const out: { date: string; count: number }[] = [];
    const start = new Date();
    start.setDate(start.getDate() - 89);
    for (let i = 0; i < 90; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const date = d.toISOString().slice(0, 10);
      out.push({ date, count: map.get(date) ?? 0 });
    }
    return out;
  }, [map]);

  const cols = 10;
  const rows = 9;
  const size = 10;
  const gap = 4;
  const r = size / 2;

  return (
    <svg
      viewBox={`0 0 ${cols * (size + gap) - gap} ${rows * (size + gap) - gap}`}
      className="w-full max-w-[200px] h-auto"
      style={{ minHeight: 110 }}
    >
      {cells.slice(0, 90).map((cell, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = col * (size + gap) + r;
        const cy = row * (size + gap) + r;
        const color = getColor(cell.count);
        const isToday = cell.date === today;
        return (
          <g key={cell.date}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={color}
              stroke={isToday ? "#805ad5" : "transparent"}
              strokeWidth={1.5}
            />
          </g>
        );
      })}
    </svg>
  );
}
