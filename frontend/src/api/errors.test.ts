import { AxiosError, type AxiosResponse } from 'axios'
import { ApiError, toApiError } from '@/api/errors'

describe('toApiError', () => {
  it('maps backend error bodies and details', () => {
    const response = {
      status: 400,
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid',
          details: [{ path: ['prompt'], message: 'too short' }],
        },
      },
    } as AxiosResponse
    const err = toApiError(new AxiosError('x', '400', undefined, undefined, response))
    expect(err).toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
      message: 'Invalid',
      details: ['prompt: too short'],
    })
  })
  it('maps missing responses to a network error', () => {
    const err = toApiError(new AxiosError('Network Error'))
    expect(err.isNetwork).toBe(true)
  })
  it('passes ApiError through and wraps unknowns', () => {
    const e = new ApiError('a')
    expect(toApiError(e)).toBe(e)
    expect(toApiError('boom').message).toBe('Something went wrong')
  })
})
