import * as d3 from "d3";
import type { MemoryNode, MemoryLink } from "@/types/memory";
import { getConnectionOpacity, getConnectionThickness } from "@/lib/utils";

/**
 * Filters and prepares valid links between existing nodes
 */
export function prepareLinks(
  rawLinks: any[],
  nodeIds: Set<number>
): MemoryLink[] {
  return rawLinks
    .filter((link) => nodeIds.has(link.source as number) && nodeIds.has(link.target as number))
    .map((link) => ({
      source: link.source,
      target: link.target,
      strength: link.strength,
    }));
}

/**
 * Gets visible links for the selected node
 * Creates links for ALL connections in metadata, even if not in links array
 */
export function getVisibleLinks(
  selectedId: number | null,
  nodes: MemoryNode[],
  links: MemoryLink[]
): MemoryLink[] {
  if (!selectedId) return [];

  const selectedNode = nodes.find((n) => n.id === selectedId);
  if (!selectedNode || !selectedNode.connections) return [];

  const visibleLinks: MemoryLink[] = [];

  selectedNode.connections.forEach((conn) => {
    const targetNode = nodes.find(n => n.id === conn.target_id);
    if (targetNode) {
      // Try to find existing link first
      const existingLink = links.find((link) => {
        const sourceId = typeof link.source === 'number' ? link.source : (link.source as any).id;
        const targetId = typeof link.target === 'number' ? link.target : (link.target as any).id;
        return sourceId === selectedId && targetId === conn.target_id;
      });

      if (existingLink) {
        visibleLinks.push(existingLink);
      } else {
        // Create new link if it doesn't exist in links array
        visibleLinks.push({
          source: selectedId,
          target: conn.target_id,
          strength: conn.score || 0.5
        });
      }
    }
  });

  console.log(`✓ Bubble ${selectedId} - Connections in data: ${selectedNode.connections.length}, Lines rendered: ${visibleLinks.length}`);

  return visibleLinks;
}

/**
 * Gets the set of connected node IDs for the selected node
 */
export function getConnectedNodeIds(
  selectedId: number | null,
  nodes: MemoryNode[]
): Set<number> {
  if (!selectedId) return new Set();

  const selectedNode = nodes.find((n) => n.id === selectedId);
  if (!selectedNode || !selectedNode.connections) return new Set();

  return new Set(selectedNode.connections.map((conn) => conn.target_id));
}

/**
 * Renders connection lines between nodes with animation
 */
export function renderConnections(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  visibleLinks: MemoryLink[],
  nodes: MemoryNode[]
) {
  const linksContainer = container.select(".links-container");

  const linkSelection = linksContainer
    .selectAll<SVGLineElement, MemoryLink>("line")
    .data(visibleLinks, (d: any) => {
      const sourceId = typeof d.source === 'number' ? d.source : d.source.id;
      const targetId = typeof d.target === 'number' ? d.target : d.target.id;
      return `${sourceId}-${targetId}`;
    });

  // Remove old links with fade out
  linkSelection.exit()
    .transition()
    .duration(300)
    .attr("stroke-opacity", 0)
    .remove();

  // Add new links with animation
  const newLinks = linkSelection.enter()
    .append("line")
    .attr("class", "connection-line")
    .attr("stroke", "#555")
    .attr("stroke-width", (d) => getConnectionThickness(d.strength) + 1)
    .attr("stroke-linecap", "round")
    .attr("stroke-opacity", 0)
    .attr("x1", (d: any) => {
      const source = typeof d.source === 'number'
        ? nodes.find(n => n.id === d.source)
        : d.source;
      return source?.x ?? 0;
    })
    .attr("y1", (d: any) => {
      const source = typeof d.source === 'number'
        ? nodes.find(n => n.id === d.source)
        : d.source;
      return source?.y ?? 0;
    })
    .attr("x2", (d: any) => {
      const target = typeof d.target === 'number'
        ? nodes.find(n => n.id === d.target)
        : d.target;
      return target?.x ?? 0;
    })
    .attr("y2", (d: any) => {
      const target = typeof d.target === 'number'
        ? nodes.find(n => n.id === d.target)
        : d.target;
      return target?.y ?? 0;
    });

  // Animate new links appearing
  newLinks
    .transition()
    .duration(400)
    .attr("stroke-opacity", (d) => getConnectionOpacity(d.strength) + 0.3);

  // Update existing links positions
  linkSelection.merge(newLinks)
    .attr("x1", (d: any) => {
      const source = typeof d.source === 'number'
        ? nodes.find(n => n.id === d.source)
        : d.source;
      return source?.x ?? 0;
    })
    .attr("y1", (d: any) => {
      const source = typeof d.source === 'number'
        ? nodes.find(n => n.id === d.source)
        : d.source;
      return source?.y ?? 0;
    })
    .attr("x2", (d: any) => {
      const target = typeof d.target === 'number'
        ? nodes.find(n => n.id === d.target)
        : d.target;
      return target?.x ?? 0;
    })
    .attr("y2", (d: any) => {
      const target = typeof d.target === 'number'
        ? nodes.find(n => n.id === d.target)
        : d.target;
      return target?.y ?? 0;
    });
}
