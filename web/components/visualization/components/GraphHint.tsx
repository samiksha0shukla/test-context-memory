"use client";

/**
 * Hint text showing available controls
 */
export function GraphHint() {
  return (
    <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">
        Hover for details · Click to select · Click empty to deselect
      </p>
    </div>
  );
}
