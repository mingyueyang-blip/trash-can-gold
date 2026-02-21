"use client";

import { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

const extensions = [
  StarterKit,
  Placeholder.configure({
  placeholder: "输入 # 联想标签、@ 引用笔记标题；输入 1. 空格→编号列表，- 或 * 空格→圆点列表",
}),
];

interface RefineEditorProps {
  initialContent?: string;
  onContentChange?: (html: string) => void;
  editable?: boolean;
  /** 已有笔记标题，用于插入引用下拉 */
  noteTitles?: string[];
}

export function RefineEditor({
  initialContent = "",
  onContentChange,
  editable = true,
  noteTitles = [],
}: RefineEditorProps) {
  const [showRefDropdown, setShowRefDropdown] = useState(false);
  const refDropdownRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions,
    content: initialContent || "",
    editable,
    immediatelyRender: false, // 避免 Next.js SSR 水合不一致导致报错
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none text-[#2d3748]",
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "@") {
          event.preventDefault();
          setShowRefDropdown(true);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onContentChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && initialContent !== undefined && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent || "", { emitUpdate: false });
    }
  }, [initialContent, editor]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (refDropdownRef.current && !refDropdownRef.current.contains(e.target as Node)) setShowRefDropdown(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const insertRef = (title: string) => {
    editor?.chain().focus().insertContent(`@${title}`).run();
    setShowRefDropdown(false);
  };

  if (!editor) return null;

  const otherTitles = noteTitles.filter((t) => t?.trim()).slice(0, 20);

  return (
    <>
      <EditorContent editor={editor} />
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-white/50 bg-white/20 rounded-b-xl flex-wrap relative" ref={refDropdownRef}>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="加粗"
        >
          <b>B</b>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="小标题"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="圆点列表（或输入 - * 空格）"
        >
          •
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="编号列表（或输入 1. 空格）"
        >
          1.
        </ToolbarButton>
        <span className="text-[#a0aec0] text-xs mx-1"># 标签</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRefDropdown((v) => !v)}
            className="px-2 py-1 rounded text-xs font-medium text-[#4a5568] hover:bg-white/50"
            title="插入引用其他笔记"
          >
            @ 引用
          </button>
          {showRefDropdown && (
            <div className="absolute left-0 bottom-full mb-1 py-1 rounded-lg bg-white/95 backdrop-blur border border-white/50 shadow-lg z-20 max-h-[180px] overflow-auto min-w-[160px]">
              {otherTitles.length ? (
                otherTitles.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => insertRef(t)}
                    className="w-full text-left px-3 py-2 text-sm text-[#2d3748] hover:bg-[#e9d8fd]/50 truncate"
                  >
                    {t}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-[#a0aec0]">暂无其他笔记</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 rounded text-xs font-medium ${
        active ? "bg-[#e9d8fd] text-[#805ad5]" : "text-[#4a5568] hover:bg-white/50"
      }`}
    >
      {children}
    </button>
  );
}

export function getEditorHtml(editor: Editor | null): string {
  return editor?.getHTML() ?? "";
}
