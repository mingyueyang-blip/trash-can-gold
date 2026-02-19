/**
 * Jina Reader 抓取服务（主抓取引擎）
 * 小红书 / 微信公众号 不直接 fetch，强制通过 https://r.jina.ai/[URL] 代理请求，并在 Header 中带 JINA_API_KEY
 */
const JINA_BASE = "https://r.jina.ai";

export interface JinaFetchResult {
  title: string;
  content: string;
  /** 从正文或 meta 提取的 #话题 / keywords */
  originalTags: string[];
}

/** 是否为必须经 Jina 代理的平台（不直接抓取） */
function isJinaRequiredHost(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes("xiaohongshu.com") || u.includes("xhslink.com") || u.includes("mp.weixin.qq.com");
}

/** 从 Markdown 中提取 #话题 标签（小红书等） */
function extractHashtagsFromMarkdown(md: string): string[] {
  const matches = md.match(/#[^\s#]+/g) || [];
  return Array.from(new Set(matches.map((m) => m.slice(1).trim()).filter(Boolean))).slice(0, 15);
}

/** 从 Markdown 首行提取标题（# 开头的第一个标题） */
function extractTitleFromMarkdown(md: string): string {
  const firstLine = md.trim().split("\n")[0] || "";
  const match = firstLine.match(/^#\s+(.+)$/);
  return match ? match[1].trim() : "";
}

/** 判断 URL 属于哪个平台，用于后续可扩展的差异化解析 */
function getPlatform(url: string): "xiaohongshu" | "weixin" | "xiaoyuzhou" | "other" {
  const u = url.toLowerCase();
  if (u.includes("xiaohongshu") || u.includes("xhslink")) return "xiaohongshu";
  if (u.includes("mp.weixin.qq.com") || u.includes("weixin")) return "weixin";
  if (u.includes("xiaoyuzhou")) return "xiaoyuzhou";
  return "other";
}

/**
 * 通过 Jina Reader 代理抓取 URL（小红书/公众号强制走此路径，不直接 fetch）
 * 请求格式：GET https://r.jina.ai/[完整URL]，Header 带 Authorization: Bearer JINA_API_KEY
 */
export async function fetchWithJina(url: string): Promise<JinaFetchResult> {
  const apiKey = process.env.JINA_API_KEY;
  const fullUrl = url.startsWith("http") ? url : `https://${url}`;

  if (isJinaRequiredHost(fullUrl) && !apiKey) {
    throw new Error("小红书/公众号链接需在 .env 中配置 JINA_API_KEY 后重试");
  }

  const target = `${JINA_BASE}/${fullUrl}`;
  const headers: HeadersInit = {
    Accept: "text/markdown",
    "X-Return-Format": "markdown",
  };
  if (apiKey) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${apiKey}`;
  }

  const res = await fetch(target, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    throw new Error(`Jina 抓取失败: ${res.status} ${res.statusText}`);
  }

  const raw = await res.text();
  const markdown = raw.trim();

  const title = extractTitleFromMarkdown(markdown) || "（无标题）";
  const contentSummary = markdown.slice(0, 6000);
  const platform = getPlatform(url);

  let originalTags: string[] = extractHashtagsFromMarkdown(markdown);

  if (platform === "xiaohongshu") {
    originalTags = originalTags.slice(0, 10);
  } else if (platform === "weixin" || platform === "xiaoyuzhou") {
    originalTags = originalTags.slice(0, 8);
  }

  return {
    title,
    content: contentSummary,
    originalTags,
  };
}
