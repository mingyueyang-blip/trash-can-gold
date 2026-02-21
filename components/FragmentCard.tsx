"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

type CardViewMode = "inbox" | "alchemy" | "archive";

interface FragmentCardProps {
  id: string;
  content: string;
  sourceType: string;
  sourceUrl: string | null;
  sourceTitle?: string | null;
  sourceContent?: string | null;
  tagIds: string[];
  title: string | null;
  createdAt: string;
  viewMode?: CardViewMode;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onMoveOut?: (id: string) => void;
  onRefine?: (id: string) => void;
  /** 从星图侧边栏跳转过来时高亮：黄框 + 震动 */
  isHighlighted?: boolean;
}

/** 根据 source_url / sourceType 得到来源标识文案（卡片左上角） */
function getSourceTag(
  sourceType: string,
  sourceUrl: string | null
): string {
  if (sourceType === "text" || !sourceUrl) return "来自 ✍️ 随手粘贴";
  const u = sourceUrl.toLowerCase();
  if (u.includes("xiaohongshu.com")) return "来自 小红书";
  if (u.includes("mp.weixin.qq.com")) return "来自 微信公众号";
  if (u.includes("xiaoyuzhoufm.com") || u.includes("xiaoyuzhou")) return "来自 小宇宙";
  return "来自 链接";
}

/** 是否为空内容（用于展示「展开原文」等） */
function isEmptyContentFragment(content: string): boolean {
  if (!content || !content.trim()) return true;
  if (content.includes("暂无正文") || content.includes("可前往淬炼补充")) return true;
  if (content.includes("该页面暂时无法抓取") && content.includes("仅保存链接")) return true;
  return false;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function shortenUrl(url: string, maxLen = 40) {
  if (url.length <= maxLen) return url;
  return url.slice(0, 18) + "…" + url.slice(-18);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function FragmentCard({
  id,
  content,
  sourceType,
  sourceUrl,
  sourceTitle,
  sourceContent,
  tagIds,
  title,
  createdAt,
  viewMode = "inbox",
  onDelete,
  onArchive,
  onMoveOut,
  onRefine,
  isHighlighted = false,
}: FragmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [flying, setFlying] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);
  const sourceTag = getSourceTag(sourceType, sourceUrl);
  const hasSource = Boolean(sourceTitle?.trim() || sourceContent?.trim());
  const hasUser = Boolean(title?.trim() || content?.trim());
  const emptyContent = isEmptyContentFragment(content);

  const handleArchive = () => {
    if (!onArchive) return;
    setFlying(true);
    setTimeout(() => {
      onArchive(id);
    }, 400);
  };

  const plainContent = (c: string) => (c.includes("<") ? stripHtml(c) : c);
  const preview = (c: string, max = 120) => plainContent(c).trim().slice(0, max) + (plainContent(c).length > max ? "…" : "");

  return (
    <motion.article
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={
        flying
          ? { opacity: 0, y: 80, scale: 0.9, transition: { duration: 0.4 } }
          : { opacity: 1, y: 0, scale: 1 }
      }
      exit={{ scale: 1.05, opacity: 0, transition: { duration: 0.2 } }}
      transition={{
        duration: 0.4,
        scale: { type: "spring", stiffness: 400, damping: 25 },
      }}
      className={`rounded-[24px] p-5 break-inside-avoid mb-5 relative group bg-white/40 backdrop-blur-md shadow-sm border ${
        isHighlighted ? "border-2 border-amber-400 shadow-amber-200/50 " : "border border-white/50"
      } ${isHighlighted ? "animate-card-shake" : ""}`}
      whileHover={{ scale: 1.02 }}
    >
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="absolute top-3 right-3 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-[#4a5568] hover:text-[#e53e3e] transition-colors"
          title="删除"
          aria-label="删除"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      )}
      <div className="flex items-center gap-2 mb-2 pr-8">
        <span className="text-xs font-medium text-[#805ad5]">
          {sourceTag}
        </span>
        {sourceUrl && sourceType !== "text" && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#a0aec0] truncate max-w-[160px] hover:underline"
          >
            {shortenUrl(sourceUrl)}
          </a>
        )}
        <span className="text-xs text-[#a0aec0] ml-auto">
          {formatDate(createdAt)}
        </span>
      </div>

      {/* 第一块：抓取的（灰） */}
      {hasSource && (
        <div className="mb-3 text-[#718096] text-sm">
          {sourceTitle?.trim() && (
            <p className="font-medium text-[#4a5568] mb-1">{sourceTitle.trim()}</p>
          )}
          {sourceContent?.trim() && (
            <p className="leading-relaxed whitespace-pre-wrap break-words">
              {sourceType === "text" && !sourceTitle?.trim()
                ? preview(sourceContent, 200)
                : preview(sourceContent, 120)}
            </p>
          )}
        </div>
      )}

      {/* 第二块：我写的（粉） */}
      {(hasUser || !hasSource) && (
        <div className="mb-3 text-[#b83280]/90">
          {title?.trim() && (
            <p className="font-semibold text-[#922b6c] mb-1">{title.trim()}</p>
          )}
          {content?.trim() && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {preview(content, 200)}
            </p>
          )}
          {!hasSource && sourceUrl && sourceType === "link" && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#b83280]/80 hover:underline"
            >
              {shortenUrl(sourceUrl, 50)}
            </a>
          )}
        </div>
      )}

      {sourceUrl && sourceType === "link" && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[#a0aec0] hover:text-[#805ad5] mb-2"
        >
          <span aria-hidden>🔗</span> 原始链接
        </a>
      )}

      {tagIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tagIds.map((t, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#e9d8fd] text-[#805ad5]"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        {(hasUser && !emptyContent) || (hasSource && (sourceContent?.trim() ?? "").length > 120) ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-[#805ad5] hover:underline"
          >
            {expanded ? "收起原文" : "展开原文"}
          </button>
        ) : null}
        {(!hasUser || emptyContent) && onRefine && viewMode !== "alchemy" && (
          <button
            type="button"
            onClick={() => onRefine(id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#805ad5] text-white hover:bg-[#6b46c1]"
          >
            🔥 淬炼补充
          </button>
        )}
        {viewMode === "alchemy" && (
          <>
            {onArchive && (
              <motion.button
                type="button"
                onClick={handleArchive}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#e9d8fd] text-[#805ad5] hover:bg-[#ddd6fe] transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                归档
              </motion.button>
            )}
            {onRefine && (
              <motion.button
                type="button"
                onClick={() => onRefine(id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#805ad5] text-white hover:bg-[#6b46c1]"
                whileTap={{ scale: 0.98 }}
              >
                淬炼
              </motion.button>
            )}
          </>
        )}
        {viewMode !== "archive" && viewMode !== "alchemy" && (onArchive || onRefine) && (
          <>
            {onRefine && (
              <motion.button
                type="button"
                onClick={() => onRefine(id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#805ad5] text-white hover:bg-[#6b46c1] transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                淬炼
              </motion.button>
            )}
            {onArchive && (
              <motion.button
                type="button"
                onClick={handleArchive}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#e9d8fd] text-[#805ad5] hover:bg-[#ddd6fe] transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                ✨ 归档
              </motion.button>
            )}
          </>
        )}
        {viewMode === "archive" && onMoveOut && (
          <button
            type="button"
            onClick={() => onMoveOut(id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-black/10 text-[#4a5568] hover:bg-black/15 transition-colors"
          >
            🗑️ 移出
          </button>
        )}
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 pt-2 border-t border-gray-200 space-y-2"
        >
          {sourceContent?.trim() && (
            <div className="text-xs text-[#718096] whitespace-pre-wrap">{sourceContent}</div>
          )}
          {content?.trim() && (
            <div className="text-xs text-[#b83280]/90 whitespace-pre-wrap">{content}</div>
          )}
        </motion.div>
      )}
    </motion.article>
  );
}
