import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchManifest, loadImage } from '@/api/generations'
import type { Generation, Manifest } from '@/api/types'
import { generationKeys } from '@/hooks/useLatestGeneration'

export interface SpriteAssets {
  generationId: string
  manifest: Manifest
  image: HTMLImageElement
}

/**
 * Preloads manifest + spritesheet. `keepPreviousData` keeps the old animation
 * available while the new one downloads, so the swap is instant.
 */
export function useSpriteAssets(generation: Generation | null | undefined) {
  const artifacts = generation?.status === 'COMPLETED' ? generation.artifacts : null
  return useQuery({
    queryKey: generationKeys.assets(generation?.id ?? 'none'),
    enabled: artifacts !== null && artifacts !== undefined,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    queryFn: async (): Promise<SpriteAssets> => {
      const [manifest, image] = await Promise.all([
        fetchManifest(artifacts!.manifest),
        loadImage(artifacts!.spritesheet),
      ])
      return { generationId: generation!.id, manifest, image }
    },
  })
}
