import type { Generation } from '@/api/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatSeconds } from '@/lib/utils'

export function ArtifactsPanel({ generation }: { generation: Generation }) {
  const { artifacts, timings } = generation
  if (!artifacts) return null
  const rows: [string, number | null][] = [
    ['Image edit', timings.imageGenerationMs],
    ['Video generation', timings.videoGenerationMs],
    ['Frame extraction', timings.frameExtractionMs],
    ['Spritesheet build', timings.spritesheetBuildMs],
    ['Total', timings.totalMs],
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline output</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">
        <figure className="space-y-2">
          <figcaption className="text-sm font-medium">Edited base image</figcaption>
          <img
            src={artifacts.editedBaseImage}
            alt="Edited base character"
            className="checkerboard aspect-square w-full rounded-lg border object-contain"
          />
        </figure>
        <figure className="space-y-2">
          <figcaption className="text-sm font-medium">Source video</figcaption>
          <video
            src={artifacts.sourceVideo}
            controls
            muted
            loop
            playsInline
            className="aspect-square w-full rounded-lg border bg-black object-contain"
          />
        </figure>
        <dl className="text-sm sm:col-span-2">
          {rows.map(([label, ms]) => (
            <div
              key={label}
              className="flex justify-between border-b py-1.5 last:border-0 last:font-semibold"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="tabular-nums">{formatSeconds(ms)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
