"use client";

import { useEffect, useState } from "react";
import { fetchHeatmapApi, type HeatmapDay } from "@/lib/api-client";
import { ContributionHeatmap } from "./ContributionHeatmap";

function computeStreak(days: HeatmapDay[]): number {
  const set = new Set(days.filter((d) => d.count > 0).map((d) => d.date));
  const today = new Date().toISOString().slice(0, 10);
  if (!set.has(today)) return 0;
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function totalNotes(days: HeatmapDay[]): number {
  return days.reduce((s, d) => s + d.count, 0);
}

interface LeftSidebarProps {
  /** 嵌入三栏布局时不用 fixed，占位父级宽度 */
  embedded?: boolean;
}

export function LeftSidebar({ embedded }: LeftSidebarProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchHeatmapApi()
      .then((data) => {
        if (!cancelled) setHeatmapData(data);
      })
      .catch(() => {
        if (!cancelled) setHeatmapData([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = totalNotes(heatmapData);
  const streak = computeStreak(heatmapData);

  const content = (
      <div className="rounded-[24px] bg-white/40 backdrop-blur-md border border-white/50 shadow-lg p-4 flex flex-col gap-4 min-h-0">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#718096]">总笔记数</span>
          <span className="text-xl font-semibold text-[#2d3748]">
            {loading ? "—" : total}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#718096]">连续炼金</span>
          <span className="text-xl font-semibold text-[#805ad5]">
            {loading ? "—" : `${streak} 天`}
          </span>
        </div>
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          <span className="text-xs font-medium text-[#718096]">贡献热力图</span>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-[#a0aec0] text-sm">
              加载中…
            </div>
          ) : heatmapData.length > 0 ? (
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <ContributionHeatmap data={heatmapData} />
            </div>
          ) : (
            <div className="flex-1 flex flex-wrap gap-1 justify-center content-start py-2">
              {Array.from({ length: 90 }).map((_, i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#e9d8fd]"
                  aria-hidden
                />
              ))}
            </div>
          )}
        </div>
      </div>
  );

  if (embedded) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <aside className="flex fixed left-0 top-0 bottom-0 w-[160px] md:w-[220px] z-30 flex-col py-4 pl-4 pr-2 overflow-hidden">
      {content}
    </aside>
  );
}
