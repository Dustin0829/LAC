import { create } from 'zustand'
import { mockCreatorPlatformLinks, type CreatorPlatformLink, type Platform } from '@/lib/mockData'

const DEMO_HANDLE: Record<Platform, string> = {
  tiktok: '@demo.creator',
  facebook: 'facebook.com/demo.creator',
}

interface CreatorProfileState {
  platformLinks: CreatorPlatformLink[]
  connectPlatform: (platform: Platform) => void
  reconnectPlatform: (platform: Platform) => void
  disconnectPlatform: (platform: Platform) => void
}

export const useCreatorProfileStore = create<CreatorProfileState>((set) => ({
  platformLinks: mockCreatorPlatformLinks,
  connectPlatform: (platform) =>
    set((state) => ({
      platformLinks: state.platformLinks.map((link) =>
        link.platform === platform
          ? {
              ...link,
              status: 'connected',
              handle: DEMO_HANDLE[platform],
              connectedAt: new Date().toISOString(),
            }
          : link
      ),
    })),
  reconnectPlatform: (platform) =>
    set((state) => ({
      platformLinks: state.platformLinks.map((link) =>
        link.platform === platform
          ? {
              ...link,
              status: 'connected',
              handle: DEMO_HANDLE[platform],
              connectedAt: new Date().toISOString(),
            }
          : link
      ),
    })),
  disconnectPlatform: (platform) =>
    set((state) => ({
      platformLinks: state.platformLinks.map((link) =>
        link.platform === platform
          ? {
              ...link,
              status: 'reconnect',
              handle: 'Not connected',
              connectedAt: undefined,
            }
          : link
      ),
    })),
}))
