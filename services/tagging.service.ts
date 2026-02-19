/**
 * AI 打标服务
 * 先抓取再打标：组合「标题 + 原作者标签 + 正文摘要」后发送给模型，生成结构化 3 标签
 */
import { llm, CHAT_MODEL } from "@/lib/llm";

export interface SuggestedTag {
  name: string;
}

export interface TaggingInput {
  /** 正文摘要（或纯文本内容） */
  content: string;
  /** 链接抓取后的标题，纯文本时可为空 */
  title?: string | null;
  /** 从页面提取的 #话题 / keywords */
  originalTags?: string[];
}

/** 从模型返回文本中解析出 3 个标签（逗号/顿号分隔或 JSON 数组） */
function parseTagNames(text: string): string[] {
  const raw = text.trim();
  const jsonMatch = raw.match(/\[[\s\S]*?\]/);
  if (jsonMatch) {
    try {
      const arr = JSON.parse(jsonMatch[0]) as unknown;
      if (Array.isArray(arr)) {
        return arr
          .filter((x): x is string => typeof x === "string")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 3);
      }
    } catch {
      // 解析失败则走分隔符逻辑
    }
  }
  return raw
    .split(/[,，、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

const STRUCTURED_PROMPT = `你是一个个人知识库的标签助手。用户会提供「标题」「原作者标签（如 #话题）」和「正文摘要」。
请优先依据「标题」与「原作者标签」生成标签（二者为最高权重），正文摘要作为补充参考。
生成恰好 3 个中文标签，严格按以下顺序与类型（每类一个）：
1. [领域/学科]：如心理学、前端开发、商业、产品
2. [具体事物/人物]：如正念冥想、React、某某公司、某本书名
3. [信息属性]：如教程、金句、新闻、复盘、观点、访谈

只输出 3 个标签，用逗号分隔，不要编号、不要解释。示例：心理学, 正念冥想, 教程`;

/**
 * 根据组合后的内容生成 3 个结构化标签
 */
export async function suggestTags(input: string | TaggingInput): Promise<SuggestedTag[]> {
  if (!process.env.DASHSCOPE_API_KEY) {
    return [{ name: "未配置" }, { name: "通义" }, { name: "标签" }];
  }

  let title: string | null = null;
  let originalTags: string[] = [];
  let content: string;

  if (typeof input === "string") {
    content = input.slice(0, 3000);
  } else {
    title = input.title ?? null;
    originalTags = input.originalTags ?? [];
    content = input.content.slice(0, 3000);
  }

  const parts: string[] = [];
  if (title) parts.push(`【标题】${title}`);
  if (originalTags.length > 0) parts.push(`【原作者标签 / #话题】${originalTags.join(" ")}`);
  parts.push(`【正文摘要（补充参考）】\n${content}`);

  const combined = parts.join("\n\n");

  const res = await llm.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: STRUCTURED_PROMPT },
      { role: "user", content: combined },
    ],
    max_tokens: 80,
  });

  const text = res.choices[0]?.message?.content?.trim() ?? "";
  const names = parseTagNames(text);

  return names.map((name) => ({ name }));
}

/** Jina 抓取失败时的兜底：仅根据 URL 路径/域名做语义盲猜，至少返回 1 个分类标签 */
const URL_BLIND_GUESS_PROMPT = `你仅能根据以下链接推断内容可能属于的分类。可参考：域名（如 xiaohongshu=生活/种草、mp.weixin.qq.com=公众号文章）、路径或参数中的关键词。
请给出 1～3 个简短中文标签（如：美妆、旅行、科技、职场、生活、读书、未分类）。若完全无法推断则只返回一个：未分类。
只输出标签，逗号分隔，不要解释。`;

export async function suggestTagsFromUrlOnly(url: string): Promise<SuggestedTag[]> {
  if (!process.env.DASHSCOPE_API_KEY) {
    return [{ name: "未分类" }];
  }
  const res = await llm.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: URL_BLIND_GUESS_PROMPT },
      { role: "user", content: `链接：${url.slice(0, 500)}` },
    ],
    max_tokens: 60,
  });
  const text = res.choices[0]?.message?.content?.trim() ?? "";
  const names = parseTagNames(text);
  if (names.length === 0) names.push("未分类");
  return names.map((name) => ({ name }));
}
