import { create } from 'zustand'
import { mockClips, type Clip } from '@/lib/mockData'

interface ClipsState {
  clips: Clip[]
  addClip: (clip: Clip) => void
  updateClip: (id: string, patch: Partial<Clip>) => void
}

export const useClipsStore = create<ClipsState>((set) => ({
  clips: mockClips,
  addClip: (clip) => set((s) => ({ clips: [clip, ...s.clips] })),
  updateClip: (id, patch) =>
    set((s) => ({
      clips: s.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
}))
