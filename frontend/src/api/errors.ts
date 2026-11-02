import axios from 'axios'

/** Single error type the UI deals with, whatever went wrong underneath. */
export class ApiError extends Error {
  readonly code: string
  readonly status: number | null
  readonly details: string[]

  constructor(
    message: string,
    code = 'UNKNOWN',
    status: number | null = null,
    details: string[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }

  get isNetwork() {
    return this.code === 'NETWORK_ERROR'
  }
}

function stringifyDetails(details: unknown): string[] {
  if (!Array.isArray(details)) return []
  return details.map((d) => {
    if (typeof d === 'string') return d
    if (d && typeof d === 'object') {
      const { path, message } = d as { path?: unknown; message?: unknown }
      const where = Array.isArray(path) ? path.join('.') : typeof path === 'string' ? path : ''
      const text = typeof message === 'string' ? message : JSON.stringify(d)
      return where ? `${where}: ${text}` : text
    }
    return String(d)
  })
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new ApiError(
        'Cannot reach the server. Check that the backend is running and try again.',
        'NETWORK_ERROR',
      )
    }
    const body = error.response.data as {
      error?: { code?: string; message?: string; details?: unknown }
    }
    return new ApiError(
      body?.error?.message ?? error.message,
      body?.error?.code ?? 'HTTP_ERROR',
      error.response.status,
      stringifyDetails(body?.error?.details),
    )
  }
  if (error instanceof Error) return new ApiError(error.message)
  return new ApiError('Something went wrong')
}
