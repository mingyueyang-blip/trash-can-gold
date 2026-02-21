"use client";

import { useEffect, useRef } from "react";
import { listFragmentsApi } from "@/lib/api-client";

type GraphNode = { id: string; name: string; type: "tag" | "fragment"; val?: number };
type GraphLink = { source: string; target: string };

export function GalaxyGraph() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    import("force-graph").then((mod) => {
      const ForceGraph = mod.default;
      const el = containerRef.current;
      if (!el || cancelled) return;
      const graph = new ForceGraph(el);
      graph
        .backgroundColor("transparent")
        .nodeLabel((n: unknown) => (n as GraphNode).name)
        .nodeVal((n: unknown) => (n as GraphNode).val ?? 4)
        .nodeColor((n: unknown) =>
          (n as GraphNode).type === "tag" ? "#A855F7" : "rgba(224, 195, 252, 0.85)"
        )
        .linkColor(() => "rgba(168, 85, 247, 0.45)")
        .linkWidth(1)
        .linkDirectionalParticles(1)
        .linkDirectionalParticleWidth(1);

      const onResize = () => {
        if (containerRef.current) {
          graph.width(containerRef.current.offsetWidth);
          graph.height(containerRef.current.offsetHeight);
        }
      };
      onResize();
      window.addEventListener("resize", onResize);
      cleanup = () => {
        window.removeEventListener("resize", onResize);
        try {
          (graph as unknown as { _destructor?: () => void })._destructor?.();
        } catch {}
      };

      listFragmentsApi({})
        .then((list) => {
          if (cancelled) return;
          const nodesMap = new Map<string, GraphNode>();
          const links: GraphLink[] = [];

          for (const f of list) {
            nodesMap.set(f.id, {
              id: f.id,
              name: f.title?.trim() || f.content.slice(0, 40) || f.id,
              type: "fragment",
              val: 5,
            });
            for (const t of f.tagIds || []) {
              if (!t) continue;
              const tid = `tag:${t}`;
              if (!nodesMap.has(tid))
                nodesMap.set(tid, { id: tid, name: t, type: "tag", val: 14 });
              links.push({ source: f.id, target: tid });
            }
          }

          graph.graphData({
            nodes: Array.from(nodesMap.values()),
            links,
          });
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      ref={containerRef}
      aria-hidden
      style={{ width: "100%", height: "100%" }}
    />
  );
}
