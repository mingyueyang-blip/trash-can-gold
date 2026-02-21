/**
 * 捕获服务
 * 先抓取再打标：链接先走 Jina 抓取标题+正文+原作者标签，再组合打标；纯文本直接打标
 */
import { supabase } from "@/lib/supabase";
import { suggestTags, suggestTagsFromUrlOnly } from "./tagging.service";
import { fetchWithJina } from "./jina.service";
import type { CapturePayload, CaptureResult, Fragment } from "@/types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 执行一次捕获：链接则先 Jina 抓取再打标，纯文本则直接打标；写入待处理池
 */
export async function captureFragment(
  payload: CapturePayload
): Promise<CaptureResult> {
  const { type, content } = payload;
  const now = new Date().toISOString();

  let title: string | undefined;
  let contentToStore: string;
  let suggestedTags: { name: string }[];

  let warning: string | undefined;

  if (type === "link") {
    const url = content.trim();
    let fetchedOk = false;
    try {
      const fetched = await fetchWithJina(url);
      title = fetched.title;
      contentToStore = fetched.content;
      suggestedTags = await suggestTags({
        content: fetched.content,
        title: fetched.title,
        originalTags: fetched.originalTags,
      });
      fetchedOk = true;
    } catch (_e) {
      // 任何抓取/打标失败都不报错，仅保存标题+URL+标签
    }
    if (!fetchedOk) {
      try {
        const fullUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
        const fallback = await fetch(fullUrl, { signal: AbortSignal.timeout(5000) });
        const html = await fallback.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        title = titleMatch ? titleMatch[1].trim().slice(0, 200) : undefined;
      } catch {
        // ignore
      }
      if (!title) title = url.length > 60 ? url.slice(0, 60) + "…" : url;
      contentToStore = "";
      suggestedTags = (await suggestTagsFromUrlOnly(url)).slice(0, 3);
      warning = "该页面暂时无法抓取正文，已仅保存标题与链接，可前往淬炼补充。";
    }
  } else {
    contentToStore = content.trim();
    suggestedTags = await suggestTags(contentToStore);
  }

  const id = generateId();
  const baseRow = {
    id,
    content: type === "link" ? "" : contentToStore,
    source_type: type === "link" ? "link" : "text",
    source_url: type === "link" ? content.trim() : null,
    tag_ids: suggestedTags.map((t) => t.name),
    status: "inbox",
    created_at: now,
    updated_at: now,
    title: type === "link" ? "" : (title ?? null),
  };

  let insertRow: Record<string, unknown> = {
    ...baseRow,
    title: type === "link" ? (title ?? null) : baseRow.title,
    content: contentToStore,
  };

  if (type === "link") {
    insertRow = {
      ...insertRow,
      title: "",
      content: "",
      source_title: title ?? null,
      source_content: contentToStore,
    };
  }

  let { error } = await supabase.from("fragments").insert(insertRow);
  if (error && (error.message?.includes("source_title") || error.message?.includes("source_content"))) {
    insertRow = {
      id,
      content: contentToStore,
      source_type: baseRow.source_type,
      source_url: baseRow.source_url,
      tag_ids: baseRow.tag_ids,
      status: baseRow.status,
      created_at: baseRow.created_at,
      updated_at: baseRow.updated_at,
      title: title ?? null,
    };
    const retry = await supabase.from("fragments").insert(insertRow);
    error = retry.error;
  }

  if (error) {
    throw new Error(`写入失败: ${error.message}`);
  }

  return {
    fragmentId: id,
    suggestedTags: suggestedTags.map((t) => ({ id: "", name: t.name })),
    warning,
  };
}
