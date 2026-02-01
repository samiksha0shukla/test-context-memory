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
 * Check if device is mobile
 */
function isMobileDevice(): boolean {
  return window.innerWidth < 768 || 'ontouchstart' in window;
}

/**
 * Attaches tooltip event handlers to node elements
 * On desktop: hover shows tooltip
 * On mobile: long-press (500ms) shows tooltip
 */
export function attachTooltipHandlers(
  nodeSelection: d3.Selection<SVGGElement, MemoryNode, SVGGElement, unknown>,
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
  useConstantColor: boolean = false
) {
  let longPressTimer: number | null = null;
  let isLongPress = false;

  const showTooltip = (event: MouseEvent | TouchEvent, d: MemoryNode) => {
    // Use validConnectionCount if available, otherwise fallback to connections.length
    const connectionCount = (d as any).validConnectionCount ?? (d.connections ? d.connections.length : 0);

    // Get position from either mouse or touch event
    let clientX: number, clientY: number;
    if ('touches' in event) {
      clientX = event.touches[0]?.clientX || 0;
      clientY = event.touches[0]?.clientY || 0;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    tooltip
      .style("visibility", "visible")
      .style("opacity", "0")
      .html(`
        <div style="font-weight: 600; margin-bottom: 8px; color: ${getBubbleColor(d.type, d.created_at, useConstantColor)}; font-size: 14px;">
          Memory #${d.local_id} · ${d.type === "semantic" ? "Semantic Fact" : "Episodic Bubble"}
        </div>
        <div style="color: #f0f0f0; line-height: 1.6;">${truncateText(d.text, 200)}</div>
        ${connectionCount > 0 ?
          `<div style="margin-top: 10px; font-size: 11px; color: #aaa; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
            🔗 ${connectionCount} connection${connectionCount !== 1 ? 's' : ''}
          </div>` : ''
        }
      `);

    // Position tooltip
    const tooltipNode = tooltip.node() as HTMLElement;
    const tooltipWidth = tooltipNode?.offsetWidth || 300;
    const tooltipHeight = tooltipNode?.offsetHeight || 100;

    let left = clientX + 15;
    let top = clientY - 10;

    if (left + tooltipWidth > window.innerWidth) {
      left = clientX - tooltipWidth - 15;
    }

    if (top + tooltipHeight > window.innerHeight) {
      top = window.innerHeight - tooltipHeight - 10;
    }

    tooltip
      .style("top", top + "px")
      .style("left", left + "px");

    // Fade in animation
    tooltip
      .transition()
      .duration(150)
      .style("opacity", "1");
  };

  const hideTooltip = () => {
    tooltip
      .transition()
      .duration(100)
      .style("opacity", "0")
      .on("end", () => {
        tooltip.style("visibility", "hidden");
      });
  };

  const clearLongPress = () => {
    if (longPressTimer !== null) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  nodeSelection
    // Desktop: hover behavior
    .on("mouseenter", (event, d) => {
      if (isMobileDevice()) return; // Skip on mobile
      showTooltip(event, d);
    })
    .on("mousemove", (event) => {
      if (isMobileDevice()) return;
      
      const tooltipNode = tooltip.node() as HTMLElement;
      const tooltipWidth = tooltipNode?.offsetWidth || 300;
      const tooltipHeight = tooltipNode?.offsetHeight || 100;

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
      if (isMobileDevice()) return;
      hideTooltip();
    })
    // Mobile: long-press behavior
    .on("touchstart", (event, d) => {
      isLongPress = false;
      clearLongPress();
      
      longPressTimer = window.setTimeout(() => {
        isLongPress = true;
        showTooltip(event, d);
        // Auto-hide after 3 seconds on mobile
        setTimeout(hideTooltip, 3000);
      }, 500); // 500ms for long press
    })
    .on("touchend", () => {
      clearLongPress();
      // If it was a long press, hide tooltip after a delay
      if (isLongPress) {
        setTimeout(hideTooltip, 500);
      }
    })
    .on("touchmove", () => {
      // Cancel long press if user moves finger
      clearLongPress();
    });
}
