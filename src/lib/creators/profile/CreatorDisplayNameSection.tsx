import { useEffect, useState } from 'react'
import { Check, Loader2, PencilLine, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  creatorDisplayNameFormErrorMessage,
  parseCreatorDisplayNameForm,
} from '@/api/schema/me.schema'
import { usePatchMe } from '@/api/queries/use-me'
import {
  buildPatchMeDisplayNameBody,
  creatorDisplayNameDraftFromUser,
  isCreatorDisplayNameUnchanged,
} from '@/lib/creators/profile/creatorDisplayNameForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type CreatorDisplayNameSectionProps = {
  name?: string | null
  email?: string | null
}

export function CreatorDisplayNameSection({ name, email }: CreatorDisplayNameSectionProps) {
  const { mutate: patchMe, isPending: saving } = usePatchMe()
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(() => creatorDisplayNameDraftFromUser(name))
  const [nameError, setNameError] = useState<string | undefined>()

  useEffect(() => {
    if (!editing) {
      setDraftName(creatorDisplayNameDraftFromUser(name))
      setNameError(undefined)
    }
  }, [name, editing])

  function beginEdit() {
    setDraftName(creatorDisplayNameDraftFromUser(name))
    setNameError(undefined)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setDraftName(creatorDisplayNameDraftFromUser(name))
    setNameError(undefined)
  }

  function saveName(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseCreatorDisplayNameForm(draftName)
    if (!parsed.success) {
      const message = creatorDisplayNameFormErrorMessage(parsed.error)
      setNameError(message)
      toast.error(message)
      return
    }
    setNameError(undefined)
    if (isCreatorDisplayNameUnchanged(name, parsed.data)) {
      setEditing(false)
      return
    }
    patchMe(buildPatchMeDisplayNameBody(parsed.data), {
      onSuccess: () => setEditing(false),
    })
  }

  const displayTitle = creatorDisplayNameDraftFromUser(name) || 'Your name'

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {editing ? (
        <form onSubmit={saveName} className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-display-name">Display name</Label>
            <Input
              id="account-display-name"
              value={draftName}
              onChange={(e) => {
                setDraftName(e.target.value)
                if (nameError) setNameError(undefined)
              }}
              autoComplete="name"
              className="max-w-md"
              placeholder="Your name"
              aria-invalid={nameError ? true : undefined}
              disabled={saving}
            />
            {nameError ? (
              <p className="text-sm text-destructive" role="alert">
                {nameError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              size="sm"
              className="gap-1.5 bg-phc-gradient text-white"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Check className="h-4 w-4" aria-hidden />
              )}
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={cancelEdit}
              disabled={saving}
            >
              <X className="h-4 w-4" aria-hidden />
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="font-display text-2xl font-bold">{displayTitle}</h2>
          {email ? <p className="text-sm text-muted-foreground">{email}</p> : null}
        </div>
      )}
      {!editing ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={beginEdit}
        >
          <PencilLine className="h-4 w-4" aria-hidden />
          Edit Name
        </Button>
      ) : null}
    </div>
  )
}
