import useSWR from "swr";
import { api } from "@/lib/api";

/**
 * Hook to fetch memory data for a conversation
 * Handles data fetching with SWR, including error handling and logging
 */
export function useMemoryData(conversationId: number) {
  const { data, error, isLoading } = useSWR(
    `/memories/${conversationId}`,
    () => api.getMemories(conversationId),
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
      onError: (err) => {
        console.error('SWR error:', err);
      },
      onSuccess: (data) => {
        console.log('SWR success:', { nodes: data.nodes?.length, links: data.links?.length });
      }
    }
  );

  return {
    data,
    error,
    isLoading,
    hasData: !!data && data.nodes.length > 0,
  };
}
