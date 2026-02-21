"use client";

import { AnimatePresence } from "framer-motion";
import { FragmentCard } from "./FragmentCard";

export type CardViewMode = "inbox" | "alchemy" | "archive";

interface Item {
  id: string;
  content: string;
  sourceType: string;
  sourceUrl: string | null;
  sourceTitle?: string | null;
  sourceContent?: string | null;
  tagIds: string[];
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MasonryGridProps {
  items: Item[];
  viewMode?: CardViewMode;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onMoveOut?: (id: string) => void;
  onRefine?: (id: string) => void;
  highlightFragmentId?: string | null;
  emptyMessage?: string;
}

export function MasonryGrid({
  items,
  viewMode = "inbox",
  onDelete,
  onArchive,
  onMoveOut,
  onRefine,
  highlightFragmentId = null,
  emptyMessage = "暂无碎片，粘贴或输入内容后点击「炼金」开始收集",
}: MasonryGridProps) {
  if (items.length === 0) {
    return (
      <p className="text-center text-[#718096] py-12">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className="columns-1 sm:columns-2 lg:columns-3 gap-3 sm:gap-5"
      style={{ columnFill: "balance" }}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <FragmentCard
            key={item.id}
            id={item.id}
            content={item.content}
            sourceType={item.sourceType}
            sourceUrl={item.sourceUrl}
            sourceTitle={item.sourceTitle}
            sourceContent={item.sourceContent}
            tagIds={item.tagIds}
            title={item.title}
            createdAt={item.createdAt}
            viewMode={viewMode}
            onDelete={onDelete}
            onArchive={onArchive}
            onMoveOut={onMoveOut}
            onRefine={onRefine}
            isHighlighted={highlightFragmentId === item.id}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
