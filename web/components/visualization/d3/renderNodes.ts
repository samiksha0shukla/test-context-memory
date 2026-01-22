import * as d3 from "d3";
import type { MemoryNode } from "@/types/memory";
import { getBubbleColor, getBubbleRadius } from "@/lib/utils";

export interface NodePosition {
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

/**
 * Prepares node data with initial positions and visual properties
 */
export function prepareNodes(
  rawNodes: any[],
  positionsRef: Map<number, NodePosition>,
  width: number,
  height: number
): MemoryNode[] {
  return rawNodes.map((node) => {
    const existingPos = positionsRef.get(node.id);
    return {
      ...node,
      type: node.type === "semantic" ? "semantic" : "bubble",
      radius: getBubbleRadius(node.importance),
      x: existingPos?.x ?? width / 2 + (Math.random() - 0.5) * 400,
      y: existingPos?.y ?? height / 2 + (Math.random() - 0.5) * 400,
      fx: existingPos?.fx,
      fy: existingPos?.fy,
    };
  });
}

/**
 * Renders memory bubbles with circles and text labels
 */
export function renderNodes(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodes: MemoryNode[],
  onBubbleClick: (d: MemoryNode, event: MouseEvent) => void,
  setSelectedId: (id: number) => void
): d3.Selection<SVGGElement, MemoryNode, SVGGElement, unknown> {
  const nodeGroup = container.append("g").attr("class", "nodes-container");

  const node = nodeGroup
    .selectAll<SVGGElement, MemoryNode>("g")
    .data(nodes, (d: any) => d.id)
    .join("g")
    .attr("class", "memory-bubble")
    .attr("data-id", (d) => d.id)
    .style("cursor", "pointer")
    .style("pointer-events", "all");

  // Add circle
  node
    .append("circle")
    .attr("r", (d) => d.radius!)
    .attr("fill", (d) => getBubbleColor(d.type, d.created_at))
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .attr("stroke-opacity", 0.8);

  // Add text - showing only memory ID
  node
    .append("text")
    .text((d) => d.id.toString())
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("font-size", (d) => {
      const size = d.radius! / 2.5;
      return `${Math.max(12, Math.min(size, 24))}px`;
    })
    .attr("font-weight", "700")
    .attr("fill", "#fff")
    .attr("pointer-events", "none")
    .style("user-select", "none");

  // Add click handler
  node.on("click", (event: MouseEvent, d) => {
    setSelectedId(d.id);
    onBubbleClick(d, event);
  });

  return node;
}

/**
 * Updates node visual states based on selection
 */
export function updateNodeStates(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  selectedId: number | null,
  connectedNodeIds: Set<number>
) {
  container.selectAll<SVGGElement, MemoryNode>(".memory-bubble")
    .each(function(d) {
      const isSelected = d.id === selectedId;
      const isConnected = connectedNodeIds.has(d.id);
      const hasSelection = selectedId !== null;

      // Determine if this bubble should be dimmed
      const shouldDim = hasSelection && !isSelected && !isConnected;

      d3.select(this)
        .select("circle")
        .classed("selected", isSelected)
        .classed("dimmed", shouldDim)
        .classed("connected", isConnected && !isSelected)
        .transition()
        .duration(300)
        .attr("stroke", isSelected ? "#333" : (isConnected ? "#666" : "#fff"))
        .attr("stroke-width", isSelected ? 4 : (isConnected ? 3 : 2))
        .attr("stroke-opacity", isSelected || isConnected ? 1 : 0.8)
        .attr("opacity", shouldDim ? 0.4 : 1);

      // Also dim the text
      d3.select(this)
        .select("text")
        .transition()
        .duration(300)
        .attr("opacity", shouldDim ? 0.4 : 1);
    });
}
