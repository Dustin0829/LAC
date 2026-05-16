import { create } from 'zustand'
import { mockCampaigns, type Campaign } from '@/lib/mockData'

interface CampaignsState {
  campaigns: Campaign[]
  loading: boolean
  error: string | null
  loadForBrand: (user: { id: string; name?: string | null; email?: string | null }) => Promise<void>
  loadForCreator: () => Promise<void>
  addCampaign: (campaign: Campaign) => void
  updateCampaign: (id: string, patch: Partial<Campaign>) => void
}

export const useCampaignsStore = create<CampaignsState>((set) => ({
  campaigns: mockCampaigns,
  loading: false,
  error: null,
  loadForBrand: async (_user) => {
    set({ loading: true, error: null })
    try {
      await new Promise((r) => setTimeout(r, 200))
      set({ campaigns: mockCampaigns, loading: false })
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load campaigns',
        campaigns: mockCampaigns,
      })
    }
  },
  loadForCreator: async () => {
    set({ loading: true, error: null })
    try {
      await new Promise((r) => setTimeout(r, 200))
      set({ campaigns: mockCampaigns, loading: false })
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load campaigns',
        campaigns: mockCampaigns,
      })
    }
  },
  addCampaign: (campaign) => set((s) => ({ campaigns: [campaign, ...s.campaigns] })),
  updateCampaign: (id, patch) =>
    set((s) => ({
      campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
}))
