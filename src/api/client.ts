import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { getApiBaseUrl } from '@/api/config'
import type { ApiErrorBody } from '@/api/types/global.types'
import {
  expireSession,
  isAuthSessionUnauthorized,
  SessionExpiredError,
  useSessionExpiredStore,
} from '@/lib/auth/sessionExpired'

let hasAuthenticatedSession: () => boolean = () => false

/** Registered from `authStore` — true after a successful `GET /me`. */
export function registerHasAuthenticatedSession(fn: () => boolean): void {
  hasAuthenticatedSession = fn
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

function isAuthSignOutRequest(config: InternalAxiosRequestConfig): boolean {
  const path = typeof config.url === 'string' ? config.url : ''
  return path.includes('auth/sign-out')
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (useSessionExpiredStore.getState().expired && !isAuthSignOutRequest(config)) {
    return Promise.reject(new SessionExpiredError())
  }
  return config
})

api.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data
    if (
      body !== null &&
      typeof body === 'object' &&
      'success' in body &&
      (body as { success?: boolean }).success === true &&
      'data' in body
    ) {
      const next = { ...response, data: (body as { data: unknown }).data }
      if ('meta' in body && body.meta != null) {
        ;(next as { meta?: unknown }).meta = body.meta
      }
      return next
    }
    return response
  },
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status
    const data = error.response?.data
    const message =
      data && typeof data === 'object' && typeof data.message === 'string'
        ? data.message
        : error.message

    if (hasAuthenticatedSession() && isAuthSessionUnauthorized(status, message)) {
      expireSession()
      return Promise.reject(new SessionExpiredError())
    }

    return Promise.reject(new ApiRequestError(message, status))
  },
)

export default api
