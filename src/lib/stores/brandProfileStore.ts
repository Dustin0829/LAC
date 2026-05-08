import { create } from 'zustand'

const STORAGE_KEY = 'arpify.brandProfile'

export type BrandProfile = {
  brandName: string
  logoDataUrl: string | null
  website: string
  instagram: string
  facebook: string
  tiktok: string
}

function emptyProfile(): BrandProfile {
  return {
    brandName: '',
    logoDataUrl: null,
    website: '',
    instagram: '',
    facebook: '',
    tiktok: '',
  }
}

function readStored(): BrandProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<BrandProfile>
    return {
      brandName: typeof p.brandName === 'string' ? p.brandName : '',
      logoDataUrl: typeof p.logoDataUrl === 'string' ? p.logoDataUrl : null,
      website: typeof p.website === 'string' ? p.website : '',
      instagram: typeof p.instagram === 'string' ? p.instagram : '',
      facebook: typeof p.facebook === 'string' ? p.facebook : '',
      tiktok: typeof p.tiktok === 'string' ? p.tiktok : '',
    }
  } catch {
    return null
  }
}

interface BrandProfileState {
  profile: BrandProfile
  setProfile: (partial: Partial<BrandProfile>) => void
  persistProfile: () => void
  /** When nothing is saved yet, pre-fill brand name from the signed-in account label. */
  seedBrandNameIfEmpty: (name: string) => void
}

export const useBrandProfileStore = create<BrandProfileState>((set, get) => ({
  profile: readStored() ?? emptyProfile(),
  setProfile: (partial) => set((s) => ({ profile: { ...s.profile, ...partial } })),
  persistProfile: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().profile))
    }
  },
  seedBrandNameIfEmpty: (name) =>
    set((s) => {
      if (readStored() || s.profile.brandName.trim()) return s
      return { profile: { ...s.profile, brandName: name } }
    }),
}))
