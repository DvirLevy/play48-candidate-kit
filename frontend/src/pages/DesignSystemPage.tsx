import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

const colors = [
  'background',
  'foreground',
  'primary',
  'secondary',
  'muted',
  'accent',
  'success',
  'destructive',
  'border',
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Design system</h1>
        <p className="text-muted-foreground text-sm">
          Tokens live in <code>src/index.css</code>; primitives in <code>src/components/ui</code>{' '}
          (shadcn/ui pattern).
        </p>
      </div>
      <Section title="Colour tokens">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {colors.map((c) => (
            <div key={c} className="space-y-1 text-xs">
              <div className="h-12 rounded-md border" style={{ background: `var(--${c})` }} />
              {c}
            </div>
          ))}
        </div>
      </Section>
      <Section title="Typography">
        <p className="text-2xl font-bold">Heading 2xl bold</p>
        <p className="text-base">Body base — the quick brown fox jumps over the lazy dog.</p>
        <p className="text-muted-foreground text-sm">Muted small — secondary information.</p>
      </Section>
      <Section title="Buttons">
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>
      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>
      <Section title="Form, progress, loading">
        <Textarea placeholder="Textarea" />
        <Progress value={60} />
        <Skeleton className="h-10 w-full" />
      </Section>
      <Section title="Alerts">
        <Alert>
          <AlertTitle>Default</AlertTitle>
          <AlertDescription>Neutral information.</AlertDescription>
        </Alert>
        <Alert variant="warning">
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>A generation is already running.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Destructive</AlertTitle>
          <AlertDescription>Generation failed.</AlertDescription>
        </Alert>
      </Section>
      <Section title="Card and canvas backdrop">
        <Card>
          <CardHeader>
            <CardTitle>Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="checkerboard h-24 rounded-lg border" />
          </CardContent>
        </Card>
      </Section>
    </main>
  )
}
