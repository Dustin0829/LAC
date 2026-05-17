import { create } from 'zustand'
import { isCreatorPlatformConnectEnabled } from '@/lib/constants'
import type { Platform } from '@/api/types/shared'
import type { CreatorPlatformLink } from '@/lib/campaigns/types'
import { mockCreatorPlatformLinks } from '@/lib/mockData'

const DEMO_HANDLE: Record<Platform, string> = {
  tiktok: '@demo.creator',
  facebook: 'facebook.com/demo.creator',
}

interface CreatorProfileState {
  platformLinks: CreatorPlatformLink[]
  setPlatformLinks: (links: CreatorPlatformLink[]) => void
  connectPlatform: (platform: Platform) => void
  reconnectPlatform: (platform: Platform) => void
  disconnectPlatform: (platform: Platform) => void
}

export const useCreatorProfileStore = create<CreatorProfileState>((set) => ({
  platformLinks: mockCreatorPlatformLinks,
  setPlatformLinks: (links) => set({ platformLinks: links }),
  connectPlatform: (platform) => {
    if (!isCreatorPlatformConnectEnabled(platform)) return
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
    }))
  },
  reconnectPlatform: (platform) => {
    if (!isCreatorPlatformConnectEnabled(platform)) return
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
    }))
  },
  disconnectPlatform: (platform) => {
    if (!isCreatorPlatformConnectEnabled(platform)) return
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
    }))
  },
}))
