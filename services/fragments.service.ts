/**
 * 碎片列表与搜索
 */
import { supabase } from "@/lib/supabase";

export interface FragmentRow {
  id: string;
  content: string;
  source_type: string;
  source_url: string | null;
  tag_ids: string[] | null;
  status: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export async function listFragments(options: {
  q?: string;
  status?: "inbox" | "archived" | "burned";
  limit?: number;
}): Promise<FragmentRow[]> {
  let query = supabase
    .from("fragments")
    .select("*")
    .order("created_at", { ascending: false });

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query.limit(options.limit ?? 50);

  if (error) throw new Error(error.message);

  let rows = (data ?? []) as FragmentRow[];

  if (options.q?.trim()) {
    const lower = options.q.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.content && r.content.toLowerCase().includes(lower)) ||
        (r.title && r.title.toLowerCase().includes(lower)) ||
        (Array.isArray(r.tag_ids) && r.tag_ids.some((t: string) => t.toLowerCase().includes(lower)))
    );
  }

  return rows;
}

/** 单条删除 */
export async function deleteFragment(id: string): Promise<void> {
  const { error } = await supabase.from("fragments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** 更新碎片状态（如 pending → archived） */
export async function updateFragmentStatus(
  id: string,
  status: "inbox" | "archived" | "burned"
): Promise<void> {
  const { error } = await supabase
    .from("fragments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
