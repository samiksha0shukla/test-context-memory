import { useState, useEffect } from "react";

/**
 * Hook to manage graph viewport dimensions
 * Automatically updates on window resize
 */
export function useGraphDimensions(svgRef: React.RefObject<SVGSVGElement | null>) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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
  }, [svgRef]);

  return dimensions;
}
