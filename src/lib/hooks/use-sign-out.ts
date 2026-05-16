import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthSignOut } from '@/api/queries/use-auth'
import { useAuthStore } from '@/lib/stores/authStore'

export function useSignOut() {
  const navigate = useNavigate()
  const clearLocalSession = useAuthStore((s) => s.clearLocalSession)
  const { mutateAsync } = useAuthSignOut()

  return useCallback(async () => {
    try {
      await mutateAsync()
    } catch {
      /* still clear local session if the API fails */
    }
    clearLocalSession()
    toast.success('Signed out')
    navigate('/auth', { replace: true })
  }, [navigate, clearLocalSession, mutateAsync])
}
