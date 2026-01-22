"use client";

import { Loader2, AlertCircle } from "lucide-react";

/**
 * Loading state for the memory graph
 */
export function GraphLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading memories...</p>
      </div>
    </div>
  );
}

/**
 * Error state for the memory graph
 */
export function GraphError() {
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

/**
 * Empty state when no memories exist
 */
export function GraphEmpty() {
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
