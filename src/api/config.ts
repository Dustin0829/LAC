const rawBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

/** API origin (`VITE_API_URL`). Used by `src/api/client.ts` and service modules. */
export function getApiBaseUrl(): string | undefined {
  return rawBase || undefined
}
