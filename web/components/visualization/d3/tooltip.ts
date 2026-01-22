import * as d3 from "d3";
import type { MemoryNode } from "@/types/memory";
import { getBubbleColor, truncateText } from "@/lib/utils";

/**
 * Creates a tooltip element for memory bubbles
 * Returns the D3 selection for the tooltip
 */
export function createTooltip() {
  // Remove any existing tooltips first to prevent duplicates
  d3.selectAll(".memory-tooltip").remove();

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "memory-tooltip")
    .style("position", "fixed")
    .style("visibility", "hidden")
    .style("background", "rgba(0, 0, 0, 0.9)")
    .style("color", "#fff")
    .style("padding", "12px 16px")
    .style("border-radius", "8px")
    .style("font-size", "13px")
    .style("max-width", "300px")
    .style("pointer-events", "none")
    .style("z-index", "9999")
    .style("box-shadow", "0 4px 16px rgba(0,0,0,0.4)")
    .style("line-height", "1.5")
    .style("backdrop-filter", "blur(8px)");

  return tooltip;
}

/**
 * Attaches tooltip event handlers to node elements
 */
export function attachTooltipHandlers(
  nodeSelection: d3.Selection<SVGGElement, MemoryNode, SVGGElement, unknown>,
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>
) {
  nodeSelection
    .on("mouseenter", (event, d) => {
      tooltip
        .style("visibility", "visible")
        .style("opacity", "0")
        .html(`
          <div style="font-weight: 600; margin-bottom: 8px; color: ${getBubbleColor(d.type, d.created_at)}; font-size: 14px;">
            Memory #${d.id} · ${d.type === "semantic" ? "Semantic Fact" : "Episodic Bubble"}
          </div>
          <div style="color: #f0f0f0; line-height: 1.6;">${truncateText(d.text, 200)}</div>
          ${d.connections && d.connections.length > 0 ?
            `<div style="margin-top: 10px; font-size: 11px; color: #aaa; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
              🔗 ${d.connections.length} connection${d.connections.length !== 1 ? 's' : ''}
            </div>` : ''
          }
        `);

      // Fade in animation
      tooltip
        .transition()
        .duration(150)
        .style("opacity", "1");
    })
    .on("mousemove", (event) => {
      const tooltipNode = tooltip.node() as HTMLElement;
      const tooltipWidth = tooltipNode?.offsetWidth || 300;
      const tooltipHeight = tooltipNode?.offsetHeight || 100;

      // Position tooltip to avoid going off-screen
      let left = event.clientX + 15;
      let top = event.clientY - 10;

      if (left + tooltipWidth > window.innerWidth) {
        left = event.clientX - tooltipWidth - 15;
      }

      if (top + tooltipHeight > window.innerHeight) {
        top = window.innerHeight - tooltipHeight - 10;
      }

      tooltip
        .style("top", top + "px")
        .style("left", left + "px");
    })
    .on("mouseleave", () => {
      tooltip
        .transition()
        .duration(100)
        .style("opacity", "0")
        .on("end", () => {
          tooltip.style("visibility", "hidden");
        });
    });
}
