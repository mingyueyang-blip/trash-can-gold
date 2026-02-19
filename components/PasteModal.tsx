"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type State = "idle" | "processing" | "success" | "error";

interface PasteModalProps {
  state: State;
  onClose: () => void;
  /** 成功时展示的标签名 */
  tags?: { name: string }[];
  /** 成功时的摘要（或已入库提示） */
  summary?: string;
  /** 降级提示（如：无法抓取正文，仅保存链接） */
  warning?: string;
  /** 错误信息 */
  errorMessage?: string;
  /** 成功展示后 2 秒自动关闭（固定 2000，不随 re-render 重置） */
  autoCloseMs?: number;
}

export function PasteModal({
  state,
  onClose,
  tags = [],
  summary,
  warning,
  errorMessage,
  autoCloseMs = 2000,
}: PasteModalProps) {
  const autoCloseDone = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (state === "idle") autoCloseDone.current = false;
  }, [state]);

  // 仅依赖 state / autoCloseMs，避免 onClose 每次渲染变化导致 timeout 被 clear 掉
  useEffect(() => {
    if (state !== "success" || autoCloseMs <= 0 || autoCloseDone.current) return;
    autoCloseDone.current = true;
    const t = setTimeout(() => onCloseRef.current(), autoCloseMs);
    return () => clearTimeout(t);
  }, [state, autoCloseMs]);

  if (state === "idle") return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* 高斯模糊背景 */}
        <motion.div
          className="absolute inset-0 bg-white/30 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => state !== "processing" && onClose()}
        />

        <motion.div
          className="relative rounded-[24px] bg-white/90 px-8 py-6 shadow-xl max-w-md w-full"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {state === "processing" && (
            <div className="text-center py-4">
              <div className="inline-block w-8 h-8 border-2 border-[#805ad5] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[#4a5568]">处理中...</p>
            </div>
          )}

          {state === "success" && (
            <div className="space-y-4">
              <p className="text-sm text-[#4a5568]">
                {summary ?? "已成功入库，可前往收件箱查看。"}
              </p>
              {warning && (
                <p className="text-xs text-[#718096]">{warning}</p>
              )}
              <div className="flex flex-wrap gap-2 justify-center">
                {tags.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-[#e9d8fd] text-[#805ad5]"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
              <p className="text-xs text-[#a0aec0] text-center">
                2 秒后自动关闭
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="text-center py-2">
              <p className="text-[#e53e3e]">{errorMessage ?? "请求失败"}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 text-sm text-[#718096] underline"
              >
                关闭
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
