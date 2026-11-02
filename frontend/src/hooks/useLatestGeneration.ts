import { useQuery } from '@tanstack/react-query'
import { getLatestGeneration } from '@/api/generations'

export const generationKeys = {
  all: ['generations'] as const,
  latest: () => [...generationKeys.all, 'latest'] as const,
  detail: (id: string) => [...generationKeys.all, id] as const,
  assets: (id: string) => [...generationKeys.all, id, 'assets'] as const,
}

export function useLatestGeneration() {
  return useQuery({
    queryKey: generationKeys.latest(),
    queryFn: getLatestGeneration,
    staleTime: Infinity,
  })
}
