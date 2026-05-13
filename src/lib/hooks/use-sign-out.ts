import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'

export function useSignOut() {
  const navigate = useNavigate()
  const signOut = useAuthStore((s) => s.signOut)

  return useCallback(() => {
    signOut()
    toast.success('Signed out')
    navigate('/auth', { replace: true })
  }, [navigate, signOut])
}
