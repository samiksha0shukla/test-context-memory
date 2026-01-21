"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import useSWR from "swr";
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import type { MemoryNode, MemoryLink, Memory } from "@/types/memory";
import {
  getBubbleRadius,
  getBubbleColor,
  getConnectionOpacity,
  getConnectionThickness,
  truncateText,
} from "@/lib/utils";
import { MemoryDetailPanel } from "./MemoryDetailPanel";

interface MemoryGraphProps {
  conversationId: number;
}

interface NodePosition {
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

export function MemoryGraph({ conversationId }: MemoryGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<MemoryNode, MemoryLink> | null>(null);
  const nodesRef = useRef<MemoryNode[]>([]);
  const linksRef = useRef<MemoryLink[]>([]);
  const positionsRef = useRef<Map<number, NodePosition>>(new Map());
  const initializedRef = useRef(false);
  const tooltipRef = useRef<any>(null);
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [linkedMemories, setLinkedMemories] = useState<Memory[]>([]);
  const [visibleLinkCount, setVisibleLinkCount] = useState(0);

  // Fetch memories
  const { data, error, isLoading } = useSWR(
    `/memories/${conversationId}`,
    () => api.getMemories(conversationId),
    { refreshInterval: 0 }
  );

  // Clear selection when clicking empty space
  const handleClearSelection = useCallback(() => {
    setSelectedId(null);
    setSelectedMemory(null);
    setLinkedMemories([]);
  }, []);

  // Handle bubble click - update panel without changing positions
  const handleBubbleClick = useCallback((node: MemoryNode, event: MouseEvent) => {
    event.stopPropagation(); // Prevent triggering SVG click
    
    const memory = data?.nodes.find((n) => n.id === node.id);
    if (!memory) return;

    setSelectedMemory({
      ...memory,
      type: memory.type === "semantic" ? "semantic" : "bubble",
    } as Memory);

    // Use ONLY the connections explicitly stored in this bubble's metadata
    const linkedIds = new Set(
      memory.connections.map((conn) => conn.target_id)
    );

    const linked = (data?.nodes.filter((n) => linkedIds.has(n.id)) || []).map(
      (n) => ({
        ...n,
        type: n.type === "semantic" ? "semantic" : "bubble",
      } as Memory)
    );
    setLinkedMemories(linked);
  }, [data]);

  // Handle selecting a linked memory
  const handleSelectLinkedMemory = useCallback((id: number) => {
    const memory = data?.nodes.find((n) => n.id === id);
    if (!memory) return;

    setSelectedId(id);
    // Create a synthetic event for bubble click
    const syntheticEvent = { stopPropagation: () => {} } as MouseEvent;
    handleBubbleClick(memory as MemoryNode, syntheticEvent);
  }, [data, handleBubbleClick]);

  // Zoom control handlers
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1.5);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 0.67);
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const { width, height } = svgRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Initialize D3 simulation only once when data first loads
  useEffect(() => {
    if (!data || !svgRef.current || initializedRef.current) return;
    if (data.nodes.length === 0) return;

    initializedRef.current = true;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // Create tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "memory-tooltip")
      .style("position", "fixed")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.85)")
      .style("color", "#fff")
      .style("padding", "10px 14px")
      .style("border-radius", "8px")
      .style("font-size", "13px")
      .style("max-width", "280px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
      .style("line-height", "1.4");
    
    tooltipRef.current = tooltip;

    // Prepare nodes with positions
    const nodes: MemoryNode[] = data.nodes.map((node) => {
      const existingPos = positionsRef.current.get(node.id);
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

    nodesRef.current = nodes;

    // Create a Set of valid node IDs for fast lookup
    const nodeIds = new Set(nodes.map((node) => node.id));

    // Filter out links that reference non-existent nodes
    const links: MemoryLink[] = data.links
      .filter((link) => nodeIds.has(link.source as number) && nodeIds.has(link.target as number))
      .map((link) => ({
        source: link.source,
        target: link.target,
        strength: link.strength,
      }));

    linksRef.current = links;

    // Create simulation - runs ONCE for initial layout, then stops permanently
    const simulation = d3
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

    simulationRef.current = simulation;

    // Create container
    const g = svg.append("g");
    gRef.current = g;

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Click on SVG background to clear selection
    svg.on("click", (event) => {
      if (event.target === svgRef.current) {
        handleClearSelection();
      }
    });

    // Create a container for links (initially empty)
    g.append("g").attr("class", "links-container");

    // Draw bubbles
    const nodeGroup = g.append("g").attr("class", "nodes-container");
    
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

    // Add hover tooltip handlers
    node
      .on("mouseenter", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .html(`
            <div style="font-weight: 600; margin-bottom: 6px; color: ${getBubbleColor(d.type, d.created_at)}">
              Memory #${d.id} · ${d.type === "semantic" ? "Semantic Fact" : "Episodic Bubble"}
            </div>
            <div style="color: #e0e0e0">${truncateText(d.text, 200)}</div>
            ${d.connections && d.connections.length > 0 ? 
              `<div style="margin-top: 8px; font-size: 11px; color: #999">
                ${d.connections.length} connection${d.connections.length !== 1 ? 's' : ''}
              </div>` : ''
            }
          `);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", (event.clientY - 10) + "px")
          .style("left", (event.clientX + 15) + "px");
      })
      .on("mouseleave", () => {
        tooltip.style("visibility", "hidden");
      });

    // Add click handler
    node.on("click", (event: MouseEvent, d) => {
      setSelectedId(d.id);
      handleBubbleClick(d, event);
    });

    // Drag is DISABLED - bubbles remain in fixed positions

    // Update positions on simulation tick
    simulation.on("tick", () => {
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);

      // Save positions during simulation
      nodes.forEach((d) => {
        if (d.x !== undefined && d.y !== undefined) {
          positionsRef.current.set(d.id, { x: d.x, y: d.y, fx: d.fx, fy: d.fy });
        }
      });
    });

    // Stop simulation after initial layout completes (approx 2 seconds)
    setTimeout(() => {
      simulation.stop();

      // FREEZE all bubble positions permanently
      nodes.forEach((d) => {
        d.fx = d.x;
        d.fy = d.y;
        if (d.x !== undefined && d.y !== undefined) {
          positionsRef.current.set(d.id, { x: d.x, y: d.y, fx: d.fx, fy: d.fy });
        }
      });

      console.log("✓ Bubble positions frozen - bubbles will no longer move");
    }, 2000);

    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [data, dimensions, handleBubbleClick, handleClearSelection]);

  // Update connections and highlighting when selection changes
  useEffect(() => {
    if (!gRef.current || !nodesRef.current.length) return;

    const g = gRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;

    // Get the selected node's explicit connections
    let visibleLinks: MemoryLink[] = [];
    let connectedNodeIds = new Set<number>();

    if (selectedId) {
      const selectedNode = nodes.find((n) => n.id === selectedId);
      if (selectedNode && selectedNode.connections) {
        connectedNodeIds = new Set(
          selectedNode.connections.map((conn) => conn.target_id)
        );
        
        // Only show links from this node to its explicitly connected targets
        visibleLinks = links.filter((link) => {
          const sourceId = typeof link.source === 'number' ? link.source : (link.source as any).id;
          const targetId = typeof link.target === 'number' ? link.target : (link.target as any).id;
          return sourceId === selectedId && connectedNodeIds.has(targetId);
        });
      }
    }

    setVisibleLinkCount(visibleLinks.length);

    // Update connection lines with smooth animation
    const linksContainer = g.select(".links-container");
    
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

    // Update bubble highlighting and dimming
    g.selectAll<SVGGElement, MemoryNode>(".memory-bubble")
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
  }, [selectedId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading memories...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Failed to load memories. Make sure the backend is running.
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-bubble-blue/30"></div>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Memories Yet</h3>
          <p className="text-sm text-muted-foreground">
            Start chatting to create your first memory bubbles!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full graph-canvas"
        style={{ touchAction: "none" }}
      />

      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg flex flex-col">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-muted transition-colors rounded-t-lg border-b border-border"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-muted transition-colors border-b border-border"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 hover:bg-muted transition-colors rounded-b-lg"
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <h4 className="text-xs font-semibold mb-2">Memory Types</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[hsl(36,100%,70%)]"></div>
            <span className="text-xs text-muted-foreground">Semantic Facts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[hsl(142,76%,36%)]"></div>
            <span className="text-xs text-muted-foreground">Episodic Bubbles</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {data.nodes.length} memories
          {selectedId && visibleLinkCount > 0 && (
            <> · {visibleLinkCount} connection{visibleLinkCount !== 1 ? 's' : ''}</>
          )}
        </p>
      </div>

      {/* Controls hint */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground">
          Hover for details · Click to select · Click empty to deselect
        </p>
      </div>

      {/* Detail Panel */}
      <MemoryDetailPanel
        memory={selectedMemory}
        linkedMemories={linkedMemories}
        onClose={() => {
          setSelectedMemory(null);
          setSelectedId(null);
        }}
        onSelectMemory={handleSelectLinkedMemory}
      />
    </div>
  );
}
