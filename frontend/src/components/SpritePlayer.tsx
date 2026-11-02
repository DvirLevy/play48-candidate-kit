import { useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { SpriteAssets } from '@/hooks/useSpriteAssets'
import { useSpriteAnimation } from '@/hooks/useSpriteAnimation'

interface Props {
  assets: SpriteAssets | undefined
  loading: boolean
  /** Shown when nothing has been generated yet. */
  placeholderSrc: string
  busy?: boolean
}

export function SpritePlayer({ assets, loading, placeholderSrc, busy }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useSpriteAnimation(canvasRef, assets?.image, assets?.manifest)

  return (
    <div className="checkerboard relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-xl border">
      {assets ? (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Looping sprite animation of the character"
          className="size-full object-contain"
        />
      ) : loading ? (
        <Skeleton className="size-full rounded-none" />
      ) : (
        <img src={placeholderSrc} alt="Original character" className="size-full object-contain" />
      )}
      {assets && (
        <span className="bg-foreground/70 absolute bottom-2 left-2 rounded px-2 py-0.5 text-xs text-white">
          {assets.manifest.frameCount} frames · {assets.manifest.fps} fps
        </span>
      )}
      {busy && assets && (
        <span className="bg-primary absolute top-2 right-2 rounded px-2 py-0.5 text-xs text-white">
          New animation generating…
        </span>
      )}
    </div>
  )
}
