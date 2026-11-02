import { z } from 'zod'

export const INITIAL_PROMPT = 'Change the shirt to blue and generate a walking animation loop.'
export const PROMPT_MIN = 3
export const PROMPT_MAX = 500

/** Mirrors the backend createGenerationBodySchema. */
export const promptFormSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(PROMPT_MIN, `Prompt must be at least ${PROMPT_MIN} characters`)
    .max(PROMPT_MAX, `Prompt must be at most ${PROMPT_MAX} characters`),
})

export type PromptFormValues = z.infer<typeof promptFormSchema>
