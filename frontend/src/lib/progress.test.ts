import { stepStates } from '@/lib/progress'

describe('stepStates', () => {
  it('marks nothing started while queued', () => {
    expect(stepStates('QUEUED')).toEqual(['pending', 'pending', 'pending', 'pending'])
  })
  it('marks earlier steps done and current active', () => {
    expect(stepStates('GENERATING_VIDEO')).toEqual(['done', 'active', 'pending', 'pending'])
  })
  it('marks everything done on completion', () => {
    expect(stepStates('COMPLETED')).toEqual(['done', 'done', 'done', 'done'])
  })
})
