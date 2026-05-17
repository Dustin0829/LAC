import { useQuery } from '@tanstack/react-query'
import { getCampaign, getCampaigns } from '@/api/services/campaigns'
import type { ListCampaignsParams } from '@/api/types/campaigns.types'
import {
  creatorCampaignCardFromApi,
  creatorCampaignDetailFromApi,
} from '@/lib/creators/campaigns/creatorCampaignCards'

export const creatorCampaignsQueryKeys = {
  all: ['campaigns', 'discover'] as const,
  list: (params: ListCampaignsParams) => [...creatorCampaignsQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...creatorCampaignsQueryKeys.all, 'detail', id] as const,
}

/** Public discover list (`GET /campaigns`) for creator explore. */
export function useCreatorCampaigns(params: ListCampaignsParams) {
  return useQuery({
    queryKey: creatorCampaignsQueryKeys.list(params),
    queryFn: async () => {
      const { items } = await getCampaigns(params)
      return items.map(creatorCampaignCardFromApi)
    },
  })
}

/** Public discover detail (`GET /campaigns/:id`) for creator campaign detail. */
export function useCreatorCampaign(campaignId: string) {
  return useQuery({
    queryKey: creatorCampaignsQueryKeys.detail(campaignId),
    queryFn: async () => {
      const { campaign } = await getCampaign(campaignId)
      return creatorCampaignDetailFromApi(campaign)
    },
    enabled: Boolean(campaignId),
  })
}
