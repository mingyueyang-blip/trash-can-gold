"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { listFragmentsApi } from "@/lib/api-client";
import {
  NODE_R,
  TITLE_LABEL_COLOR,
  TAG_LABEL_COLOR,
  TITLE_NODE_COLOR,
  TAG_NODE_COLOR,
  CHARGE_STRENGTH,
  COLLIDE_RADIUS,
} from "@/lib/starmap-visual";

type FragmentItem = {
  id: string;
  content: string;
  title: string | null;
  sourceTitle?: string | null;
  tagIds: string[];
  status: string;
  createdAt?: string;
  [key: string]: unknown;
};

type Node = {
  id: string;
  name: string;
  type: "title" | "tag";
  x?: number;
  y?: number;
};
type Link = { source: string; target: string };

function buildGraphData(list: FragmentItem[]) {
  const titleIds = new Set<string>();
  const tagIds = new Set<string>();
  const linkKeys = new Set<string>();
  const titleToFragments: Record<string, { id: string; status: string }[]> = {};
  const tagToFragments: Record<string, { id: string; status: string }[]> = {};

  for (const f of list) {
    const title = ((f.title ?? f.sourceTitle)?.trim() || "(无标题)").slice(0, 80);
    const tid = `title:${title}`;
    titleIds.add(tid);
    if (!titleToFragments[tid]) titleToFragments[tid] = [];
    titleToFragments[tid].push({ id: f.id, status: f.status || "inbox" });
    for (const t of f.tagIds || []) {
      if (!t?.trim()) continue;
      const tag = t.trim();
      const tagId = `tag:${tag}`;
      tagIds.add(tagId);
      linkKeys.add(`${tid}-${tagId}`);
      if (!tagToFragments[tagId]) tagToFragments[tagId] = [];
      tagToFragments[tagId].push({ id: f.id, status: f.status || "inbox" });
    }
  }

  const titleArr = Array.from(titleIds);
  const tagArr = Array.from(tagIds);
  const total = titleArr.length + tagArr.length;
  const nodes: Node[] = [
    ...titleArr.map((id, i) => ({
      id,
      name: id.replace(/^title:/, ""),
      type: "title" as const,
      x: 200 + 300 * Math.cos((i / Math.max(1, total)) * 2 * Math.PI),
      y: 200 + 200 * Math.sin((i / Math.max(1, total)) * 2 * Math.PI),
    })),
    ...tagArr.map((id, i) => ({
      id,
      name: id.replace(/^tag:/, ""),
      type: "tag" as const,
      x: 200 + 280 * Math.cos((Math.PI + (i / Math.max(1, tagArr.length)) * Math.PI)),
      y: 200 + 180 * Math.sin((i / Math.max(1, tagArr.length)) * Math.PI),
    })),
  ];

  const links: Link[] = Array.from(linkKeys).map((key) => {
    const sep = "-tag:";
    const i = key.indexOf(sep);
    if (i === -1) return null;
    const source = key.slice(0, i);
    const target = "tag:" + key.slice(i + sep.length);
    return { source, target };
  }).filter((l): l is Link => l != null);

  const nodeIdToFragments: Record<string, { id: string; status: string }[]> = {};
  Object.assign(nodeIdToFragments, titleToFragments, tagToFragments);

  return { nodes, links, nodeIdToFragments };
}

const LINK_STYLE = "rgba(200, 180, 230, 0.5)";

export function StarmapView({
  refreshTrigger = 0,
  onSelectFragment,
}: {
  refreshTrigger?: number;
  onSelectFragment?: (fragmentId: string, status: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<{
    _destructor?: () => void;
    graphData: (d?: { nodes: Node[]; links: Link[] }) => { nodes: Node[]; links: Link[] };
    width: (w: number) => unknown;
    height: (h: number) => unknown;
  } | null>(null);
  const fragmentsRef = useRef<FragmentItem[]>([]);
  const [fragments, setFragments] = useState<FragmentItem[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "empty" | "ready">("loading");
  const [selectedNode, setSelectedNode] = useState<{ id: string; name: string; type: "title" | "tag" } | null>(null);
  const [nodeIdToFragments, setNodeIdToFragments] = useState<Record<string, { id: string; status: string }[]>>({});
  const hoveredNodeIdRef = useRef<string | null>(null);
  const removeClickRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);
  const destroyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getConnectedIds = useCallback((nodeId: string, links: { source: string | { id: string }; target: string | { id: string } }[]) => {
    const set = new Set<string>([nodeId]);
    const idOf = (n: string | { id: string }) => (typeof n === "object" && n && "id" in n ? n.id : n);
    links.forEach((l) => {
      const s = idOf(l.source);
      const t = idOf(l.target);
      if (s === nodeId) set.add(t);
      if (t === nodeId) set.add(s);
    });
    return set;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (destroyTimeoutRef.current) {
      clearTimeout(destroyTimeoutRef.current);
      destroyTimeoutRef.current = null;
    }
    return () => {
      isMountedRef.current = false;
      removeClickRef.current?.();
      if (destroyTimeoutRef.current) clearTimeout(destroyTimeoutRef.current);
      destroyTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current && graphRef.current) {
          try {
            graphRef.current._destructor?.();
            graphRef.current = null;
          } catch {}
        }
        destroyTimeoutRef.current = null;
      }, 0);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) {
      console.log("[StarmapView] 未执行：无 containerRef");
      return;
    }
    setLoadState("loading");
    console.log("[StarmapView] 开始请求碎片列表…");

    listFragmentsApi({})
      .then((list) => {
        const fullList = list as FragmentItem[];
        fragmentsRef.current = fullList;
        setFragments(fullList);
        const { nodes, links, nodeIdToFragments: n2f } = buildGraphData(fullList);
        setNodeIdToFragments(n2f);
        console.log("[StarmapView] 接口返回：碎片数", fullList.length, "节点数", nodes.length, "边数", links.length);
        if (!nodes.length) {
          setLoadState("empty");
          console.log("[StarmapView] 无节点，显示空状态");
          return;
        }
        setLoadState("ready");

      const el = containerRef.current;
      if (!el) {
        console.log("[StarmapView] 无容器元素，跳过创建图");
        return;
      }

      /** 等布局完成再创建图，避免容器尺寸为 0 */
      const runAfterLayout = (fn: () => void) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(fn);
        });
      };

      Promise.all([import("force-graph"), import("d3-force")]).then(([fgMod, d3ForceMod]) => {
        const ForceGraph = fgMod.default;
        const forceCollide = d3ForceMod.forceCollide;

        type FG = {
          backgroundColor: (c: string) => FG;
          width: (w: number) => FG;
          height: (h: number) => FG;
          nodeVal: (fn: (n: Node) => number) => FG;
          nodeColor: (fn: (n: Node) => string) => FG;
          nodeVisibility: (fn: (n: Node) => boolean) => FG;
          nodeLabel: (fn: (n: Node) => string) => FG;
          nodeCanvasObjectMode: (mode: string) => FG;
          nodeCanvasObject: (fn: (node: Node & { x?: number; y?: number }, ctx: CanvasRenderingContext2D, globalScale: number) => void) => FG;
          linkCanvasObjectMode: (mode: string) => FG;
          screen2GraphCoords: (x: number, y: number) => { x: number; y: number };
          linkCanvasObject: (fn: (link: { source: Node & { x: number; y: number }; target: Node & { x: number; y: number } }, ctx: CanvasRenderingContext2D, globalScale: number) => void) => FG;
          linkColor: (fn: () => string) => FG;
          linkWidth: (w: number) => FG;
          graphData: (d?: { nodes: Node[]; links: Link[] }) => { nodes: Node[]; links: Link[] };
          onRenderFramePost: (fn: (ctx: CanvasRenderingContext2D, globalScale: number) => void) => FG;
          onNodeClick: (fn: (node: Node) => void) => FG;
          onNodeHover: (fn: (node: Node | null) => void) => FG;
          d3Force: (name: string, fn?: unknown) => FG | unknown;
          cooldownTime: (ms: number) => FG;
          _destructor?: () => void;
        };

        if (!graphRef.current) {
          runAfterLayout(() => {
            if (!containerRef.current || graphRef.current) return;
            const container = containerRef.current;
            const w = container.offsetWidth || 800;
            const h = container.offsetHeight || 600;
            console.log("[StarmapView] 创建图，容器尺寸", w, "x", h);
            const graph = new (ForceGraph as new (el: HTMLElement) => FG)(container);

          /** nodeVal 保持小，避免一坨；点字/点圆用下方自定义点击检测 */
          graph
            .backgroundColor("transparent")
            .width(w)
            .height(h)
            .nodeVal(() => 2)
            .nodeColor((n) => (n.type === "title" ? TITLE_NODE_COLOR : TAG_NODE_COLOR))
            .nodeVisibility(() => true)
            .nodeLabel((n) => n.name ?? "")
            .nodeCanvasObjectMode("replace")
            .nodeCanvasObject((node: Node & { x?: number; y?: number }, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const data = (graph as FG).graphData();
              const hovered = hoveredNodeIdRef.current;
              const connected = hovered ? getConnectedIds(hovered, data?.links ?? []) : null;
              const isHighlight = connected ? connected.has(node.id) : false;
              const dim = connected && !isHighlight;
              const scale = Math.max(globalScale, 0.1);
              const r = NODE_R / scale;
              const x = node.x ?? 0;
              const y = node.y ?? 0;
              ctx.save();
              if (dim) ctx.globalAlpha = 0.35;
              ctx.beginPath();
              ctx.arc(x, y, r, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.type === "title" ? TITLE_NODE_COLOR : TAG_NODE_COLOR;
              ctx.fill();
              ctx.restore();
            })
            .linkCanvasObjectMode("replace")
            .linkCanvasObject((link, ctx, globalScale) => {
              const hovered = hoveredNodeIdRef.current;
              const data = (graph as FG).graphData();
              const linkIds = new Set([link.source.id, link.target.id]);
              const connected = hovered ? getConnectedIds(hovered, data?.links ?? []) : null;
              const isHighlight = connected && (linkIds.has(link.source.id) && linkIds.has(link.target.id));
              const dim = connected && !isHighlight;
              ctx.save();
              const scale = Math.max(globalScale, 0.1);
              ctx.strokeStyle = dim ? "rgba(200,180,230,0.2)" : isHighlight ? "rgba(244,114,182,0.85)" : LINK_STYLE;
              ctx.lineWidth = (dim ? 0.3 : isHighlight ? 1.2 : 0.6) / scale;
              ctx.globalAlpha = dim ? 0.4 : 1;
              ctx.beginPath();
              ctx.moveTo(link.source.x ?? 0, link.source.y ?? 0);
              ctx.lineTo(link.target.x ?? 0, link.target.y ?? 0);
              ctx.stroke();
              ctx.restore();
            })
            .linkColor(() => LINK_STYLE)
            .linkWidth(0.6)
            .onNodeHover((node: Node | null) => {
              hoveredNodeIdRef.current = node?.id ?? null;
            })
            .onRenderFramePost((ctx: CanvasRenderingContext2D) => {
              const g = graphRef.current as FG | null;
              if (!g) return;
              const data = g.graphData();
              const nodeList = (data?.nodes ?? []) as (Node & { x?: number; y?: number })[];
              if (!nodeList.length) return;
              const t = ctx.getTransform();
              ctx.save();
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              const labelPx = 14;
              const nodeRpx = NODE_R * t.a;
              const oneLine12pt = 16;
              const gap = nodeRpx + oneLine12pt;
              const fontBase = "system-ui, -apple-system, \"Segoe UI\", sans-serif";
              nodeList.forEach((node) => {
                const x = node.x ?? 0;
                const y = node.y ?? 0;
                const screenX = x * t.a + t.e;
                const screenY = y * t.d + t.f;
                const label = (node.name ?? "").trim();
                if (!label) return;
                const short = label.length > 18 ? label.slice(0, 17) + "…" : label;
                const isTitle = node.type === "title";
                ctx.font = isTitle ? `bold ${labelPx}px ${fontBase}` : `${labelPx}px ${fontBase}`;
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                ctx.fillStyle = isTitle ? TITLE_LABEL_COLOR : TAG_LABEL_COLOR;
                ctx.fillText(short, screenX, screenY - gap);
              });
              ctx.restore();
            })
            .graphData({ nodes, links });
          (graph as FG).cooldownTime(2000);

          const charge = (graph as FG).d3Force("charge") as { strength?: (v: number) => void } | undefined;
          if (charge && typeof charge.strength === "function") charge.strength(CHARGE_STRENGTH);
          (graph as FG).d3Force("collide", forceCollide(COLLIDE_RADIUS));

          graphRef.current = graph as unknown as typeof graphRef.current;

          /** 自定义点击：点字或点圆（约 36 单位内）都打开右侧栏 */
          removeClickRef.current?.();
          const CLICK_RADIUS = 36;
          const onClick = (ev: MouseEvent) => {
            const g = graphRef.current as FG | null;
            const canvas = container.querySelector("canvas");
            if (!g || !canvas) return;
            const rect = canvas.getBoundingClientRect();
            const { x: gx, y: gy } = g.screen2GraphCoords(ev.clientX - rect.left, ev.clientY - rect.top);
            const data = g.graphData();
            const list = (data?.nodes ?? []) as (Node & { x?: number; y?: number })[];
            let best: (Node & { x?: number; y?: number }) | null = null;
            let bestD = CLICK_RADIUS;
            for (const node of list) {
              const d = Math.hypot((node.x ?? 0) - gx, (node.y ?? 0) - gy);
              if (d < bestD) {
                bestD = d;
                best = node;
              }
            }
            if (best) setSelectedNode({ id: best.id, name: best.name, type: best.type });
          };
          container.addEventListener("click", onClick);
          removeClickRef.current = () => container.removeEventListener("click", onClick);
          console.log("[StarmapView] 图已创建并挂载");
          });
        } else {
          const g = graphRef.current;
          const el = containerRef.current;
          if (el) {
            g.graphData({ nodes, links });
            g.width(el.offsetWidth || 800);
            g.height(el.offsetHeight || 600);
          }
        }
      })
      .catch((err) => {
        console.error("[StarmapView] 加载 force-graph/d3 失败", err);
      });
    })
      .catch((err) => {
        console.error("[StarmapView] listFragmentsApi 失败", err);
        setLoadState("empty");
        setFragments([]);
      });
  }, [refreshTrigger, getConnectedIds]);

  useEffect(() => {
    const onResize = () => {
      if (containerRef.current && graphRef.current) {
        graphRef.current.width(containerRef.current.offsetWidth);
        graphRef.current.height(containerRef.current.offsetHeight);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const idsWithStatus = selectedNode ? (nodeIdToFragments[selectedNode.id] || []) : [];
  const fragmentList = idsWithStatus.map(({ id, status }) => {
    const f = fragments.find((x) => x.id === id);
    return f ? { ...f, status } : null;
  }).filter((f): f is FragmentItem & { status: string } => f != null);

  return (
    <div className="relative w-full h-full min-h-[80vh] flex">
      <div ref={containerRef} className="flex-1 min-w-0 min-h-[70vh] rounded-l-[24px] overflow-hidden relative" />
      {loadState === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-l-[24px] pointer-events-none">
          <span className="text-[#718096] text-sm">加载星图中…</span>
        </div>
      )}
      {loadState === "empty" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-l-[24px] pointer-events-none">
          <p className="text-[#718096] text-sm text-center max-w-[280px]">
            暂无碎片，在收件箱或归档添加内容后即可在星图中查看
          </p>
        </div>
      )}
      {selectedNode !== null && (
        <div className="w-72 shrink-0 rounded-r-[24px] border-l border-white/30 bg-white/90 backdrop-blur shadow-lg overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              {selectedNode.type === "tag" ? `标签「${selectedNode.name}」` : `标题「${selectedNode.name}」`}
            </span>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded text-sm"
              aria-label="关闭"
            >
              关闭
            </button>
          </div>
          <ul className="overflow-auto p-2 flex-1 text-sm text-gray-800">
            {fragmentList.length === 0 ? (
              <li className="py-2 text-gray-500">暂无卡片</li>
            ) : (
              fragmentList.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectFragment?.(f.id, (f as FragmentItem & { status: string }).status || "inbox");
                      setSelectedNode(null);
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg hover:bg-[#e9d8fd]/50 border-b border-gray-100 last:border-0 truncate"
                  >
                    {(f.title ?? f.sourceTitle)?.trim() || (typeof f.content === "string" ? f.content.slice(0, 40) : "") || "(无标题)"}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
