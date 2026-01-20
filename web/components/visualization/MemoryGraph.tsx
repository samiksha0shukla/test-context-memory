"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import useSWR from "swr";
import { Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { MemoryNode, MemoryLink, Memory } from "@/types/memory";
import {
  getBubbleRadius,
  getBubbleColor,
  getConnectionOpacity,
  getConnectionThickness,
} from "@/lib/utils";
import { MemoryDetailPanel } from "./MemoryDetailPanel";

interface MemoryGraphProps {
  conversationId: number;
}

export function MemoryGraph({ conversationId }: MemoryGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
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

  // Handle bubble click
  const handleBubbleClick = (node: MemoryNode) => {
    // Find the full memory object
    const memory = data?.nodes.find((n) => n.id === node.id);
    if (!memory) return;

    setSelectedMemory({
      ...memory,
      type: memory.type === "semantic" ? "semantic" : "bubble",
    } as Memory);

    // Use ONLY the connections explicitly stored in this bubble's metadata
    // NOT all links in the graph that happen to reference this bubble
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
  };

  // Handle selecting a linked memory
  const handleSelectLinkedMemory = (id: number) => {
    const memory = data?.nodes.find((n) => n.id === id);
    if (!memory) return;

    setSelectedId(id);
    handleBubbleClick(memory as MemoryNode);
  };

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

  // D3 Force Simulation
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Prepare data
    const nodes: MemoryNode[] = data.nodes.map((node) => ({
      ...node,
      type: node.type === "semantic" ? "semantic" : "bubble",
      radius: getBubbleRadius(node.importance),
    }));

    // Create a Set of valid node IDs for fast lookup
    const nodeIds = new Set(nodes.map((node) => node.id));

    // Filter out links that reference non-existent nodes
    const links: MemoryLink[] = data.links
      .filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target))
      .map((link) => ({
        source: link.source,
        target: link.target,
        strength: link.strength,
      }));

    // Filter links to only show those EXPLICITLY listed in the selected bubble's connections
    // NOT all links that happen to reference the selected bubble
    let visibleLinks: MemoryLink[] = [];
    if (selectedId) {
      const selectedNode = nodes.find((n) => n.id === selectedId);
      if (selectedNode && selectedNode.connections) {
        // Only show links from this node to its explicitly connected targets
        const connectedIds = new Set(
          selectedNode.connections.map((conn) => conn.target_id)
        );
        visibleLinks = links.filter((link) => {
          const sourceId = typeof link.source === 'number' ? link.source : link.source.id;
          const targetId = typeof link.target === 'number' ? link.target : link.target.id;
          return sourceId === selectedId && connectedIds.has(targetId);
        });
      }
    }

    // Update visible link count for legend
    setVisibleLinkCount(visibleLinks.length);

    if (nodes.length === 0) {
      return;
    }

    const { width, height } = dimensions;

    // Create simulation - only apply link force if there's a selected bubble
    const simulation = d3
      .forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d: any) => d.radius + 15)
      )
      .velocityDecay(0.7)
      .alphaDecay(0.05)
      .alphaMin(0.001);

    // Apply link force only if there's a selection
    if (selectedId && visibleLinks.length > 0) {
      simulation.force(
        "link",
        d3
          .forceLink(visibleLinks)
          .id((d: any) => d.id)
          .distance(150)
          .strength(1)
      );
    }

    // Create container
    const g = svg.append("g");

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Draw connection lines - only visible links
    const link = g
      .append("g")
      .selectAll("line")
      .data(visibleLinks)
      .join("line")
      .attr("class", "connection-line")
      .attr("stroke", "#000")
      .attr("stroke-opacity", (d) => getConnectionOpacity(d.strength))
      .attr("stroke-width", (d) => getConnectionThickness(d.strength));

    // Draw bubbles
    const node = g
      .append("g")
      .selectAll<SVGGElement, MemoryNode>("g")
      .data(nodes)
      .join("g")
      .attr("class", "memory-bubble")
      .style("cursor", "pointer")
      .style("pointer-events", "all");

    // Add circle
    node
      .append("circle")
      .attr("r", (d) => d.radius!)
      .attr("fill", (d) => getBubbleColor(d.type, d.created_at))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .classed("selected", (d) => d.id === selectedId)
      .on("click", (_event, d) => {
        setSelectedId(d.id);
        handleBubbleClick(d);
      });

    // Add text - showing only memory ID
    node
      .append("text")
      .text((d) => d.id.toString())
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", (d) => {
        // Scale font size based on bubble size
        const size = d.radius! / 3;
        return `${Math.max(12, Math.min(size, 20))}px`;
      })
      .attr("font-weight", "700")
      .attr("fill", "#fff")
      .attr("pointer-events", "none")
      .style("user-select", "none");

    // Add drag behavior to nodes (after all elements are added)
    node.call(
      d3
        .drag<SVGGElement, MemoryNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.1).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          // Keep position fixed after drag
          d.fx = d.x;
          d.fy = d.y;
        })
    );

    // Update positions on simulation tick
    simulation.on("tick", () => {
      // If a bubble is selected, pull connected nodes closer
      if (selectedId) {
        const selectedNode = nodes.find((n) => n.id === selectedId);
        if (selectedNode && typeof selectedNode.x === 'number' && typeof selectedNode.y === 'number') {
          const sx = selectedNode.x;
          const sy = selectedNode.y;

          visibleLinks.forEach((link: any) => {
            const connectedNode =
              link.source.id === selectedId ? link.target : link.source;

            if (typeof connectedNode.x === 'number' && typeof connectedNode.y === 'number') {
              // Pull connected node closer to selected node
              const dx = sx - connectedNode.x;
              const dy = sy - connectedNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const targetDistance = 150; // Desired distance

              if (distance > targetDistance) {
                const factor = 0.1; // Adjustment speed
                connectedNode.x += dx * factor;
                connectedNode.y += dy * factor;
              }
            }
          });
        }
      }

      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Freeze positions after simulation settles
    simulation.on("end", () => {
      nodes.forEach((d) => {
        d.fx = d.x;
        d.fy = d.y;
      });
    });

    return () => {
      simulation.stop();
    };
  }, [data, dimensions, selectedId]);

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

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <h4 className="text-xs font-semibold mb-2">Memory Types</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[hsl(36,100%,70%)]"></div>
            <span className="text-xs text-muted-foreground">Semantic Facts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[hsl(214,100%,70%)]"></div>
            <span className="text-xs text-muted-foreground">Episodic Bubbles</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {data.nodes.length} memories
          {selectedId && visibleLinkCount > 0 && (
            <> · {visibleLinkCount} connection{visibleLinkCount !== 1 ? 's' : ''} shown</>
          )}
        </p>
      </div>

      {/* Controls hint */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground">
          Click bubble to view · Drag to move · Scroll to zoom
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

