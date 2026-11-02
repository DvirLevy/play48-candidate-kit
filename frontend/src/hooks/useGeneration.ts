import { useQuery } from '@tanstack/react-query'
import { getGeneration } from '@/api/generations'
import { generationKeys } from '@/hooks/useLatestGeneration'

export const POLL_INTERVAL_MS = 2000

/** Polls a generation every 2s until the backend reports `finished`. */
export function useGeneration(id: string | null) {
  return useQuery({
    queryKey: generationKeys.detail(id ?? 'none'),
    queryFn: () => getGeneration(id as string),
    enabled: id !== null,
    refetchInterval: (query) => (query.state.data?.finished ? false : POLL_INTERVAL_MS),
    retry: 3,
  })
}
