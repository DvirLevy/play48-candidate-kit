import { frameAt } from '@/lib/sprite'

describe('frameAt', () => {
  it('advances by fps and loops', () => {
    expect(frameAt(0, 30, 120)).toBe(0)
    expect(frameAt(1000, 30, 120)).toBe(30)
    expect(frameAt(4000, 30, 120)).toBe(0)
    expect(frameAt(4034, 30, 120)).toBe(1)
  })
  it('is safe for negative time and empty sheets', () => {
    expect(frameAt(-50, 30, 10)).toBe(0)
    expect(frameAt(100, 30, 0)).toBe(0)
  })
})
