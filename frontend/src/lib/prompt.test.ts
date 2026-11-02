import { promptFormSchema } from '@/lib/prompt'

describe('promptFormSchema', () => {
  it('accepts 3-500 chars and trims', () => {
    expect(promptFormSchema.parse({ prompt: '  abc  ' }).prompt).toBe('abc')
  })
  it('rejects too short and too long', () => {
    expect(promptFormSchema.safeParse({ prompt: 'ab' }).success).toBe(false)
    expect(promptFormSchema.safeParse({ prompt: 'a'.repeat(501) }).success).toBe(false)
  })
})
