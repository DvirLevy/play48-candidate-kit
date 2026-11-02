import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { ApiError } from '@/api/errors'
import { toApiError } from '@/api/errors'
import { useCreateGeneration } from '@/hooks/useCreateGeneration'
import { useGeneration } from '@/hooks/useGeneration'
import { generationKeys, useLatestGeneration } from '@/hooks/useLatestGeneration'
import { usePromptHistory } from '@/hooks/usePromptHistory'
import { useSpriteAssets } from '@/hooks/useSpriteAssets'

/** Orchestrates load-latest -> submit -> poll -> preload -> swap. */
export function useStudio() {
  const queryClient = useQueryClient()
  const latest = useLatestGeneration()
  const create = useCreateGeneration()
  const history = usePromptHistory()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<ApiError | null>(null)

  const active = useGeneration(activeId)
  const job = active.data
  const running = create.isPending || (job !== undefined && !job.finished)

  // Show the finished run being polled; otherwise whatever the server last completed.
  const displayed = job?.status === 'COMPLETED' ? job : latest.data
  const assets = useSpriteAssets(displayed)

  const finishedId = job?.finished ? job.id : null
  const finishedStatus = job?.status
  const { setOutcome } = history
  useEffect(() => {
    if (!finishedId) return
    setOutcome(finishedId, finishedStatus === 'COMPLETED' ? 'completed' : 'failed')
    if (finishedStatus === 'COMPLETED') {
      void queryClient.invalidateQueries({ queryKey: generationKeys.latest() })
    }
  }, [finishedId, finishedStatus, setOutcome, queryClient])

  const submit = async (prompt: string) => {
    setSubmitError(null)
    try {
      const generation = await create.mutateAsync(prompt)
      queryClient.setQueryData(generationKeys.detail(generation.id), generation)
      setActiveId(generation.id)
      history.add(generation.id, prompt)
    } catch (error) {
      setSubmitError(toApiError(error))
    }
  }

  return {
    latest,
    job,
    pollError: active.error ? toApiError(active.error) : null,
    running,
    submit,
    submitError,
    assets,
    history: history.entries,
    displayedGeneration: displayed ?? null,
  }
}
