/**
 * DELETE /api/fragments/[id] · 单条删除
 * PATCH /api/fragments/[id] · 更新状态 { status: 'inbox' | 'archived' | 'burned' }
 * Header: X-API-KEY
 */
import { NextRequest, NextResponse } from "next/server";
import { deleteFragment, updateFragmentStatus } from "@/services/fragments.service";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  }

  try {
    await deleteFragment(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/fragments/:id]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "删除失败" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体须为 JSON" }, { status: 400 });
  }

  const status = body?.status;
  if (!status || !["inbox", "archived", "burned"].includes(status)) {
    return NextResponse.json(
      { error: "status 须为 inbox | archived | burned" },
      { status: 400 }
    );
  }

  try {
    await updateFragmentStatus(id, status as "inbox" | "archived" | "burned");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/fragments/:id]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "更新失败" },
      { status: 500 }
    );
  }
}
