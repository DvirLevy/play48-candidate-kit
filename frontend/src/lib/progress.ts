import type { GenerationStatus } from '@/api/types'

export const PIPELINE_STEPS = [
  {
    status: 'EDITING_IMAGE',
    label: 'Editing image',
    hint: 'OpenAI applies your edit to the character',
  },
  {
    status: 'GENERATING_VIDEO',
    label: 'Generating video',
    hint: 'The slowest step — usually a few minutes',
  },
  {
    status: 'EXTRACTING_FRAMES',
    label: 'Extracting frames',
    hint: 'FFmpeg pulls every frame from the clip',
  },
  {
    status: 'BUILDING_SPRITESHEET',
    label: 'Building spritesheet',
    hint: 'Packing frames into a grid',
  },
] as const satisfies readonly { status: GenerationStatus; label: string; hint: string }[]

export type StepState = 'done' | 'active' | 'pending'

/** QUEUED -> -1 (nothing started); COMPLETED -> all steps done. */
export function activeStepIndex(status: GenerationStatus): number {
  if (status === 'COMPLETED') return PIPELINE_STEPS.length
  return PIPELINE_STEPS.findIndex((s) => s.status === status)
}

export function stepStates(status: GenerationStatus): StepState[] {
  const active = activeStepIndex(status)
  return PIPELINE_STEPS.map((_, i) => (i < active ? 'done' : i === active ? 'active' : 'pending'))
}
