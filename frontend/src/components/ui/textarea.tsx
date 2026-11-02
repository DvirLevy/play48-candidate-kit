import * as React from 'react'
import { cn } from '@/lib/utils'

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'border-input bg-card placeholder:text-muted-foreground focus-visible:ring-ring aria-invalid:border-destructive flex min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
