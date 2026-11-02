import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Wand2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { INITIAL_PROMPT, PROMPT_MAX, promptFormSchema, type PromptFormValues } from '@/lib/prompt'

interface Props {
  disabled: boolean
  onSubmit: (prompt: string) => void | Promise<void>
}

export function PromptForm({ disabled, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: { prompt: INITIAL_PROMPT },
  })
  const length = useWatch({ control, name: 'prompt' })?.length ?? 0

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values.prompt))}
      className="space-y-3"
      noValidate
    >
      <Label htmlFor="prompt">Describe the edit</Label>
      <Textarea
        id="prompt"
        disabled={disabled}
        aria-invalid={!!errors.prompt}
        aria-describedby="prompt-help"
        {...register('prompt')}
      />
      <div id="prompt-help" className="flex justify-between gap-2 text-xs">
        <span
          role={errors.prompt ? 'alert' : undefined}
          className={errors.prompt ? 'text-destructive' : 'text-muted-foreground'}
        >
          {errors.prompt?.message ?? 'e.g. “Make the shirt red and walk to the right”'}
        </span>
        <span className="text-muted-foreground">
          {length}/{PROMPT_MAX}
        </span>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={disabled}>
        {disabled ? <Loader2 className="animate-spin" /> : <Wand2 />}
        {disabled ? 'Generating…' : 'Generate animation'}
      </Button>
    </form>
  )
}
