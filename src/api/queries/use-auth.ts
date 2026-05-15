/**
 * TanStack Query hooks for auth (`POST /auth/sign-out`, …).
 */
import { useMutation } from '@tanstack/react-query'
import { postAuthSignOut } from '@/api/services/auth'

const authMutationRoot = ['auth'] as const

export const authMutationKeys = {
  all: authMutationRoot,
  signOut: [...authMutationRoot, 'sign-out'] as const,
}

/** Server sign-out (`POST /auth/sign-out`) — still clear client session after call. */
export function useAuthSignOut() {
  return useMutation({
    mutationKey: authMutationKeys.signOut,
    mutationFn: () => postAuthSignOut(),
    retry: false,
  })
}
