import { render, screen } from '@testing-library/react'
import type { Generation } from '@/api/types'
import { ProgressSteps } from '@/components/ProgressSteps'

const generation: Generation = {
  id: 'id',
  prompt: 'p',
  status: 'GENERATING_VIDEO',
  finished: false,
  errorMessage: null,
  timings: {
    imageGenerationMs: null,
    videoGenerationMs: null,
    frameExtractionMs: null,
    spritesheetBuildMs: null,
    totalMs: null,
  },
  frameCount: null,
  artifacts: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date().toISOString(),
}

it('lists the steps with the current one active', () => {
  render(<ProgressSteps generation={generation} />)
  const items = screen.getAllByRole('listitem')
  expect(items.map((i) => i.dataset.state)).toEqual(['done', 'active', 'pending', 'pending'])
  expect(screen.getByLabelText('Elapsed time')).toHaveTextContent('0:00')
})
