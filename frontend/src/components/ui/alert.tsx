import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const alertVariants = cva('relative w-full rounded-lg border p-4 text-sm', {
  variants: {
    variant: {
      default: 'bg-card',
      destructive: 'border-destructive/40 bg-destructive/10 text-destructive',
      warning: 'border-amber-400/50 bg-amber-50 text-amber-900',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}
export function AlertTitle({ className, ...props }: React.ComponentProps<'h5'>) {
  return <h5 className={cn('mb-1 font-semibold', className)} {...props} />
}
export function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
}
