import type { PatchMeBody } from '@/api/types/me.types'

export function creatorDisplayNameDraftFromUser(name?: string | null): string {
  return name?.trim() ?? ''
}

export function isCreatorDisplayNameUnchanged(
  currentName: string | undefined | null,
  nextName: string
): boolean {
  return nextName.trim() === creatorDisplayNameDraftFromUser(currentName)
}

export function buildPatchMeDisplayNameBody(name: string): PatchMeBody {
  return { name: name.trim() }
}
