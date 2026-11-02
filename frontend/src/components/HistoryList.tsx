import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HistoryEntry } from '@/hooks/usePromptHistory'

const variant = { running: 'secondary', completed: 'success', failed: 'destructive' } as const

export function HistoryList({
  entries,
  onReuse,
}: {
  entries: HistoryEntry[]
  onReuse?: (prompt: string) => void
}) {
  if (entries.length === 0) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>This session</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 text-sm">
              <button
                type="button"
                className="text-left hover:underline disabled:no-underline"
                disabled={!onReuse}
                onClick={() => onReuse?.(e.prompt)}
              >
                {e.prompt}
              </button>
              <Badge variant={variant[e.outcome]}>{e.outcome}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
