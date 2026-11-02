import { Check, Loader2 } from 'lucide-react'
import type { Generation } from '@/api/types'
import { Progress } from '@/components/ui/progress'
import { useElapsed } from '@/hooks/useElapsed'
import { activeStepIndex, PIPELINE_STEPS, stepStates } from '@/lib/progress'
import { cn, formatDuration } from '@/lib/utils'

const EXPECTED_TOTAL_MS = 210_000 // a run takes about 3.5 minutes

export function ProgressSteps({ generation }: { generation: Generation }) {
  const elapsed = useElapsed(generation.createdAt, !generation.finished)
  const states = stepStates(generation.status)
  const done = Math.max(0, activeStepIndex(generation.status))
  // Video generation dominates, so blend step progress with elapsed time (capped, never "complete")
  const pct = Math.min(
    95,
    Math.max((done / PIPELINE_STEPS.length) * 100, (elapsed / EXPECTED_TOTAL_MS) * 95),
  )

  return (
    <div className="space-y-4" aria-live="polite">
      <div className="flex items-baseline justify-between">
        <p className="font-medium">Creating your animation</p>
        <p className="text-muted-foreground text-sm tabular-nums" aria-label="Elapsed time">
          {formatDuration(elapsed)} elapsed · ~3:30 typical
        </p>
      </div>
      <Progress value={pct} />
      <ol className="space-y-3">
        {PIPELINE_STEPS.map((step, i) => (
          <li key={step.status} className="flex items-start gap-3" data-state={states[i]}>
            <span
              className={cn(
                'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border text-xs',
                states[i] === 'done' && 'bg-success text-success-foreground border-transparent',
                states[i] === 'active' && 'border-primary text-primary',
              )}
            >
              {states[i] === 'done' ? (
                <Check className="size-3.5" />
              ) : states[i] === 'active' ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                i + 1
              )}
            </span>
            <div className={cn(states[i] === 'pending' && 'text-muted-foreground')}>
              <p className="text-sm leading-6 font-medium">{step.label}</p>
              {states[i] === 'active' && (
                <p className="text-muted-foreground text-xs">{step.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
