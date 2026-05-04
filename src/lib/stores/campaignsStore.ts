import { create } from 'zustand'
import { mockCampaigns, type Campaign } from '@/lib/mockData'

interface CampaignsState {
  campaigns: Campaign[]
  addCampaign: (campaign: Campaign) => void
  updateCampaign: (id: string, patch: Partial<Campaign>) => void
}

export const useCampaignsStore = create<CampaignsState>((set) => ({
  campaigns: mockCampaigns,
  addCampaign: (campaign) => set((s) => ({ campaigns: [campaign, ...s.campaigns] })),
  updateCampaign: (id, patch) =>
    set((s) => ({
      campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
}))
