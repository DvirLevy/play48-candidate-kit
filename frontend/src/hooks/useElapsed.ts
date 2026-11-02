import { useEffect, useState } from 'react'

/** Milliseconds since `since` (ISO string or epoch ms), ticking each second while `active`. */
export function useElapsed(since: string | number | null, active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  if (since === null) return 0
  const start = typeof since === 'number' ? since : new Date(since).getTime()
  return Math.max(0, now - start)
}
