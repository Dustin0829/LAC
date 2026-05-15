import axios from 'axios'
import { getApiBaseUrl } from '@/api/config'

/**
 * Shared Axios instance for `src/api/services/*`.
 * Add interceptors here (auth header, error unwrap) as you wire the backend.
 */
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

export { api }
export default api
