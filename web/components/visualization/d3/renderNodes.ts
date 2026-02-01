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
  // Create a set of all node IDs for efficient lookup
  const nodeIdSet = new Set(rawNodes.map(n => n.id));

  return rawNodes.map((node) => {
    const existingPos = positionsRef.get(node.id);

    // Calculate valid connection count (only connections to nodes that exist)
    const validConnectionCount = node.connections
      ? node.connections.filter((conn: any) => nodeIdSet.has(conn.target_id) || nodeIdSet.has(conn.target_global_id)).length
      : 0;

    return {
      ...node,
      type: node.type === "semantic" ? "semantic" : "bubble",
      radius: getBubbleRadius(node.importance),
      x: existingPos?.x ?? width / 2 + (Math.random() - 0.5) * 400,
      y: existingPos?.y ?? height / 2 + (Math.random() - 0.5) * 400,
      fx: existingPos?.fx,
      fy: existingPos?.fy,
      validConnectionCount,
    };
  });
}

/**
 * Renders memory bubbles with circles and text labels
 * Displays local_id (per-user sequential ID) instead of global id
 */
export function renderNodes(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodes: MemoryNode[],
  onBubbleClick: (d: MemoryNode, event: MouseEvent) => void,
  setSelectedId: (id: number) => void,
  useConstantColor: boolean = false
): d3.Selection<SVGGElement, MemoryNode, SVGGElement, unknown> {
  const nodeGroup = container.append("g").attr("class", "nodes-container");

  const node = nodeGroup
    .selectAll<SVGGElement, MemoryNode>("g")
    .data(nodes, (d: any) => d.id)
    .join("g")
    .attr("class", "memory-bubble")
    .attr("data-id", (d) => d.id)
    .attr("data-local-id", (d) => d.local_id)
    .style("cursor", "pointer")
    .style("pointer-events", "all");

  // Add circle
  node
    .append("circle")
    .attr("r", (d) => d.radius!)
    .attr("fill", (d) => getBubbleColor(d.type, d.created_at, useConstantColor))
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .attr("stroke-opacity", 0.8);

  // Add text - showing LOCAL_ID (per-user sequential ID)
  node
    .append("text")
    .text((d) => d.local_id.toString())  // Use local_id instead of id
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

  // Add click handler - still pass global id for internal use
  node.on("click", (event: MouseEvent, d) => {
    setSelectedId(d.id);  // Use global id for selection/linking
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
