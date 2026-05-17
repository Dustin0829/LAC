import { create } from 'zustand'
import { mockContent, type Content } from '@/lib/mockData'

interface ContentState {
  contents: Content[]
  addContent: (content: Content) => void
  updateContent: (id: string, patch: Partial<Content>) => void
}

export const useContentStore = create<ContentState>((set) => ({
  contents: [...mockContent],
  addContent: (content) => set((s) => ({ contents: [content, ...s.contents] })),
  updateContent: (id, patch) =>
    set((s) => ({
      contents: s.contents.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
}))
