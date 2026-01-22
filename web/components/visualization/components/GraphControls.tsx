"use client";

import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

/**
 * Zoom control buttons for the memory graph
 */
export function GraphControls({ onZoomIn, onZoomOut, onResetView }: GraphControlsProps) {
  return (
    <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg flex flex-col">
      <button
        onClick={onZoomIn}
        className="p-2 hover:bg-muted transition-colors rounded-t-lg border-b border-border"
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4 text-muted-foreground" />
      </button>
      <button
        onClick={onZoomOut}
        className="p-2 hover:bg-muted transition-colors border-b border-border"
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4 text-muted-foreground" />
      </button>
      <button
        onClick={onResetView}
        className="p-2 hover:bg-muted transition-colors rounded-b-lg"
        title="Reset view"
      >
        <RotateCcw className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
