/**
 * Shared request/response payload types and envelopes.
 * Add `auth.types.ts`, domain types, and segment subfolders as the API grows.
 */

export type ApiSuccess<T> = {
  data: T
}

export type ApiErrorBody = {
  message?: string
  success?: false
}
