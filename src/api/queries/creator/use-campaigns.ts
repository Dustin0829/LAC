import { useQuery } from '@tanstack/react-query'
import { getCampaigns } from '@/api/services/campaigns'
import type { ListCampaignsParams } from '@/api/types/campaigns.types'
import { creatorCampaignCardFromApi } from '@/lib/creators/campaigns/creatorCampaignCards'

export const creatorCampaignsQueryKeys = {
  all: ['campaigns', 'discover'] as const,
  list: (params: ListCampaignsParams) => [...creatorCampaignsQueryKeys.all, 'list', params] as const,
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
