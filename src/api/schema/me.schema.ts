import { z } from 'zod'

/** Matches backend `patchMeBodySchema` — `User.name` (display name). */
export const creatorDisplayNameFormSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required')
  .max(200, 'Display name must be 200 characters or less')

export type CreatorDisplayNameFormValues = z.infer<typeof creatorDisplayNameFormSchema>

export function parseCreatorDisplayNameForm(value: string) {
  return creatorDisplayNameFormSchema.safeParse(value)
}

export function creatorDisplayNameFormErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Display name is invalid.'
}
