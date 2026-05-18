import { mockCreatorPlatformLinks } from '@/lib/mockData'
import { useBrandProfileStore } from '@/lib/stores/brandProfileStore'
import { useCreatorProfileStore } from '@/lib/stores/creatorProfileStore'

const BRAND_STORAGE_KEY = 'vidu.brandProfile'

/** Clears client-side draft state when the user changes role during onboarding. */
export function resetOnboardingDraftStores() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(BRAND_STORAGE_KEY)
  }
  useBrandProfileStore.setState({
    profile: {
      brandName: '',
      logoDataUrl: null,
      website: '',
      instagram: '',
      facebook: '',
      tiktok: '',
    },
  })
  useCreatorProfileStore.setState({ platformLinks: mockCreatorPlatformLinks })
}
