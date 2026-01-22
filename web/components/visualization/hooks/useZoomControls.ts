import { useCallback } from "react";
import * as d3 from "d3";

/**
 * Hook to manage zoom control actions
 * Provides zoom in, zoom out, and reset view functions
 */
export function useZoomControls(
  svgRef: React.RefObject<SVGSVGElement | null>,
  zoomRef: React.MutableRefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>
) {
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1.5);
    }
  }, [svgRef, zoomRef]);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 0.67);
    }
  }, [svgRef, zoomRef]);

  const handleResetView = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }, [svgRef, zoomRef]);

  return {
    handleZoomIn,
    handleZoomOut,
    handleResetView,
  };
}
