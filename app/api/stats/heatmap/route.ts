/**
 * GET /api/stats/heatmap
 * 过去 90 天每日碎片数量，用于贡献热力图
 * Header: X-API-KEY
 */
import { NextResponse } from "next/server";
import { getHeatmapDailyCounts } from "@/services/stats.service";

export async function GET() {
  try {
    const data = await getHeatmapDailyCounts(90);
    return NextResponse.json(data);
  } catch (e) {
    console.error("[GET /api/stats/heatmap]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "查询失败" },
      { status: 500 }
    );
  }
}
