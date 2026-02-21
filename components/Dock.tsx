"use client";

import { motion } from "framer-motion";

const items = [
  { id: "inbox", label: "收件箱", icon: "📥" },
  { id: "alchemy", label: "炼金", icon: "✨" },
  { id: "archive", label: "归档", icon: "📦" },
  { id: "refine", label: "淬炼", icon: "🔥" },
  { id: "starmap", label: "星图", icon: "🌌" },
  { id: "settings", label: "设置", icon: "⚙️" },
];

interface DockProps {
  activeId?: string;
  onSelect?: (id: string) => void;
  /** 收件箱待处理数量，用于红点或数字气泡 */
  inboxCount?: number;
}

export function Dock({ activeId = "inbox", onSelect, inboxCount = 0 }: DockProps) {
  const showBadge = inboxCount > 0;
  return (
    <motion.nav
      className="fixed left-0 right-0 bottom-0 md:left-1/2 md:right-auto md:bottom-6 md:-translate-x-1/2 z-[60] flex items-center px-4 py-3 pt-3 rounded-t-[24px] md:rounded-[24px] bg-white/40 backdrop-blur-md shadow-lg border-t border-white/50 md:border md:border-white/50 overflow-x-auto overflow-y-hidden"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-2 min-w-max md:mx-auto">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item.id)}
          className="relative flex flex-col items-center gap-1 min-w-[56px] flex-shrink-0 py-1 rounded-xl transition-transform hover:scale-110 active:scale-95"
        >
          <span
            className="text-xl w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
            style={{
              backgroundColor: activeId === item.id ? "#e9d8fd" : "transparent",
              boxShadow: activeId === item.id ? "0 0 0 2px rgba(129, 90, 213, 0.4)" : undefined,
            }}
          >
            {item.icon}
          </span>
          {item.id === "inbox" && showBadge && (
            <span
              className="absolute top-0 right-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#e53e3e] text-[10px] font-bold text-white px-1"
              aria-hidden
            >
              {inboxCount > 99 ? "99+" : inboxCount}
            </span>
          )}
          <span
            className={`text-[10px] ${activeId === item.id ? "text-[#805ad5] font-medium" : "text-[#718096]"}`}
          >
            {item.label}
          </span>
        </button>
      ))}
      </div>
    </motion.nav>
  );
}
