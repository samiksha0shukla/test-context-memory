"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { MemoryNode, MemoryLink } from "@/types/memory";
import { MemoryDetailPanel } from "./MemoryDetailPanel";

// Hooks
import { useMemoryData } from "./hooks/useMemoryData";
import { useMemorySelection } from "./hooks/useMemorySelection";
import { useGraphDimensions } from "./hooks/useGraphDimensions";
import { useZoomControls } from "./hooks/useZoomControls";

// D3 Logic
import { initializeSVG } from "./d3/initializeVisualization";
import { createTooltip, attachTooltipHandlers } from "./d3/tooltip";
import { createSimulation, freezeNodePositions, calculateInitialZoom, type NodePosition } from "./d3/simulation";
import { prepareNodes, renderNodes, updateNodeStates } from "./d3/renderNodes";
import { prepareLinks, getVisibleLinks, getConnectedNodeIds, renderConnections } from "./d3/renderConnections";

// UI Components
import { GraphControls } from "./components/GraphControls";
import { GraphLegend } from "./components/GraphLegend";
import { GraphHint } from "./components/GraphHint";
import { GraphLoading, GraphError, GraphEmpty } from "./components/GraphStates";

export function MemoryGraph() {
  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<MemoryNode, MemoryLink> | null>(null);
  const nodesRef = useRef<MemoryNode[]>([]);
  const linksRef = useRef<MemoryLink[]>([]);
  const positionsRef = useRef<Map<number, NodePosition>>(new Map());
  const initializedRef = useRef(false);
  const tooltipRef = useRef<any>(null);

  // Custom hooks
  const { data, error, isLoading, hasData } = useMemoryData();
  const dimensions = useGraphDimensions(svgRef);
  const selection = useMemorySelection(data);
  const zoomControls = useZoomControls(svgRef, zoomRef);

  // Debug logging
  useEffect(() => {
    console.log('MemoryGraph state:', { isLoading, hasError: !!error, hasData, nodeCount: data?.nodes?.length });
    if (error) {
      console.error('MemoryGraph error details:', error);
    }
  }, [isLoading, error, data, hasData]);

  // Initialize D3 visualization when data loads or changes
  useEffect(() => {
    console.log('Init effect triggered:', { hasData: !!data, hasSvg: !!svgRef.current, initialized: initializedRef.current, nodeCount: data?.nodes?.length, dimensions });

    if (!data || !svgRef.current) return;
    if (data.nodes.length === 0) return;

    // Check if dimensions are valid
    const { width, height } = dimensions;
    if (width === 0 || height === 0) {
      console.log('⚠ Dimensions not ready:', dimensions);
      return;
    }

    console.log('✓ Initializing visualization with', data.nodes.length, 'nodes');

    const svg = d3.select(svgRef.current);

    // Clear any existing content if reinitializing
    if (initializedRef.current && gRef.current) {
      console.log('✓ Clearing previous visualization');
      svg.selectAll("g").remove();
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    }

    initializedRef.current = true;

    // Initialize SVG structure
    const { g, zoom } = initializeSVG(svg, selection.clearSelection);
    gRef.current = g;
    zoomRef.current = zoom;

    // Create tooltip (remove old one if exists)
    if (tooltipRef.current) {
      tooltipRef.current.remove();
    }
    const tooltip = createTooltip();
    tooltipRef.current = tooltip;

    // Prepare nodes with positions
    const nodes = prepareNodes(data.nodes, positionsRef.current, width, height);
    nodesRef.current = nodes;

    // Prepare valid links
    const nodeIds = new Set(nodes.map((node) => node.id));
    const links = prepareLinks(data.links, nodeIds);
    linksRef.current = links;

    // Create simulation
    const simulation = createSimulation(nodes, width, height);
    simulationRef.current = simulation;

    // Render nodes
    const nodeSelection = renderNodes(
      g,
      nodes,
      selection.selectBubble,
      selection.setSelectedId
    );

    console.log('✓ Rendered', nodeSelection.size(), 'bubble elements');

    // Attach tooltip handlers
    attachTooltipHandlers(nodeSelection, tooltip);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      nodeSelection.attr("transform", (d) => `translate(${d.x},${d.y})`);

      // Save positions during simulation
      nodes.forEach((d) => {
        if (d.x !== undefined && d.y !== undefined) {
          positionsRef.current.set(d.id, { x: d.x, y: d.y, fx: d.fx, fy: d.fy });
        }
      });
    });

    // Apply initial zoom after brief delay
    setTimeout(() => {
      calculateInitialZoom(svg, zoom, nodes, width, height);
    }, 100);

    // Stop simulation and freeze positions after layout completes
    setTimeout(() => {
      simulation.stop();
      freezeNodePositions(nodes, positionsRef.current);
    }, 1500);

    return () => {
      if (simulation) {
        simulation.stop();
      }
      if (tooltip) {
        tooltip.remove();
      }
    };
  }, [data, dimensions]);

  // Update connections and highlighting when selection changes
  useEffect(() => {
    if (!gRef.current || !nodesRef.current.length) return;

    const g = gRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;

    // Get visible links for selected node
    const visibleLinks = getVisibleLinks(selection.selectedId, nodes, links);
    selection.setVisibleLinkCount(visibleLinks.length);

    // Get connected node IDs
    const connectedNodeIds = getConnectedNodeIds(selection.selectedId, nodes);

    // Render connections
    renderConnections(g, visibleLinks, nodes);

    // Update node visual states
    updateNodeStates(g, selection.selectedId, connectedNodeIds);
  }, [selection.selectedId]);

  // Loading state
  if (isLoading) {
    return <GraphLoading />;
  }

  // Error state
  if (error) {
    return <GraphError />;
  }

  // Empty state
  if (!hasData) {
    return <GraphEmpty />;
  }

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full graph-canvas"
        style={{ touchAction: "none" }}
      />

      {/* Zoom Controls */}
      <GraphControls
        onZoomIn={zoomControls.handleZoomIn}
        onZoomOut={zoomControls.handleZoomOut}
        onResetView={zoomControls.handleResetView}
      />

      {/* Legend */}
      <GraphLegend
        totalMemories={data?.nodes.length || 0}
        selectedId={selection.selectedId}
        visibleLinkCount={selection.visibleLinkCount}
      />

      {/* Controls hint */}
      <GraphHint />

      {/* Detail Panel - only show when isPanelOpen is true */}
      {selection.isPanelOpen && (
        <MemoryDetailPanel
          memory={selection.selectedMemory}
          linkedMemories={selection.linkedMemories}
          onClose={selection.closePanel}
          onSelectMemory={(id) => selection.selectLinkedMemory(id, selection.selectBubble)}
        />
      )}
    </div>
  );
}
