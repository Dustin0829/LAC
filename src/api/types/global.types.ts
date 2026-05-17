/**
 * Shared request/response payload types and envelopes.
 * Add `auth.types.ts`, domain types, and segment subfolders as the API grows.
 */

export type ApiSuccess<T> = {
  data: T
}

/** JSON body from `sendSuccess` on the VidU backend. */
export type ApiEnvelopeSuccess<T> = {
  success: true
  message: string
  data: T
}

export type ApiEnvelopeError = {
  success: false
  message: string
  errors?: unknown
}

export type ApiErrorBody = {
  message?: string
  success?: false
}

/** List endpoints — `meta` on paginated `GET` responses. */
export type PaginationMeta = {
  page: number
  limit: number
  total: number
  total_pages: number
  current_page: number
  items_per_page: number
  total_items: number
}
