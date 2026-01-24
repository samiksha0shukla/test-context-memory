import { useState, useCallback } from "react";
import type { Memory, MemoryNode } from "@/types/memory";

/**
 * Hook to manage memory selection state and actions
 * Handles bubble selection, linked memories, and clearing selection
 */
export function useMemorySelection(data: any) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [linkedMemories, setLinkedMemories] = useState<Memory[]>([]);
  const [visibleLinkCount, setVisibleLinkCount] = useState(0);

  // Clear selection when clicking empty space
  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setSelectedMemory(null);
    setLinkedMemories([]);
  }, []);

  // Handle bubble click - update panel without changing positions
  const selectBubble = useCallback((node: MemoryNode, event: MouseEvent) => {
    event.stopPropagation();

    const memory = data?.nodes.find((n: any) => n.id === node.id);
    if (!memory) return;

    setSelectedMemory({
      ...memory,
      type: memory.type === "semantic" ? "semantic" : "bubble",
    } as Memory);

    // Use ONLY the connections explicitly stored in this bubble's metadata
    // Use target_global_id for node lookup (target_id is now local_id)
    const linkedIds = new Set(
      memory.connections.map((conn: any) => conn.target_global_id ?? conn.target_id)
    );

    const linked = (data?.nodes.filter((n: any) => linkedIds.has(n.id)) || []).map(
      (n: any) => ({
        ...n,
        type: n.type === "semantic" ? "semantic" : "bubble",
      } as Memory)
    );
    setLinkedMemories(linked);
  }, [data]);

  // Handle selecting a linked memory
  const selectLinkedMemory = useCallback((id: number, handleBubbleClick: (node: MemoryNode, event: MouseEvent) => void) => {
    const memory = data?.nodes.find((n: any) => n.id === id);
    if (!memory) {
      console.warn(`⚠ Cannot find memory with id ${id}`);
      return;
    }

    console.log(`✓ Selecting linked memory: ${id}`);
    setSelectedId(id);
    // Create a synthetic event for bubble click
    const syntheticEvent = { stopPropagation: () => {} } as MouseEvent;
    handleBubbleClick(memory as MemoryNode, syntheticEvent);
  }, [data]);

  return {
    selectedId,
    setSelectedId,
    selectedMemory,
    setSelectedMemory,
    linkedMemories,
    setLinkedMemories,
    visibleLinkCount,
    setVisibleLinkCount,
    clearSelection,
    selectBubble,
    selectLinkedMemory,
  };
}
