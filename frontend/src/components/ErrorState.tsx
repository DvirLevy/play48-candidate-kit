import { AlertTriangle, RotateCcw, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'

interface Props {
  error: unknown
  title?: string
  onRetry?: () => void
  action?: ReactNode
}

/** Full-page error view used by the error boundary, router and failed loads. */
export function ErrorState({ error, title, onRetry, action }: Props) {
  const apiError = error instanceof ApiError ? error : null
  const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
  const Icon = apiError?.isNetwork ? WifiOff : AlertTriangle
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <span className="bg-destructive/10 text-destructive grid size-14 place-items-center rounded-full">
        <Icon className="size-7" />
      </span>
      <h1 className="text-xl font-semibold">
        {title ?? (apiError?.isNetwork ? 'Server unreachable' : 'Something went wrong')}
      </h1>
      <p className="text-muted-foreground text-sm">{message}</p>
      {apiError?.code && apiError.code !== 'UNKNOWN' && (
        <code className="bg-muted rounded px-2 py-1 text-xs">{apiError.code}</code>
      )}
      <div className="flex gap-2">
        {onRetry && (
          <Button onClick={onRetry}>
            <RotateCcw /> Try again
          </Button>
        )}
        {action}
      </div>
    </div>
  )
}
