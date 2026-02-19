"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  captureApi,
  listFragmentsApi,
  updateFragmentStatusApi,
} from "@/lib/api-client";
import { PasteModal } from "@/components/PasteModal";
import { Toast } from "@/components/Toast";
import { SearchBar } from "@/components/SearchBar";
import { MasonryGrid } from "@/components/MasonryGrid";
import { Dock } from "@/components/Dock";
import { AlchemyView } from "@/components/AlchemyView";
import { SettingsView } from "@/components/SettingsView";

type ModalState = "idle" | "processing" | "success" | "error";
type ActiveTab = "inbox" | "alchemy" | "archive" | "settings";

type FragmentItem = {
  id: string;
  content: string;
  sourceType: string;
  sourceUrl: string | null;
  tagIds: string[];
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function Home() {
  const [searchQ, setSearchQ] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [fragments, setFragments] = useState<FragmentItem[]>([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [modalTags, setModalTags] = useState<{ name: string }[]>([]);
  const [modalSummary, setModalSummary] = useState("");
  const [modalWarning, setModalWarning] = useState("");
  const [modalError, setModalError] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" as "success" | "error" });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("inbox");
  const [timeRange, setTimeRange] = useState<"all" | "3d" | "7d">("all");
  const [autoClearOn, setAutoClearOn] = useState(false);
  const autoClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchInbox = useCallback(async () => {
    try {
      const list = await listFragmentsApi({
        q: searchQ || undefined,
        status: "inbox",
      });
      setFragments(list);
      setInboxCount(list.length);
    } catch {
      setFragments([]);
      setInboxCount(0);
    }
  }, [searchQ]);

  const fetchArchive = useCallback(async () => {
    try {
      const list = await listFragmentsApi({
        q: searchQ || undefined,
        status: "archived",
      });
      setFragments(list);
    } catch {
      setFragments([]);
    }
  }, [searchQ]);

  useEffect(() => {
    if (activeTab === "inbox" || activeTab === "alchemy") fetchInbox();
    else if (activeTab === "archive") fetchArchive();
  }, [activeTab, fetchInbox, fetchArchive]);

  const searchFilter = useCallback(
    (list: FragmentItem[]) => {
      if (!searchQ.trim()) return list;
      const q = searchQ.trim().toLowerCase();
      return list.filter(
        (f) =>
          f.content.toLowerCase().includes(q) ||
          (f.title?.toLowerCase().includes(q) ?? false) ||
          f.tagIds.some((t) => t.toLowerCase().includes(q))
      );
    },
    [searchQ]
  );

  const filteredInbox = searchFilter(fragments);
  const filteredArchive = searchFilter(fragments);

  const refreshCurrent = useCallback(() => {
    if (activeTab === "inbox" || activeTab === "alchemy") fetchInbox();
    else if (activeTab === "archive") fetchArchive();
  }, [activeTab, fetchInbox, fetchArchive]);

  const onDeleteFragment = useCallback(
    async (id: string) => {
      try {
        const { deleteFragmentApi } = await import("@/lib/api-client");
        await deleteFragmentApi(id);
        setToast({ visible: true, message: "已删除", type: "success" });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
        refreshCurrent();
      } catch (e) {
        setToast({
          visible: true,
          message: e instanceof Error ? e.message : "删除失败",
          type: "error",
        });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
      }
    },
    [refreshCurrent]
  );

  const onArchiveFragment = useCallback(
    async (id: string) => {
      try {
        await updateFragmentStatusApi(id, "archived");
        setFragments((prev) => prev.filter((f) => f.id !== id));
        setInboxCount((c) => Math.max(0, c - 1));
        setToast({ visible: true, message: "已归档", type: "success" });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
      } catch (e) {
        setToast({
          visible: true,
          message: e instanceof Error ? e.message : "归档失败",
          type: "error",
        });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
      }
    },
    []
  );

  const onMoveOutFragment = useCallback(
    async (id: string) => {
      try {
        await updateFragmentStatusApi(id, "inbox");
        setFragments((prev) => prev.filter((f) => f.id !== id));
        setInboxCount((c) => c + 1);
        setToast({ visible: true, message: "已移出至收件箱", type: "success" });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
      } catch (e) {
        setToast({
          visible: true,
          message: e instanceof Error ? e.message : "操作失败",
          type: "error",
        });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
      }
    },
    []
  );

  // 定时清理：开启后 5 分钟无操作自动清空输入框，输入或炼金时重置倒计时
  const AUTO_CLEAR_MS = 5 * 60 * 1000;

  const resetAutoClearTimer = useCallback(() => {
    if (autoClearTimerRef.current) {
      clearTimeout(autoClearTimerRef.current);
      autoClearTimerRef.current = null;
    }
    if (!autoClearOn) return;
    autoClearTimerRef.current = setTimeout(() => {
      autoClearTimerRef.current = null;
      setInputValue("");
      setToast({ visible: true, message: "输入框已定时清空", type: "success" });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
    }, AUTO_CLEAR_MS);
  }, [autoClearOn, AUTO_CLEAR_MS]);

  useEffect(() => {
    resetAutoClearTimer();
    return () => {
      if (autoClearTimerRef.current) clearTimeout(autoClearTimerRef.current);
    };
  }, [resetAutoClearTimer, inputValue]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
  };

  const doCapture = useCallback(
    async (type: "text" | "link", content: string) => {
      if (!content.trim()) return;
      setModalState("processing");
      setModalTags([]);
      setModalSummary("");
      setModalWarning("");
      setModalError("");
      try {
        const res = await captureApi({ type, content: content.trim() });
        setModalTags(res.suggestedTags.map((t) => ({ name: t.name })));
        setModalSummary(res.warning ? "已保存链接，可前往收件箱查看。" : "已成功入库，可前往收件箱查看。");
        setModalWarning(res.warning ?? "");
        setModalState("success");
        showToast("炼金成功", "success");
        fetchInbox();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "炼金失败";
        setModalError(msg);
        setModalState("error");
        showToast(msg, "error");
      }
    },
    [fetchInbox]
  );

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text?.trim()) {
        showToast("剪贴板为空", "error");
        return;
      }
      const trimmed = text.trim();
      doCapture(/^https?:\/\//.test(trimmed) ? "link" : "text", trimmed);
    } catch {
      showToast("无法读取剪贴板，请允许剪贴板权限后重试", "error");
    }
  }, [doCapture]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text")?.trim();
      if (!text) return;
      e.preventDefault();
      const isLink = /^https?:\/\//.test(text);
      doCapture(isLink ? "link" : "text", text);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [doCapture]);

  const onRefine = useCallback(() => {
    const content = inputValue.trim();
    if (!content) {
      showToast("请先输入或粘贴内容", "error");
      return;
    }
    setLoading(true);
    const isLink = /^https?:\/\//.test(content);
    doCapture(isLink ? "link" : "text", content).finally(() => setLoading(false));
    setInputValue("");
  }, [inputValue, doCapture]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        onRefine();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRefine]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E0C3FC] to-[#8EC5FC]">
      <main className="min-h-screen pb-32 md:pb-28 max-w-[800px] mx-auto px-4 sm:px-5 pt-6 sm:pt-8">
        <div className="bg-white/40 backdrop-blur-md rounded-[24px] shadow-lg border border-white/50 p-6 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-[32px] font-semibold text-[#2d3748]">
              炼金炉
            </h1>
            <p className="mt-3 text-base text-[#718096]">
              The Alchemy Cube · Sprint 1
            </p>
            <p className="mt-2 text-base text-[#718096]">
              只管投喂，剩下的交给 AI。
            </p>
          </div>

          {activeTab !== "settings" && (
            <div className="mb-6">
              <SearchBar value={searchQ} onChange={setSearchQ} />
            </div>
          )}

          {(activeTab === "inbox" || activeTab === "alchemy") && (
          <>
            <motion.section
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="把你的想法、片段、灵感丢进炼金炉…"
                className="w-full min-h-[180px] rounded-2xl p-5 resize-y focus:outline-none placeholder:text-[#a0aec0] text-[#2d3748] border-0"
                style={{ background: "rgba(255,255,255,0.8)" }}
              />
              <div className="flex justify-center items-center gap-3 mt-3">
                <motion.button
                  type="button"
                  onClick={onRefine}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl text-white font-medium disabled:opacity-70 bg-[#f687b3]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? "炼金中…" : "炼金"}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setInputValue("");
                    showToast("已清空输入框", "success");
                  }}
                  className="px-6 py-3 rounded-xl font-medium text-[#718096] border border-gray-300 hover:bg-white/50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  清空
                </motion.button>
              </div>
            </motion.section>
            <div className="flex items-center justify-center gap-2 py-4">
              <span className="text-sm text-[#718096]">
                定时清理（5 分钟无操作清空）
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={autoClearOn}
                onClick={() => setAutoClearOn((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  autoClearOn ? "bg-[#805ad5]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow ${
                    autoClearOn ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </>
        )}

        <AnimatePresence mode="wait">
          {activeTab === "inbox" && (
            <motion.div
              key="inbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <MasonryGrid
                items={filteredInbox}
                viewMode="inbox"
                onDelete={onDeleteFragment}
                onArchive={onArchiveFragment}
                emptyMessage="暂无碎片，粘贴或输入内容后点击「炼金」开始收集"
              />
            </motion.div>
          )}
          {activeTab === "alchemy" && (
            <motion.div
              key="alchemy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AlchemyView
                fragments={filteredInbox}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                onArchive={onArchiveFragment}
                onDelete={onDeleteFragment}
              />
            </motion.div>
          )}
          {activeTab === "archive" && (
            <motion.div
              key="archive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={async () => {
                    const escapeHtml = (s: string) =>
                      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
                    const nl2br = (s: string) => escapeHtml(s).replace(/\n/g, "<br/>");
                    const items = filteredArchive.map((f) => {
                      const title = f.title?.trim() || "无标题";
                      const date = new Date(f.createdAt).toLocaleString("zh-CN");
                      const tagStr = f.tagIds.length ? ` · ${f.tagIds.join(", ")}` : "";
                      return { title, date, tagStr, content: f.content };
                    });
                    const html = [
                      "<div>",
                      items
                        .map(
                          (f) =>
                            `<h2 style="margin:1em 0 0.5em;font-size:1.1em;font-weight:600;">${escapeHtml(f.title)}</h2>` +
                            `<p style="margin:0;font-size:0.85em;color:#718096;">${escapeHtml(f.date)}${escapeHtml(f.tagStr)}</p>` +
                            `<div style="margin:0.5em 0 1em;white-space:pre-wrap;">${nl2br(f.content)}</div>`
                        )
                        .join("<hr style='margin:1em 0;border:none;border-top:1px solid #e2e8f0;'/>"),
                      "</div>",
                    ].join("");
                    const plain = [
                      "归档",
                      ...items.map(
                        (f) =>
                          `${f.title}\n${f.date}${f.tagStr}\n\n${f.content}\n\n---`
                      ),
                    ].join("\n\n");
                    try {
                      await navigator.clipboard.write([
                        new ClipboardItem({
                          "text/html": new Blob([html], { type: "text/html;charset=utf-8" }),
                          "text/plain": new Blob([plain], { type: "text/plain;charset=utf-8" }),
                        }),
                      ]);
                      showToast("已复制富文本到剪贴板", "success");
                    } catch {
                      await navigator.clipboard.writeText(plain);
                      showToast("已复制纯文本到剪贴板", "success");
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#e9d8fd] text-[#805ad5] text-sm font-medium hover:bg-[#ddd6fe]"
                >
                  📋 复制为富文本
                </button>
              </div>
              <MasonryGrid
                items={filteredArchive}
                viewMode="archive"
                onDelete={onDeleteFragment}
                onMoveOut={onMoveOutFragment}
                emptyMessage="暂无归档"
              />
            </motion.div>
          )}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <SettingsView />
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        <div className="fixed right-4 bottom-24 md:bottom-auto md:right-5 md:top-1/2 md:-translate-y-1/2 flex flex-col gap-3 items-end md:items-center z-50">
          <motion.button
            type="button"
            aria-label="从剪贴板炼金"
            onClick={pasteFromClipboard}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg bg-[#805ad5] hover:bg-[#6b46c1] border-2 border-white/50 backdrop-blur-sm md:w-12 md:h-12"
            style={{ boxShadow: "0 4px 14px rgba(129, 90, 213, 0.45)" }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title="从剪贴板炼金"
          >
            <span className="text-2xl font-light leading-none md:text-xl">+</span>
          </motion.button>
          <motion.button
            type="button"
            className="hidden md:flex w-12 h-12 rounded-full bg-white border border-gray-200 items-center justify-center text-gray-600 shadow-md"
            whileHover={{ scale: 1.08, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
            whileTap={{ scale: 0.95 }}
            title="菜单"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 4h4v4H2V4zm0 6h4v4H2v-4zm0 6h4v4H2v-4zm6-12h4v4H8V4zm0 6h4v4H8v-4zm0 6h4v4H8v-4zm6-12h4v4h-4V4zm0 6h4v4h-4v-4zm0 6h4v4h-4v-4z" />
            </svg>
          </motion.button>
          <motion.button
            type="button"
            className="hidden md:flex w-12 h-12 rounded-full items-center justify-center text-white shadow-md bg-[#f687b3]"
            whileHover={{ scale: 1.08, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
            whileTap={{ scale: 0.95 }}
            title="快速炼金"
            onClick={() => document.querySelector("textarea")?.focus()}
          >
            <span className="text-lg">✨A</span>
          </motion.button>
        </div>

      <PasteModal
        state={modalState}
        onClose={() => setModalState("idle")}
        tags={modalTags}
        summary={modalSummary}
        warning={modalWarning}
        errorMessage={modalError}
        autoCloseMs={2000}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />

      <Dock
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as ActiveTab)}
        inboxCount={inboxCount}
      />
      </main>
    </div>
  );
}
