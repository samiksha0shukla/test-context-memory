"use client";

import { X, Calendar, Link as LinkIcon } from "lucide-react";
import type { Memory } from "@/types/memory";
import { getBubbleColor } from "@/lib/utils";

interface MemoryDetailPanelProps {
  memory: Memory | null;
  linkedMemories: Memory[];
  onClose: () => void;
  onSelectMemory: (id: number) => void;
  useConstantColor?: boolean;
}

export function MemoryDetailPanel({
  memory,
  linkedMemories,
  onClose,
  onSelectMemory,
  useConstantColor = false,
}: MemoryDetailPanelProps) {
  if (!memory) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Panel - full width on mobile, fixed width on desktop */}
      <div className="fixed md:absolute top-0 right-0 w-full md:w-96 h-full bg-card border-l border-border shadow-xl flex flex-col animate-slide-in-right z-50">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Memory Icon */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{
              backgroundColor: getBubbleColor(
                memory.type === "semantic" ? "semantic" : "bubble",
                memory.created_at,
                useConstantColor
              ),
            }}
          >
            {memory.local_id}
          </div>

          {/* Memory Title */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2">
              {memory.text}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(memory.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-md transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Memory Type Badge */}
        <div className="flex gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              memory.type === "semantic"
                ? "bg-[hsl(36,100%,70%)]/20 text-[hsl(36,100%,35%)]"
                : "bg-[hsl(214,100%,70%)]/20 text-[hsl(214,100%,35%)]"
            }`}
          >
            {memory.type === "semantic" ? "Semantic Fact" : "Episodic Bubble"}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            Importance: {(memory.importance * 100).toFixed(0)}%
          </span>
        </div>

        {/* Full Text */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
            Content
          </h4>
          <p className="text-sm text-foreground leading-relaxed">
            {memory.text}
          </p>
        </div>

        {/* Linked Memories */}
        {linkedMemories.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase flex items-center gap-2">
              <LinkIcon className="w-3 h-3" />
              Linked Bubbles ({linkedMemories.length})
            </h4>
            <div className="space-y-2">
              {linkedMemories.map((linkedMemory) => (
                <button
                  key={linkedMemory.id}
                  onClick={() => onSelectMemory(linkedMemory.id)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                >
                  {/* Linked Memory Icon */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 group-hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: getBubbleColor(
                        linkedMemory.type === "semantic" ? "semantic" : "bubble",
                        linkedMemory.created_at,
                        useConstantColor
                      ),
                    }}
                  >
                    {linkedMemory.local_id}
                  </div>

                  {/* Linked Memory Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2 mb-1">
                      {linkedMemory.text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(linkedMemory.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
