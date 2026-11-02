import axios from 'axios'
import { toApiError } from '@/api/errors'
import { env } from '@/lib/env'

export const http = axios.create({ baseURL: env.VITE_API_URL, timeout: 15_000 })

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
)
