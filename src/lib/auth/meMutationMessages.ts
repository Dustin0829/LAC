import type { Platform } from '@/api/types/shared'
import { PLATFORM_LABEL } from '@/lib/platforms/labels'

export function mePlatformDisconnectedMessage(platform: Platform) {
  return `${PLATFORM_LABEL[platform]} disconnected.`
}

export function mePlatformDisconnectErrorMessage() {
  return 'Could not disconnect platform.'
}
