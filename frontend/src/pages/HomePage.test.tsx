import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '@/api/errors'
import * as api from '@/api/generations'
import type { Generation } from '@/api/types'
import HomePage from '@/pages/HomePage'

vi.mock('@/api/generations')

const base: Generation = {
  id: '11111111-1111-4111-8111-111111111111',
  prompt: 'p',
  status: 'QUEUED',
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

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('HomePage', () => {
  beforeEach(() => vi.resetAllMocks())

  it('shows the original character and form when nothing was generated', async () => {
    vi.mocked(api.getLatestGeneration).mockResolvedValue(null)
    renderPage()
    expect(await screen.findByAltText('Original character')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate animation/i })).toBeEnabled()
  })

  it('shows the error page when the server is unreachable', async () => {
    vi.mocked(api.getLatestGeneration).mockRejectedValue(
      new ApiError('Cannot reach', 'NETWORK_ERROR'),
    )
    renderPage()
    expect(await screen.findByText('Server unreachable')).toBeInTheDocument()
  })

  it('starts a job, shows progress and disables submit', async () => {
    vi.mocked(api.getLatestGeneration).mockResolvedValue(null)
    vi.mocked(api.createGeneration).mockResolvedValue({ ...base, status: 'EDITING_IMAGE' })
    vi.mocked(api.getGeneration).mockResolvedValue({ ...base, status: 'EDITING_IMAGE' })
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /generate animation/i }))
    expect(await screen.findByText('Creating your animation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled()
  })

  it('tells the user when a generation is already running (409)', async () => {
    vi.mocked(api.getLatestGeneration).mockResolvedValue(null)
    vi.mocked(api.createGeneration).mockRejectedValue(
      new ApiError('busy', 'GENERATION_IN_PROGRESS', 409),
    )
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /generate animation/i }))
    expect(await screen.findByText('A generation is already running')).toBeInTheDocument()
  })

  it('shows the failure message and lets the user retry', async () => {
    vi.mocked(api.getLatestGeneration).mockResolvedValue(null)
    const failed = {
      ...base,
      status: 'FAILED' as const,
      finished: true,
      errorMessage: 'video exploded',
    }
    vi.mocked(api.createGeneration).mockResolvedValue(failed)
    vi.mocked(api.getGeneration).mockResolvedValue(failed)
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /generate animation/i }))
    expect(await screen.findByText('video exploded')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate animation/i })).toBeEnabled()
  })
})
