import { useQuery } from '@tanstack/react-query'
import { getBrandCampaigns } from '@/api/services/brands/campaigns'
import { useBrandAuthEnabled } from '@/api/queries/brands/auth'
import { brandCampaignCardFromApi } from '@/lib/brandCampaigns/campaignCards'
import { useAuthStore } from '@/lib/stores/authStore'

export const brandCampaignsQueryKeys = {
  all: ['brands', 'campaigns'] as const,
  list: () => [...brandCampaignsQueryKeys.all, 'list'] as const,
}

/** Brand campaigns list (`GET /brands/campaigns`). */
export function useBrandCampaigns() {
  const enabled = useBrandAuthEnabled()
  const brandUserId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: brandCampaignsQueryKeys.list(),
    queryFn: async () => {
      const { items } = await getBrandCampaigns()
      const userId = brandUserId ?? ''
      return items.map((dto) => brandCampaignCardFromApi(dto, userId))
    },
    enabled: enabled && Boolean(brandUserId),
  })
}
