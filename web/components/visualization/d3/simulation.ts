import * as d3 from "d3";
import type { MemoryNode, MemoryLink } from "@/types/memory";

export interface NodePosition {
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

/**
 * Creates and configures a D3 force simulation
 * The simulation runs briefly for initial layout, then stops permanently
 */
export function createSimulation(
  nodes: MemoryNode[],
  width: number,
  height: number
): d3.Simulation<MemoryNode, MemoryLink> {
  return d3
    .forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05))
    .force(
      "collision",
      d3.forceCollide().radius((d: any) => d.radius + 20)
    )
    .velocityDecay(0.4)
    .alphaDecay(0.05) // Faster decay to stop simulation sooner
    .alphaMin(0.001)
    .alpha(1); // Start with full energy for initial layout
}

/**
 * Freezes all node positions permanently
 * Called after initial layout completes
 */
export function freezeNodePositions(
  nodes: MemoryNode[],
  positionsRef: Map<number, NodePosition>
) {
  nodes.forEach((d) => {
    d.fx = d.x;
    d.fy = d.y;
    if (d.x !== undefined && d.y !== undefined) {
      positionsRef.set(d.id, { x: d.x, y: d.y, fx: d.fx, fy: d.fy });
    }
  });

  console.log("✓ Bubble positions frozen - bubbles will no longer move");
}

/**
 * Calculates and applies initial zoom to fit all bubbles in viewport
 */
export function calculateInitialZoom(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  zoom: d3.ZoomBehavior<SVGSVGElement, unknown>,
  nodes: MemoryNode[],
  width: number,
  height: number
) {
  // Calculate bounding box of all nodes
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  nodes.forEach((d) => {
    if (d.x !== undefined && d.y !== undefined) {
      const r = d.radius || 20;
      minX = Math.min(minX, d.x - r);
      maxX = Math.max(maxX, d.x + r);
      minY = Math.min(minY, d.y - r);
      maxY = Math.max(maxY, d.y + r);
    }
  });

  const boundsWidth = maxX - minX;
  const boundsHeight = maxY - minY;
  const boundsCenterX = (minX + maxX) / 2;
  const boundsCenterY = (minY + maxY) / 2;

  // Calculate zoom to fit with 15% padding
  const padding = 1.15;
  const scale = Math.min(
    width / (boundsWidth * padding),
    height / (boundsHeight * padding)
  );

  // Apply initial zoom to fit all bubbles
  const initialTransform = d3.zoomIdentity
    .translate(width / 2, height / 2)
    .scale(scale)
    .translate(-boundsCenterX, -boundsCenterY);

  svg.call(zoom.transform as any, initialTransform);

  console.log(`✓ Initial zoom: ${scale.toFixed(2)}x to fit ${nodes.length} bubbles`);
}
