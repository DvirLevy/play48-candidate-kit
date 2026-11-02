import { useCallback, useState } from 'react'

export interface HistoryEntry {
  id: string
  prompt: string
  submittedAt: number
  outcome: 'running' | 'completed' | 'failed'
}

/** Session-only list of submitted prompts (newest first). */
export function usePromptHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const add = useCallback((id: string, prompt: string) => {
    setEntries((prev) => [
      { id, prompt, submittedAt: Date.now(), outcome: 'running' },
      ...prev.filter((e) => e.id !== id),
    ])
  }, [])
  const setOutcome = useCallback((id: string, outcome: HistoryEntry['outcome']) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, outcome } : e)))
  }, [])
  return { entries, add, setOutcome }
}
