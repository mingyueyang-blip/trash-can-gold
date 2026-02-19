/**
 * 炼金炉 · 核心类型定义
 * Sprint 1：碎片、标签、来源
 */

export type FragmentSourceType = "text" | "link" | "image" | "audio";

export interface Fragment {
  id: string;
  /** 原始内容或解析后的 Markdown 正文 */
  content: string;
  /** 来源类型 */
  sourceType: FragmentSourceType;
  /** 来源 URL（link/audio 时有值） */
  sourceUrl?: string;
  /** AI 生成的标签 ID 列表 */
  tagIds: string[];
  /** 状态：inbox | archived | burned */
  status: "inbox" | "archived" | "burned";
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 可选：标题（链接解析后） */
  title?: string;
}

export interface Tag {
  id: string;
  name: string;
  /** 父级标签 ID，用于层级化 */
  parentId?: string;
  createdAt: string;
}

export interface CapturePayload {
  /** text | link */
  type: "text" | "link";
  /** 粘贴的文本或链接 URL */
  content: string;
}

export interface CaptureResult {
  fragmentId: string;
  suggestedTags: { id: string; name: string }[];
  /** 当链接因 451 等无法抓取正文时，仅保存链接并用链接打标，此处会带提示文案 */
  warning?: string;
}
