"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type CardViewMode = "inbox" | "alchemy" | "archive";

interface FragmentCardProps {
  id: string;
  content: string;
  sourceType: string;
  sourceUrl: string | null;
  tagIds: string[];
  title: string | null;
  createdAt: string;
  viewMode?: CardViewMode;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onMoveOut?: (id: string) => void;
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

/** 是否为无效碎片（内容为空或抓取失败仅保存链接） */
function isInvalidFragment(content: string): boolean {
  if (!content || !content.trim()) return true;
  if (
    content.includes("无法抓取") &&
    (content.includes("仅保存链接") || content.includes("仅保存链接。"))
  )
    return true;
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

export function FragmentCard({
  id,
  content,
  sourceType,
  sourceUrl,
  tagIds,
  title,
  createdAt,
  viewMode = "inbox",
  onDelete,
  onArchive,
  onMoveOut,
}: FragmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [flying, setFlying] = useState(false);
  const sourceTag = getSourceTag(sourceType, sourceUrl);
  const invalid = isInvalidFragment(content);

  const handleArchive = () => {
    if (!onArchive) return;
    setFlying(true);
    setTimeout(() => {
      onArchive(id);
    }, 400);
  };

  const displayTitle =
    sourceType === "text"
      ? (content.trim().slice(0, 80) + (content.length > 80 ? "…" : "")).trim() || "（无标题）"
      : title?.trim();
  const hasRealTitle = Boolean(displayTitle && displayTitle !== "（无标题）");
  const previewLine =
    sourceType === "text"
      ? content.trim().slice(0, 120) + (content.length > 120 ? "…" : "")
      : content.slice(0, 120) + (content.length > 120 ? "…" : "");

  return (
    <motion.article
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
      className="rounded-[24px] p-5 break-inside-avoid mb-5 relative group bg-white/40 backdrop-blur-md shadow-sm border border-white/50"
      whileHover={{ scale: 1.02 }}
    >
      {invalid && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[24px] bg-red-50/80 backdrop-blur-sm z-10 pointer-events-none">
          <span className="px-3 py-1.5 rounded-lg bg-red-100/90 text-red-600 text-sm font-medium">
            无效碎片
          </span>
        </div>
      )}

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

      {hasRealTitle ? (
        <p className="font-semibold text-[#2d3748] text-sm leading-relaxed mb-2">
          {displayTitle}
        </p>
      ) : sourceUrl && sourceType === "link" ? (
        <p className="text-[#4a5568] text-sm mb-2">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {shortenUrl(sourceUrl, 50)}
          </a>
        </p>
      ) : null}

      <p className="text-[#4a5568] text-sm leading-relaxed mb-3">
        {sourceType === "text" ? previewLine : previewLine}
      </p>

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
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[#805ad5] hover:underline"
        >
          {expanded ? "收起原文" : "展开原文"}
        </button>
        {viewMode !== "archive" && onArchive && (
          <motion.button
            type="button"
            onClick={handleArchive}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#e9d8fd] text-[#805ad5] hover:bg-[#ddd6fe] transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            ✨ 归档
          </motion.button>
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
          className="mt-2 pt-2 border-t border-gray-200"
        >
          <p className="text-xs text-[#718096] whitespace-pre-wrap">
            {content}
          </p>
        </motion.div>
      )}
    </motion.article>
  );
}
