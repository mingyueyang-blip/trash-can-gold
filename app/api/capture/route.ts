/**
 * POST /api/capture
 * 接收投喂：Text 或 Link
 * Body: { type: "text" | "link", content: string }
 * Header: X-API-KEY（由 middleware 统一校验）
 */
import { NextRequest, NextResponse } from "next/server";
import { captureFragment } from "@/services/capture.service";

export async function POST(request: NextRequest) {
  let body: { type?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "请求体必须是 JSON" },
      { status: 400 }
    );
  }

  const { type, content } = body;
  if (!type || !content || typeof content !== "string") {
    return NextResponse.json(
      { error: "缺少 type 或 content，且 content 必须为字符串" },
      { status: 400 }
    );
  }

  if (type !== "text" && type !== "link") {
    return NextResponse.json(
      { error: "type 仅支持 text | link" },
      { status: 400 }
    );
  }

  try {
    const result = await captureFragment({ type, content });
    return NextResponse.json(result);
  } catch (e) {
    console.error("[POST /api/capture]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "捕获失败" },
      { status: 500 }
    );
  }
}
