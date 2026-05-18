import { useState } from 'react'
import { BadgeCheck, Loader2, Plug, Unplug } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteMePlatform } from '@/api/queries/use-me'
import { PlatformIcon } from '@/components/PlatformIcon'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { isCreatorPlatformConnectEnabled } from '@/lib/constants'
import { startFacebookOAuth } from '@/lib/auth/startFacebookOAuth'
import { startFacebookPageOAuth } from '@/lib/auth/startFacebookPageOAuth'
import { startTikTokOAuth } from '@/lib/auth/startTikTokOAuth'
import type { Platform } from '@/api/types/shared'
import { PLATFORM_LABEL } from '@/lib/platforms/labels'
import type { MetaLinkedPage } from '@/lib/campaigns/types'
import { useCreatorProfileStore } from '@/lib/stores/creatorProfileStore'
import { cn } from '@/lib/utils'

function PlatformLinkHandle({
  platform,
  handle,
  linkedPages,
  inactive,
}: {
  platform: Platform
  handle: string
  linkedPages?: MetaLinkedPage[]
  inactive?: boolean
}) {
  if (inactive) {
    return <p className="mt-0.5 text-xs text-muted-foreground">Coming soon</p>
  }

  const showPagesTooltip =
    platform === 'facebook' && linkedPages != null && linkedPages.length > 1

  if (!showPagesTooltip) {
    return (
      <p className="mt-0.5 break-all text-xs text-muted-foreground sm:truncate sm:break-normal">
        {handle}
      </p>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <p
          tabIndex={0}
          className="mt-0.5 cursor-help break-all text-xs text-muted-foreground underline decoration-dotted underline-offset-2 sm:truncate sm:break-normal"
        >
          {handle}
        </p>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="max-w-[16rem]">
        <p className="mb-1.5 font-medium text-popover-foreground">Connected Pages</p>
        <ul className="space-y-0.5">
          {linkedPages.map((page) => (
            <li key={page.id}>{page.name}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}

type ConnectedPlatformsSectionProps = {
  /** When true, omit outer card section (e.g. inside onboarding wizard). */
  embedded?: boolean
  /** Show disconnect control on connected platforms (account page). */
  allowDisconnect?: boolean
  /** `GET /me/platforms` in flight (account page). */
  loading?: boolean
  /** Failed to load platform links from the API. */
  loadError?: boolean
  className?: string
}

export function ConnectedPlatformsSection({
  embedded = false,
  allowDisconnect = true,
  loading = false,
  loadError = false,
  className,
}: ConnectedPlatformsSectionProps) {
  const platformLinks = useCreatorProfileStore((s) => s.platformLinks)
  const deletePlatform = useDeleteMePlatform()
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null)

  async function handleConnect(platform: Platform) {
    if (!isCreatorPlatformConnectEnabled(platform)) {
      toast.info(`${PLATFORM_LABEL[platform]} connect is not available yet.`)
      return
    }

    setConnectingPlatform(platform)
    const link = platformLinks.find((l) => l.platform === platform)
    try {
      if (platform === 'tiktok') {
        await startTikTokOAuth()
      } else if (link?.status === 'pending_page') {
        await startFacebookPageOAuth()
      } else {
        await startFacebookOAuth()
      }
    } catch {
      setConnectingPlatform(null)
    }
  }

  function handleDisconnect(platform: Platform) {
    deletePlatform.mutate(platform)
  }

  const disconnectingPlatform =
    deletePlatform.isPending && deletePlatform.variables ? deletePlatform.variables : null

  const content = (
    <>
      <div className="mb-5">
        <h2 className="font-display text-xl font-bold">Connected platforms</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect TikTok and Facebook once; we reuse them when you submit campaign content. For
          Facebook, you must grant access to the Page where you post Reels (not only your profile).
        </p>
      </div>
      {loadError ? (
        <p className="mb-3 text-sm text-destructive">
          Could not load connected platforms. Refresh the page to try again.
        </p>
      ) : null}
      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        {platformLinks.map((link) => {
          const connectEnabled = isCreatorPlatformConnectEnabled(link.platform)
          const pendingPage = link.status === 'pending_page'
          const isConnecting = connectingPlatform === link.platform
          const isDisconnecting = disconnectingPlatform === link.platform
          const actionsDisabled = loading || loadError

          return (
            <div
              key={link.platform}
              className={cn(
                'flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 p-4',
                !connectEnabled && link.status !== 'connected' && 'opacity-80'
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <PlatformIcon platform={link.platform} className="h-8 w-8 shrink-0 md:h-9 md:w-9" />
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">{link.label}</p>
                  <PlatformLinkHandle
                    platform={link.platform}
                    handle={link.handle}
                    linkedPages={link.linkedPages}
                    inactive={!connectEnabled && link.status !== 'connected'}
                  />
                </div>
              </div>
              <div className="shrink-0">
                {!connectEnabled ? (
                  link.status === 'connected' ? (
                    <span className="inline-flex min-h-9 items-center rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-700">
                      <BadgeCheck className="mr-1 h-3 w-3 shrink-0" aria-hidden />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex min-h-9 cursor-not-allowed items-center rounded-xl border border-border bg-muted px-2.5 text-xs font-medium text-muted-foreground">
                      Coming soon
                    </span>
                  )
                ) : loading ? (
                  <span className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-border bg-muted px-2.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    Loading…
                  </span>
                ) : pendingPage ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="whitespace-nowrap border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                    disabled={isConnecting || actionsDisabled}
                    onClick={() => void handleConnect(link.platform)}
                  >
                    {isConnecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Plug className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {isConnecting ? 'Connecting…' : 'Finish setup'}
                  </Button>
                ) : link.status === 'connected' && allowDisconnect ? (
                  <button
                    type="button"
                    disabled={isDisconnecting || actionsDisabled}
                    onClick={() => handleDisconnect(link.platform)}
                    className={cn(
                      'group relative min-h-9 overflow-hidden rounded-xl border px-1 text-xs font-medium transition-colors md:px-2',
                      'border-emerald-200 bg-emerald-50 text-emerald-700',
                      'hover:border-red-200 hover:bg-red-50 hover:text-red-800',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      'disabled:pointer-events-none disabled:opacity-60'
                    )}
                    aria-label={`${PLATFORM_LABEL[link.platform]}, connected. Click to disconnect.`}
                  >
                    {isDisconnecting ? (
                      <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                        Disconnecting…
                      </span>
                    ) : (
                      <>
                        <span
                          className={cn(
                            'inline-flex w-full cursor-pointer items-center justify-center gap-1 px-1.5 py-1.5 md:px-2.5',
                            'group-hover:pointer-events-none group-hover:invisible group-hover:opacity-0'
                          )}
                        >
                          <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden />
                          Connected
                        </span>
                        <span
                          className={cn(
                            'invisible absolute inset-0 flex cursor-pointer items-center justify-center gap-1 px-2.5 py-1.5 opacity-0',
                            'group-hover:visible group-hover:opacity-100'
                          )}
                          aria-hidden
                        >
                          <Unplug className="h-3 w-3 shrink-0" aria-hidden />
                          Disconnect
                        </span>
                      </>
                    )}
                  </button>
                ) : link.status === 'connected' ? (
                  <span className="inline-flex min-h-9 items-center rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-700">
                    <BadgeCheck className="mr-1 h-3 w-3 shrink-0" aria-hidden />
                    Connected
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="whitespace-nowrap"
                    disabled={isConnecting || actionsDisabled}
                    onClick={() => void handleConnect(link.platform)}
                  >
                    {isConnecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Plug className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {isConnecting ? 'Connecting…' : 'Connect'}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )

  if (embedded) {
    return <div className={cn(className)}>{content}</div>
  }

  return (
    <section className={cn('rounded-3xl border border-border bg-card p-6 md:p-8', className)}>
      {content}
    </section>
  )
}
