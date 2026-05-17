import type { Platform } from '@/api/types/shared'
import { PLATFORM_LABEL } from '@/lib/platforms/labels'

export function mePlatformDisconnectedMessage(platform: Platform) {
  return `${PLATFORM_LABEL[platform]} disconnected.`
}

export function mePlatformDisconnectErrorMessage() {
  return 'Could not disconnect platform.'
}

export function meNameUpdatedMessage() {
  return 'Name updated.'
}

export function meNameUpdateErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Could not update your name.'
}
