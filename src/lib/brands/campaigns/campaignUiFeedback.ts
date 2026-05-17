import { toast } from 'sonner'
import {
  brandCampaignCheckoutLinkCopiedMessage,
  brandCampaignCheckoutLinkCopyFailedMessage,
} from '@/lib/brands/campaigns/campaignMutationMessages'

/** Same-tab redirect to Xendit; success/failure return via backend redirect URLs. */
export function redirectToBrandCampaignCheckout(url: string): void {
  window.location.assign(url)
}

export async function copyBrandCampaignCheckoutLink(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url)
    toast.success(brandCampaignCheckoutLinkCopiedMessage())
  } catch {
    toast.error(brandCampaignCheckoutLinkCopyFailedMessage())
  }
}
