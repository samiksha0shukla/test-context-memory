"use client";

interface GraphLegendProps {
  totalMemories: number;
  selectedId: number | null;
  visibleLinkCount: number;
}

/**
 * Legend showing memory types and statistics
 */
export function GraphLegend({ totalMemories, selectedId, visibleLinkCount }: GraphLegendProps) {
  return (
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
        {totalMemories} memories
        {selectedId && visibleLinkCount > 0 && (
          <> · {visibleLinkCount} connection{visibleLinkCount !== 1 ? 's' : ''}</>
        )}
      </p>
    </div>
  );
}
