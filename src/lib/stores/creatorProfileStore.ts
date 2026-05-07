import { create } from 'zustand'
import { mockCreatorPlatformLinks, type CreatorPlatformLink, type Platform } from '@/lib/mockData'

interface CreatorProfileState {
  platformLinks: CreatorPlatformLink[]
  connectPlatform: (platform: Platform) => void
  reconnectPlatform: (platform: Platform) => void
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
              connectedAt: new Date().toISOString(),
            }
          : link
      ),
    })),
}))
