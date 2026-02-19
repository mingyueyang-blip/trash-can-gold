"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FragmentCard } from "./FragmentCard";
import type { CardViewMode } from "./MasonryGrid";

export interface AlchemyFragment {
  id: string;
  content: string;
  sourceType: string;
  sourceUrl: string | null;
  tagIds: string[];
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

function tagClusterKey(tagIds: string[]): string {
  if (!tagIds.length) return "__untagged__";
  return [...tagIds].sort().join(",");
}

interface AlchemyViewProps {
  fragments: AlchemyFragment[];
  timeRange: "all" | "3d" | "7d";
  onTimeRangeChange: (v: "all" | "3d" | "7d") => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}

export function AlchemyView({
  fragments,
  timeRange,
  onTimeRangeChange,
  onArchive,
  onDelete,
  emptyMessage = "暂无近期碎片，切换时间范围或先去收件箱添加",
}: AlchemyViewProps) {
  const filtered = useMemo(() => {
    if (timeRange === "all") return fragments;
    const now = Date.now();
    const ms3d = 72 * 60 * 60 * 1000;
    const ms7d = 7 * 24 * 60 * 60 * 1000;
    const cutoff = timeRange === "3d" ? now - ms3d : now - ms7d;
    return fragments.filter((f) => new Date(f.createdAt).getTime() >= cutoff);
  }, [fragments, timeRange]);

  const groups = useMemo(() => {
    const map = new Map<string, AlchemyFragment[]>();
    for (const f of filtered) {
      const key = tagClusterKey(f.tagIds);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === "__untagged__") return 1;
      if (b[0] === "__untagged__") return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [filtered]);

  if (fragments.length === 0) {
    return (
      <p className="text-center text-[#718096] py-12">
        暂无碎片，请先在收件箱添加内容
      </p>
    );
  }

  if (filtered.length === 0) {
    return (
      <>
        <div className="flex justify-center mb-6">
          <div
            className="inline-flex p-0.5 rounded-xl bg-white/40 backdrop-blur-md shadow-sm"
            role="tablist"
          >
            {(["all", "3d", "7d"] as const).map((range) => (
              <button
                key={range}
                type="button"
                role="tab"
                aria-selected={timeRange === range}
                onClick={() => onTimeRangeChange(range)}
                className={`relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  timeRange === range
                    ? "text-[#2d3748] bg-white shadow-sm"
                    : "text-[#718096] hover:text-[#4a5568]"
                }`}
              >
                {range === "all" ? "全部" : range === "3d" ? "近3天" : "近7天"}
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-[#718096] py-12">{emptyMessage}</p>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-center mb-6">
        <div
          className="inline-flex p-0.5 rounded-xl bg-white/40 backdrop-blur-md shadow-sm"
          role="tablist"
        >
          {(["all", "3d", "7d"] as const).map((range) => (
            <button
              key={range}
              type="button"
              role="tab"
              aria-selected={timeRange === range}
              onClick={() => onTimeRangeChange(range)}
              className={`relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeRange === range
                  ? "text-[#2d3748] bg-white shadow-sm"
                  : "text-[#718096] hover:text-[#4a5568]"
              }`}
            >
              {range === "all" ? "全部" : range === "3d" ? "近3天" : "近7天"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <AnimatePresence mode="wait">
          {groups.map(([key, items]) => (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-4 bg-[#e9d8fd]/30 backdrop-blur-sm border border-[#e9d8fd]/50 shadow-sm"
            >
              <div className="text-xs font-medium text-[#805ad5] mb-3 px-1">
                {key === "__untagged__" ? "无标签" : (items[0].tagIds || []).slice(0, 3).join(" · ")}
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <FragmentCard
                      key={item.id}
                      id={item.id}
                      content={item.content}
                      sourceType={item.sourceType}
                      sourceUrl={item.sourceUrl}
                      tagIds={item.tagIds}
                      title={item.title}
                      createdAt={item.createdAt}
                      viewMode={"alchemy" as CardViewMode}
                      onDelete={onDelete}
                      onArchive={onArchive}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
