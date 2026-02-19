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
    try {
      const fetched = await fetchWithJina(url);
      title = fetched.title;
      contentToStore = fetched.content;
      suggestedTags = await suggestTags({
        content: fetched.content,
        title: fetched.title,
        originalTags: fetched.originalTags,
      });
    } catch (e) {
      // Jina 也失败：不显示“无法访问”，改为根据 URL 语义盲猜至少一个分类标签
      const fallbackContent = `链接：${url}\n（该页面暂时无法抓取正文，已仅保存链接并根据链接智能推测标签。）`;
      contentToStore = fallbackContent;
      suggestedTags = await suggestTagsFromUrlOnly(url);
      warning = "该页面暂时无法抓取正文，已根据链接智能推测标签并保存。";
    }
  } else {
    contentToStore = content.trim();
    suggestedTags = await suggestTags(contentToStore);
  }

  const fragment: Pick<
    Fragment,
    "id" | "content" | "sourceType" | "sourceUrl" | "tagIds" | "status" | "createdAt" | "updatedAt" | "title"
  > = {
    id: generateId(),
    content: contentToStore,
    sourceType: type === "link" ? "link" : "text",
    sourceUrl: type === "link" ? content.trim() : undefined,
    tagIds: suggestedTags.map((t) => t.name),
    status: "inbox",
    createdAt: now,
    updatedAt: now,
    title: title,
  };

  const { error } = await supabase.from("fragments").insert({
    id: fragment.id,
    content: fragment.content,
    source_type: fragment.sourceType,
    source_url: fragment.sourceUrl ?? null,
    tag_ids: fragment.tagIds,
    status: fragment.status,
    created_at: fragment.createdAt,
    updated_at: fragment.updatedAt,
    title: fragment.title ?? null,
  });

  if (error) {
    throw new Error(`写入失败: ${error.message}`);
  }

  return {
    fragmentId: fragment.id,
    suggestedTags: suggestedTags.map((t) => ({ id: "", name: t.name })),
    warning,
  };
}
