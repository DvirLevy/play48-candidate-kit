/** Frame to show `elapsedMs` after playback started. Loops forever. */
export function frameAt(elapsedMs: number, fps: number, frameCount: number): number {
  if (frameCount <= 0) return 0
  return Math.floor((Math.max(0, elapsedMs) / 1000) * fps) % frameCount
}
