"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefineEditor } from "./RefineEditor";
import { RefineStarMap } from "./RefineStarMap";

/** 第二行：#标签气泡（与系统一致样式），输入 # 弹出已有标签或自定义输入 */
function RefineTagsRow({
  displayTags,
  allTags,
  onAddTag,
  onRemoveTag,
  onInsertIntoBody,
}: {
  displayTags: string[];
  allTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  onInsertIntoBody?: (tag: string) => void;
}) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const query = input.trim().toLowerCase().replace(/^#/, "").trim();
  const suggestions = useMemo(() => {
    if (!query) return allTags.slice(0, 12);
    return allTags.filter((t) => t.toLowerCase().includes(query)).slice(0, 12);
  }, [allTags, query]);

  const commitTag = (tag: string) => {
    const t = tag.trim();
    if (!t) return;
    if (!displayTags.includes(t)) onAddTag(t);
    onInsertIntoBody?.(t);
    setInput("");
    setShowSuggestions(false);
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="px-4 py-2 border-b border-white/30 flex flex-wrap gap-1.5 items-center min-h-[44px] relative" ref={ref}>
      {displayTags.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#e9d8fd] text-[#805ad5] inline-flex items-center gap-1"
        >
          #{t}
          {onRemoveTag && (
            <button
              type="button"
              onClick={() => onRemoveTag(t)}
              className="hover:bg-[#805ad5]/20 rounded-full p-0.5 leading-none"
              aria-label={`移除 ${t}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            if (query) commitTag(query);
            else if (suggestions[0]) commitTag(suggestions[0]);
          }
        }}
        placeholder="输入 # 选已有标签或输入新标签回车，仅显示在本行与右下角"
        className="flex-1 min-w-[140px] bg-transparent border-0 text-sm text-[#2d3748] placeholder:text-[#a0aec0] focus:outline-none focus:ring-0 py-1"
      />
      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || query) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-4 right-4 top-full mt-1 py-1 rounded-xl bg-white/90 backdrop-blur border border-white/50 shadow-lg z-20 max-h-[200px] overflow-auto"
          >
            {suggestions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => commitTag(t)}
                className="w-full text-left px-3 py-2 text-sm text-[#2d3748] hover:bg-[#e9d8fd]/50 rounded-lg"
              >
                #{t}
              </button>
            ))}
            {query && !allTags.map((x) => x.toLowerCase()).includes(query) && (
              <button
                type="button"
                onClick={() => commitTag(query)}
                className="w-full text-left px-3 py-2 text-sm text-[#805ad5] hover:bg-[#e9d8fd]/50 rounded-lg font-medium"
              >
                添加「{query}」
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface RefineFragment {
  id: string;
  content: string;
  sourceType: string;
  sourceUrl: string | null;
  sourceTitle?: string | null;
  sourceContent?: string | null;
  tagIds: string[];
  title: string | null;
  createdAt: string;
}

interface RefinePanelProps {
  open: boolean;
  onClose: () => void;
  fragment: RefineFragment | null;
  allFragments?: RefineFragment[];
  onSave?: (fragmentId: string, title: string, content: string) => Promise<void>;
}

function useUniqueTags(fragments: RefineFragment[]): string[] {
  return useMemo(() => {
    const set = new Set<string>();
    for (const f of fragments) {
      for (const t of f.tagIds || []) {
        if (t?.trim()) set.add(t.trim());
      }
    }
    return Array.from(set).sort();
  }, [fragments]);
}

/** 从正文 HTML/文本中提取 #标签 和 @引用（@标题） */
function extractTagsAndRefs(text: string): { tags: string[]; refs: string[] } {
  const tags = Array.from(text.matchAll(/#([^\s#]+)/g)).map((m) => m[1].trim()).filter(Boolean);
  const refs = Array.from(text.matchAll(/@([^\s@,，。！？\n\[\]]+)/g)).map((m) => m[1].trim()).filter(Boolean);
  return { tags: Array.from(new Set(tags)), refs: Array.from(new Set(refs)) };
}

export function RefinePanel({
  open,
  onClose,
  fragment,
  allFragments = [],
  onSave,
}: RefinePanelProps) {
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [displayTags, setDisplayTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const allTags = useUniqueTags(allFragments);

  // 中间编辑区强制留白：仅切换碎片时重置，title/content 始终为空，由用户手动填写
  useEffect(() => {
    if (fragment) {
      setTitle("");
      setBodyHtml("");
      setDisplayTags([...(fragment.tagIds || [])]);
    } else {
      setTitle("");
      setBodyHtml("");
      setDisplayTags([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragment?.id]);

  const handleSend = async () => {
    if (!fragment || !onSave) return;
    setSaving(true);
    try {
      await onSave(fragment.id, title.trim(), bodyHtml);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const { tags: tagsFromBody, refs: extractedRefs } = useMemo(
    () => extractTagsAndRefs(bodyHtml.replace(/<[^>]+>/g, " ")),
    [bodyHtml]
  );
  const tagsForStarMap = useMemo(
    () => Array.from(new Set([...displayTags, ...tagsFromBody])).filter(Boolean),
    [displayTags, tagsFromBody]
  );
  const relatedRefs = useMemo(
    () => [...extractedRefs].sort((a, b) => a.localeCompare(b, "zh-CN")),
    [extractedRefs]
  );
  const currentTitleNorm = (title.trim() || "(无标题)").toLowerCase();
  const displayTitleOf = (f: RefineFragment) => (f.title ?? f.sourceTitle)?.trim() || "(无标题)";
  const linksToCurrent = useMemo(() => {
    return allFragments
      .filter((f) => f.id !== fragment?.id)
      .filter((f) => {
        const plain = (f.content ?? "").replace(/<[^>]+>/g, " ");
        const refsInF = extractTagsAndRefs(plain).refs;
        return refsInF.some((r) => r.trim().toLowerCase() === currentTitleNorm);
      })
      .map((f) => displayTitleOf(f));
  }, [allFragments, fragment?.id, currentTitleNorm]);

  const leftEmpty = fragment && !fragment.content?.trim();

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="absolute inset-0 bg-black/25 backdrop-blur-sm z-[100]"
          onClick={onClose}
          aria-hidden
        />
        <motion.div
          className="relative z-[101] w-full max-w-6xl max-h-[95vh] rounded-[24px] bg-white/30 backdrop-blur-xl border border-white/50 shadow-2xl overflow-hidden flex flex-col"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/40">
            <h2 className="text-lg font-semibold text-[#2d3748]">淬炼</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/10 hover:bg-black/15 text-[#4a5568] flex items-center justify-center"
              aria-label="关闭"
            >
              ×
            </button>
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* 左栏：仅展示抓取到的 sourceTitle / sourceContent，与中间完全隔离 */}
            <div className="w-[28%] min-w-[200px] border-r border-white/40 p-4 overflow-auto bg-white/20">
              <div className="text-xs font-medium text-[#805ad5] mb-2">抓取结果</div>
              {fragment ? (
                <>
                  {fragment.sourceUrl && (
                    <>
                      <div className="text-xs text-[#718096] mb-1">链接</div>
                      <a
                        href={fragment.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#805ad5] break-all hover:underline mb-2"
                      >
                        {fragment.sourceUrl}
                      </a>
                    </>
                  )}
                  {(fragment.sourceTitle?.trim() || fragment.sourceContent?.trim()) ? (
                    <>
                      {fragment.sourceTitle?.trim() && (
                        <>
                          <div className="text-xs text-[#718096] mb-1">标题</div>
                          <h3 className="font-semibold text-[#2d3748] mb-2 break-words">{fragment.sourceTitle}</h3>
                        </>
                      )}
                      {fragment.sourceContent?.trim() ? (
                        <p className="text-sm text-[#4a5568] whitespace-pre-wrap break-words line-clamp-6">
                          {fragment.sourceContent}
                        </p>
                      ) : (
                        <p className="text-[#a0aec0] text-sm">抓取无正文，请在右侧手动填写。</p>
                      )}
                    </>
                  ) : (fragment.title?.trim() || fragment.content?.trim()) ? (
                    <>
                      <p className="text-[#a0aec0] text-xs mb-1">（当前卡片已有内容，仅作参考）</p>
                      {fragment.title?.trim() && (
                        <h3 className="font-semibold text-[#2d3748] mb-2 break-words">{fragment.title}</h3>
                      )}
                      {fragment.content?.trim() && (
                        <p className="text-sm text-[#4a5568] whitespace-pre-wrap break-words line-clamp-6">
                          {fragment.content}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[#a0aec0] text-sm">暂无抓取数据，请在右侧手动填写标题与正文。</p>
                  )}
                  {fragment.tagIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {fragment.tagIds.map((t, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#e9d8fd] text-[#805ad5]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[#a0aec0] text-sm">未选中碎片。</p>
              )}
            </div>

            {/* 中栏：标题 + #标签（输入 # 弹出已有标签）+ 富文本 + 右下角紫色飞机保存 */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-white/40 relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="标题"
                className="w-full px-4 py-3 text-lg font-bold bg-transparent border-0 border-b border-white/30 text-[#2d3748] placeholder:text-[#a0aec0] focus:outline-none focus:ring-0"
              />
              <RefineTagsRow
                displayTags={displayTags}
                allTags={allTags}
                onAddTag={(tag) => {
                  const t = tag.trim();
                  if (t && !displayTags.includes(t)) setDisplayTags((prev) => [...prev, t]);
                }}
                onRemoveTag={(tag) => setDisplayTags((prev) => prev.filter((x) => x !== tag))}
              />
              <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-white/30 bg-white/20 mx-4 mt-2 mb-2">
                <RefineEditor
                  key={fragment?.id ?? "none"}
                  initialContent={bodyHtml}
                  onContentChange={setBodyHtml}
                  editable={true}
                  noteTitles={allFragments
                    .filter((f) => f.id !== fragment?.id && displayTitleOf(f) !== "(无标题)")
                    .map((f) => displayTitleOf(f))}
                />
              </div>
              <div className="absolute bottom-4 right-4 z-10">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!fragment || saving}
                  className="w-10 h-10 rounded-full bg-[#805ad5] text-white flex items-center justify-center shadow-lg hover:bg-[#6b46c1] disabled:opacity-50"
                  title="发送保存"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 右栏：星图 → #标签 → 链接到当前的笔记 → 相关笔记 */}
            <div className="w-[28%] min-w-[220px] flex flex-col bg-white/20 overflow-hidden">
              <div className="text-xs font-medium text-[#805ad5] px-4 pt-4 pb-2">局部星图</div>
              <div className="min-h-[180px] px-2 pb-2 rounded-[24px] border border-white/20 backdrop-blur-sm overflow-hidden bg-transparent">
                <RefineStarMap
                  currentTitle={title.trim() || "当前笔记"}
                  tags={tagsForStarMap}
                  refTitles={extractedRefs}
                  height={180}
                />
              </div>
              <div className="text-xs font-medium text-[#805ad5] px-4 pt-2 pb-1"># 标签</div>
              <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                {displayTags.length ? (
                  displayTags.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#e9d8fd] text-[#805ad5]"
                    >
                      #{t}
                    </span>
                  ))
                ) : (
                  <span className="text-[#a0aec0] text-xs">与上方标签行同步</span>
                )}
              </div>
              <div className="text-xs font-medium text-[#805ad5] px-4 pt-2 pb-1">标题</div>
              <div className="px-4 pb-1">
                <span className="text-sm text-[#2d3748] font-medium truncate block" title={title || undefined}>
                  {title.trim() || "(无标题)"}
                </span>
              </div>
              <div className="text-xs font-medium text-[#805ad5] px-4 pt-2 pb-1">链接到当前的笔记</div>
              <div className="flex flex-col gap-1 px-4 pb-1 max-h-[120px] overflow-auto">
                {linksToCurrent.length ? (
                  linksToCurrent.map((r, i) => (
                    <span key={i} className="text-sm text-[#4a5568] truncate">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-[#a0aec0] text-xs">其他卡片正文中用 @标题 引用</span>
                )}
              </div>
              <div className="text-xs font-medium text-[#805ad5] px-4 pt-2 pb-1">相关笔记</div>
              <div className="flex flex-col gap-1 px-4 pb-4 max-h-[100px] overflow-auto">
                {relatedRefs.length ? (
                  relatedRefs.map((r, i) => (
                    <span key={i} className="text-sm text-[#4a5568] truncate">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-[#a0aec0] text-xs">正文中 @ 到的其他笔记，按标题排序</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
