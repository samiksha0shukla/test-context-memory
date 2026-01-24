import useSWR from "swr";
import { api } from "@/lib/api";

/**
 * Hook to fetch memory data for the authenticated user
 * Handles data fetching with SWR, including error handling and logging
 */
export function useMemoryData() {
  const { data, error, isLoading } = useSWR(
    "/memories",
    () => api.getMemories(),
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
