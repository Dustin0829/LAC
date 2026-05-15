import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { getApiBaseUrl } from '@/api/config'
import type { ApiErrorBody } from '@/api/types/global.types'

/** Registered from `authStore` so this module does not import the store (avoids circular deps). */
let resolveAccessToken: () => string | null = () => null

export function registerAuthAccessTokenGetter(fn: () => string | null): void {
  resolveAccessToken = fn
}

function getBearerAccessToken(): string | null {
  return resolveAccessToken()
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getBearerAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
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
      return { ...response, data: (body as { data: unknown }).data }
    }
    return response
  },
  (error: AxiosError<ApiErrorBody>) => {
    const data = error.response?.data
    const message =
      data && typeof data === 'object' && typeof data.message === 'string'
        ? data.message
        : error.message
    return Promise.reject(new Error(message))
  }
)

export default api
