"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { MemoryNode } from "@/types/memory";
import type { MemoriesResponse } from "@/types/api";
import { initializeLandingSVG } from "./d3/initializeVisualization";
import { createTooltip, attachTooltipHandlers } from "./d3/tooltip";
import { createSimulation, freezeNodePositions } from "./d3/simulation";
import { prepareNodes, renderNodes, updateNodeStates } from "./d3/renderNodes";
import {
  prepareLinks,
  getVisibleLinks,
  getConnectedNodeIds,
  renderConnections,
} from "./d3/renderConnections";

const WIDTH = 480;
const HEIGHT = 380;
const RADIUS_SCALE = 0.58;
const POSITION_SCALE = 0.6;

interface LandingHeroGraphProps {
  data: MemoriesResponse;
}

/**
 * Landing hero graph: same behavior as demo — no connections until a bubble
 * is clicked; hover shows tooltip; bubbles stop moving after layout.
 * No border/box around the graph.
 */
export function LandingHeroGraph({ data }: LandingHeroGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodesRef = useRef<MemoryNode[]>([]);
  const linksRef = useRef<ReturnType<typeof prepareLinks>>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Initial setup: layout, freeze, render nodes with click + tooltip
  useEffect(() => {
    if (!data?.nodes?.length || !svgRef.current) return;

    setSelectedId(null);
    const svg = d3.select(svgRef.current);
    const g = initializeLandingSVG(svg);
    gRef.current = g;

    const positionsRef = new Map<number, { x: number; y: number; fx?: number | null; fy?: number | null }>();
    let nodes = prepareNodes(data.nodes, positionsRef, WIDTH, HEIGHT);
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = prepareLinks(data.links, nodeIds);
    nodesRef.current = nodes;
    linksRef.current = links;

    nodes = nodes.map((n) => ({
      ...n,
      radius: (n.radius ?? 24) * RADIUS_SCALE,
      x: n.x != null ? (WIDTH / 2 + (n.x - WIDTH / 2) * POSITION_SCALE) : WIDTH / 2,
      y: n.y != null ? (HEIGHT / 2 + (n.y - HEIGHT / 2) * POSITION_SCALE) : HEIGHT / 2,
    }));
    nodesRef.current = nodes;

    const simulation = createSimulation(nodes, WIDTH, HEIGHT);

    if (tooltipRef.current) {
      tooltipRef.current.remove();
    }
    const tooltip = createTooltip();
    tooltipRef.current = tooltip;

    const nodeSelection = renderNodes(g, nodes, () => {}, setSelectedId);
    attachTooltipHandlers(nodeSelection, tooltip);

    svg.on("click", (event: MouseEvent) => {
      if (event.target === svg.node()) {
        setSelectedId(null);
      }
    });

    simulation.on("tick", () => {
      nodeSelection.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    setTimeout(() => {
      simulation.stop();
      freezeNodePositions(nodes, positionsRef);
      renderConnections(g, [], nodes);
      updateNodeStates(g, null, new Set());
    }, 1500);

    return () => {
      simulation.stop();
      tooltip.remove();
      tooltipRef.current = null;
      gRef.current = null;
    };
  }, [data]);

  // When selection changes, show that bubble’s connections (demo behavior)
  useEffect(() => {
    const g = gRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;
    if (!g || !nodes.length) return;

    const visibleLinks = getVisibleLinks(selectedId, nodes, links);
    const connectedIds = getConnectedNodeIds(selectedId, nodes);
    renderConnections(g, visibleLinks, nodes);
    updateNodeStates(g, selectedId, connectedIds);
  }, [selectedId]);

  return (
    <div className="w-full max-w-[480px] h-[380px] overflow-hidden shrink-0">
      <svg
        ref={svgRef}
        width={WIDTH}
        height={HEIGHT}
        className="w-full h-full graph-canvas"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}
