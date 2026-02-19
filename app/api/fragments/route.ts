/**
 * GET /api/fragments
 * 列表与简单搜索：?q=关键词&status=inbox|archived|burned
 * Header: X-API-KEY
 */
import { NextRequest, NextResponse } from "next/server";
import { listFragments } from "@/services/fragments.service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") as "inbox" | "archived" | "burned" | undefined;
  if (status && !["inbox", "archived", "burned"].includes(status)) {
    return NextResponse.json({ error: "status 仅支持 inbox | archived | burned" }, { status: 400 });
  }

  try {
    const rows = await listFragments({ q, status });
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        content: r.content,
        sourceType: r.source_type,
        sourceUrl: r.source_url,
        tagIds: r.tag_ids ?? [],
        status: r.status,
        title: r.title,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }))
    );
  } catch (e) {
    console.error("[GET /api/fragments]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "查询失败" },
      { status: 500 }
    );
  }
}
