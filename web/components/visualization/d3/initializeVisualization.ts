import * as d3 from "d3";

/**
 * Initializes SVG, zoom behavior, and container groups
 * Returns the main container group and zoom behavior
 */
export function initializeSVG(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  onClearSelection: () => void
): {
  g: d3.Selection<SVGGElement, unknown, null, undefined>;
  zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
} {
  // Clear any existing content
  svg.selectAll("*").remove();

  // Create main container group
  const g = svg.append("g");

  // Add zoom behavior
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 4])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Click on SVG background to clear selection
  svg.on("click", (event) => {
    if (event.target === svg.node()) {
      onClearSelection();
    }
  });

  // Create containers for links and nodes
  g.append("g").attr("class", "links-container");

  return { g, zoom };
}

/**
 * Initializes SVG for landing hero graph: main group and links container, no zoom.
 */
export function initializeLandingSVG(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
): d3.Selection<SVGGElement, unknown, null, undefined> {
  svg.selectAll("*").remove();
  const g = svg.append("g");
  g.append("g").attr("class", "links-container");
  return g;
}
