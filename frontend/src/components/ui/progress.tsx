import { cn } from '@/lib/utils'

export function Progress({ value, className }: { value: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('bg-secondary h-2 w-full overflow-hidden rounded-full', className)}
    >
      <div className="bg-primary h-full transition-all duration-700" style={{ width: `${pct}%` }} />
    </div>
  )
}
