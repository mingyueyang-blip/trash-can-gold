/**
 * 统计服务：按天聚合碎片数量（贡献热力图等）
 */
import { supabase } from "@/lib/supabase";

export interface DayCount {
  date: string; // YYYY-MM-DD
  count: number;
}

/** 过去 days 天内每天的碎片数量 */
export async function getHeatmapDailyCounts(days = 90): Promise<DayCount[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startStr = start.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("fragments")
    .select("created_at")
    .gte("created_at", startStr);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as { created_at: string }[];
  const map = new Map<string, number>();

  for (let i = 0; i < days; i++) {
    const dte = new Date(start);
    dte.setDate(dte.getDate() + i);
    const key = dte.toISOString().slice(0, 10);
    map.set(key, 0);
  }

  for (const r of rows) {
    const key = r.created_at.slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
