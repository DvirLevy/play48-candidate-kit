import { useEffect, type RefObject } from 'react'
import type { Manifest } from '@/api/types'
import { frameAt } from '@/lib/sprite'

/** Draws the looping animation on a canvas with requestAnimationFrame (time-based, not setInterval). */
export function useSpriteAnimation(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  image: HTMLImageElement | undefined,
  manifest: Manifest | undefined,
  paused = false,
) {
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !image || !manifest) return

    const { frames, fps, frameCount, frameWidth, frameHeight } = manifest
    canvas.width = frameWidth
    canvas.height = frameHeight

    const draw = (index: number) => {
      const f = frames[index]
      if (!f) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, canvas.width, canvas.height)
    }

    if (paused) {
      draw(0)
      return
    }

    let raf = 0
    let start: number | null = null
    let last = -1
    const tick = (now: number) => {
      start ??= now
      const index = frameAt(now - start, fps, frameCount)
      if (index !== last) {
        draw(index)
        last = index
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [canvasRef, image, manifest, paused])
}
