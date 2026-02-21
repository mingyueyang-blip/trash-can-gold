"use client";

import { useEffect, useRef } from "react";
import {
  NODE_R,
  LABEL_OFFSET_PX,
  FONT_SIZE_PX,
  TITLE_LABEL_COLOR,
  TAG_LABEL_COLOR,
  CENTER_NODE_COLOR,
  TAG_NODE_COLOR,
  LINK_STROKE,
  CHARGE_STRENGTH,
  COLLIDE_RADIUS,
} from "@/lib/starmap-visual";

interface RefineStarMapProps {
  /** 中心：卡片标题 */
  currentTitle: string;
  /** 从中心伸出的第一层：手动添加的标签 #标签（浅紫圈） */
  tags: string[];
  /** 正文中 @ 到的其他笔记标题（白圈） */
  refTitles?: string[];
  height?: number;
}

type Node = { id: string; name: string; nodeType: "center" | "tag" | "ref"; x?: number; y?: number };
type Link = { source: string; target: string };

export function RefineStarMap({
  currentTitle,
  tags,
  refTitles = [],
  height = 200,
}: RefineStarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<{
    _destructor?: () => void;
    graphData: (d: { nodes: Node[]; links: Link[] }) => unknown;
    width: (w: number) => unknown;
    height: (h: number) => unknown;
  } | null>(null);

  useEffect(() => {
    return () => {
      try {
        graphRef.current?._destructor?.();
        graphRef.current = null;
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const el = containerRef.current;
    const centerId = "__current__";
    const nodes = [
      { id: centerId, name: currentTitle || "当前笔记", nodeType: "center" as const },
      ...tags.map((tag, i) => ({ id: `tag-${i}`, name: tag, nodeType: "tag" as const })),
      ...refTitles.map((title, i) => ({ id: `ref-${i}`, name: title, nodeType: "ref" as const })),
    ].filter((n) => n.name?.trim()) as Node[];
    const links: Link[] = [
      ...tags.map((_, i) => ({ source: centerId, target: `tag-${i}` })),
      ...refTitles.map((_, i) => ({ source: centerId, target: `ref-${i}` })),
    ].filter((l) => nodes.some((n) => n.id === l.target));

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
        linkColor: (fn: () => string) => FG;
        linkWidth: (w: number) => FG;
        graphData: (d?: { nodes: Node[]; links: Link[] }) => { nodes: Node[]; links: Link[] };
        onRenderFramePost: (fn: (ctx: CanvasRenderingContext2D, globalScale: number) => void) => FG;
        d3Force: (name: string, fn?: unknown) => FG | unknown;
        _destructor?: () => void;
      };

      if (!graphRef.current) {
        const graph = new (ForceGraph as new (el: HTMLElement) => FG)(el);

        graph
          .backgroundColor("transparent")
          .width(el.offsetWidth)
          .height(height)
          .nodeVal(() => 2)
          .nodeColor((n) => (n.nodeType === "tag" ? TAG_NODE_COLOR : CENTER_NODE_COLOR))
          .nodeVisibility(() => false)
          .nodeLabel((n) => n.name ?? "")
          .linkCanvasObjectMode("replace")
          .linkCanvasObject((link: { source: Node & { x: number; y: number }; target: Node & { x: number; y: number } }, ctx, globalScale) => {
            ctx.save();
            const scale = Math.max(globalScale, 0.1);
            ctx.strokeStyle = LINK_STROKE;
            ctx.lineWidth = 0.5 / scale;
            ctx.beginPath();
            ctx.moveTo(link.source.x ?? 0, link.source.y ?? 0);
            ctx.lineTo(link.target.x ?? 0, link.target.y ?? 0);
            ctx.stroke();
            ctx.restore();
          })
          .linkColor(() => LINK_STROKE)
          .linkWidth(0.5)
          .onRenderFramePost((ctx, globalScale) => {
            const data = (graph as FG).graphData();
            if (!data?.nodes?.length) return;
            const scale = Math.max(globalScale, 0.1);
            const r = NODE_R / scale;
            const labelGap = LABEL_OFFSET_PX / scale + r;
            data.nodes.forEach((node: Node & { x?: number; y?: number }) => {
              const x = node.x ?? 0;
              const y = node.y ?? 0;
              ctx.beginPath();
              ctx.arc(x, y, r, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.nodeType === "tag" ? TAG_NODE_COLOR : CENTER_NODE_COLOR;
              ctx.fill();
              const label = node.name ?? "";
              if (label) {
                const fontSize = Math.max(6, Math.min(12, FONT_SIZE_PX / scale));
                const isTitle = node.nodeType === "center" || node.nodeType === "ref";
                ctx.font = isTitle
                  ? `bold ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`
                  : `${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                ctx.fillStyle = isTitle ? TITLE_LABEL_COLOR : TAG_LABEL_COLOR;
                const short = label.length > 14 ? label.slice(0, 13) + "…" : label;
                ctx.fillText(short, x, y - labelGap);
              }
            });
          })
          .graphData({ nodes, links });

        const charge = (graph as FG).d3Force("charge") as { strength?: (v: number) => void } | undefined;
        if (charge && typeof charge.strength === "function") {
          charge.strength(CHARGE_STRENGTH);
        }
        (graph as FG).d3Force("collide", forceCollide(COLLIDE_RADIUS));

        graphRef.current = graph as typeof graphRef.current;
      } else {
        const g = graphRef.current;
        g.graphData({ nodes, links });
        g.width(el.offsetWidth);
        g.height(height);
      }
    });
  }, [currentTitle, tags, refTitles, height]);

  return (
    <div
      ref={containerRef}
      className="w-full bg-transparent overflow-hidden"
      style={{ height }}
    />
  );
}
