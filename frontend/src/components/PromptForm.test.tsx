import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptForm } from '@/components/PromptForm'
import { INITIAL_PROMPT } from '@/lib/prompt'

describe('PromptForm', () => {
  it('is pre-filled and submits the prompt', async () => {
    const onSubmit = vi.fn()
    render(<PromptForm disabled={false} onSubmit={onSubmit} />)
    expect(screen.getByLabelText('Describe the edit')).toHaveValue(INITIAL_PROMPT)
    await userEvent.click(screen.getByRole('button', { name: /generate animation/i }))
    expect(onSubmit).toHaveBeenCalledWith(INITIAL_PROMPT)
  })
  it('shows a validation error for short prompts', async () => {
    const onSubmit = vi.fn()
    render(<PromptForm disabled={false} onSubmit={onSubmit} />)
    const box = screen.getByLabelText('Describe the edit')
    await userEvent.clear(box)
    await userEvent.type(box, 'hi')
    await userEvent.click(screen.getByRole('button'))
    expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
  it('disables input and button while a job runs', () => {
    render(<PromptForm disabled onSubmit={vi.fn()} />)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByLabelText('Describe the edit')).toBeDisabled()
  })
})
