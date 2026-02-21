"use client";

import { useEffect, useRef } from "react";
import type { RefineFragment } from "./RefinePanel";

type Node = { id: string; name: string; type: "tag" | "fragment"; val: number };
type Link = { source: string; target: string };

interface RefineMiniGraphProps {
  fragment: RefineFragment;
  allFragments: RefineFragment[];
}

export function RefineMiniGraph({ fragment, allFragments }: RefineMiniGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    import("force-graph").then((mod) => {
      const ForceGraph = mod.default;
      const el = containerRef.current;
      if (!el) return;

      const nodesMap = new Map<string, Node>();
      const links: Link[] = [];

      nodesMap.set(fragment.id, {
        id: fragment.id,
        name: fragment.title?.trim() || fragment.content?.slice(0, 20) || "本笔记",
        type: "fragment",
        val: 8,
      });
      for (const t of fragment.tagIds || []) {
        if (!t) continue;
        const tid = `tag:${t}`;
        if (!nodesMap.has(tid)) nodesMap.set(tid, { id: tid, name: t, type: "tag", val: 16 });
        links.push({ source: fragment.id, target: tid });
      }

      const graph = new ForceGraph(el);
      graph
        .backgroundColor("transparent")
        .width(el.offsetWidth)
        .height(160)
        .nodeLabel((n: unknown) => (n as Node).name)
        .nodeVal((n: unknown) => (n as Node).val)
        .nodeColor((n: unknown) =>
          (n as Node).type === "tag" ? "#A855F7" : "rgba(255,255,255,0.9)"
        )
        .linkColor(() => "rgba(168, 85, 247, 0.8)")
        .linkWidth(2)
        .linkDirectionalParticles(0.5)
        .graphData({ nodes: Array.from(nodesMap.values()), links });

      return () => {
        try {
          (graph as unknown as { _destructor?: () => void })._destructor?.();
        } catch {}
      };
    });
  }, [fragment.id, fragment.title, fragment.content, fragment.tagIds]);

  return <div ref={containerRef} className="w-full h-[160px] rounded-xl bg-white/10" />;
}
