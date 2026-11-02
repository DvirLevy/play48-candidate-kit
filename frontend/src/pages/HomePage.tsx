import { Loader2, RotateCcw } from 'lucide-react'
import type { ApiError } from '@/api/errors'
import { ArtifactsPanel } from '@/components/ArtifactsPanel'
import { ErrorState } from '@/components/ErrorState'
import { HistoryList } from '@/components/HistoryList'
import { ProgressSteps } from '@/components/ProgressSteps'
import { PromptForm } from '@/components/PromptForm'
import { SpritePlayer } from '@/components/SpritePlayer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStudio } from '@/hooks/useStudio'

const PLACEHOLDER = '/assets/input_character_white_shirt.png'

function SubmitError({ error }: { error: ApiError }) {
  const inProgress = error.code === 'GENERATION_IN_PROGRESS'
  return (
    <Alert variant={inProgress ? 'warning' : 'destructive'}>
      <AlertTitle>
        {inProgress ? 'A generation is already running' : 'Could not start generation'}
      </AlertTitle>
      <AlertDescription>
        <p>
          {inProgress
            ? 'Another job is in progress on the server. Please wait for it to finish, then submit again.'
            : error.message}
        </p>
        {error.details.length > 0 && (
          <ul className="mt-1 list-disc pl-5">
            {error.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  )
}

export default function HomePage() {
  const studio = useStudio()
  const { latest, job, running, assets } = studio

  // Initial load failed for a reason other than "nothing generated yet" (that resolves to null).
  if (latest.isError) {
    return <ErrorState error={latest.error} onRetry={() => void latest.refetch()} />
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Animation</CardTitle>
          </CardHeader>
          <CardContent>
            <SpritePlayer
              assets={assets.data}
              loading={latest.isPending || assets.isFetching}
              placeholderSrc={PLACEHOLDER}
              busy={running}
            />
            {assets.isError && (
              <p role="alert" className="text-destructive mt-3 text-sm">
                Could not load the animation: {assets.error.message}{' '}
                <button className="underline" onClick={() => void assets.refetch()}>
                  Retry
                </button>
              </p>
            )}
            {!latest.isPending && !latest.data && !job && (
              <p className="text-muted-foreground mt-3 text-center text-sm">
                Nothing generated yet — this is the original character. Submit a prompt to animate
                it.
              </p>
            )}
          </CardContent>
        </Card>
        {studio.displayedGeneration && !running && (
          <ArtifactsPanel generation={studio.displayedGeneration} />
        )}
      </section>

      <aside className="space-y-6">
        <Card>
          <CardContent className="pt-5">
            <PromptForm disabled={running} onSubmit={studio.submit} />
          </CardContent>
        </Card>

        {studio.submitError && <SubmitError error={studio.submitError} />}
        {studio.pollError && (
          <Alert variant="destructive">
            <AlertTitle>Lost contact with the server</AlertTitle>
            <AlertDescription>{studio.pollError.message}</AlertDescription>
          </Alert>
        )}

        {job && !job.finished && (
          <Card>
            <CardContent className="pt-5">
              <ProgressSteps generation={job} />
            </CardContent>
          </Card>
        )}
        {!job && studio.running && (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> Starting…
          </p>
        )}
        {job?.status === 'FAILED' && (
          <Alert variant="destructive">
            <AlertTitle>Generation failed</AlertTitle>
            <AlertDescription>
              <p>{job.errorMessage ?? 'The pipeline failed for an unknown reason.'}</p>
              <p className="mt-1 text-xs">Adjust the prompt above and submit again.</p>
            </AlertDescription>
          </Alert>
        )}
        {job?.status === 'COMPLETED' && (
          <Alert>
            <AlertTitle>Done</AlertTitle>
            <AlertDescription>
              Your new animation is playing. Submit another prompt anytime.
            </AlertDescription>
          </Alert>
        )}
        {latest.isFetching && !latest.isPending && (
          <Button variant="ghost" size="sm" disabled>
            <RotateCcw className="animate-spin" /> Refreshing
          </Button>
        )}

        <HistoryList entries={studio.history} />
      </aside>
    </main>
  )
}
