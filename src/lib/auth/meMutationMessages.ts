import { PLATFORM_LABEL, type Platform } from '@/lib/mockData'

export function mePlatformDisconnectedMessage(platform: Platform) {
  return `${PLATFORM_LABEL[platform]} disconnected.`
}

export function mePlatformDisconnectErrorMessage() {
  return 'Could not disconnect platform.'
}
