import { Loader2, Pause, Play, Plus, Target } from 'lucide-react'
import { campaignStatusLabel } from '@/lib/campaigns/status'
import type { Campaign } from '@/lib/campaigns/types'
import { cn, formatNumber, formatPHP } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RefreshButton } from '@/components/RefreshButton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IntegerInput } from '@/components/ui/integer-input'
import { Label } from '@/components/ui/label'
import { MIN_PUBLISH_PHP } from '@/lib/constants'

export type CampaignDetailHeaderProps = {
  campaign: Campaign
  statusUi: { chip: string; dot: string }
  remaining: number
  platformFeePercent: number
  addFundsGross: number
  addFundsBreakdownPlatformFee: number
  addFundsBreakdownNetPool: number
  addFundsBrandRate: number
  addFundsCpv: number
  addFundsReach: number
  fundPublishGross: string
  setFundPublishGross: (value: string) => void
  fundPublishGrossAmount: number
  fundPublishPlatformFee: number
  fundPublishPayoutPool: number
  fundPublishBrandRate: number
  fundPublishCpv: number
  fundPublishReach: number
  addFundsOpen: boolean
  setAddFundsOpen: (open: boolean) => void
  isAddingFunds: boolean
  fundAmount: string
  setFundAmount: (value: string) => void
  handleAddFunds: (e: React.FormEvent) => void
  fundPublishOpen: boolean
  setFundPublishOpen: (open: boolean) => void
  isFundingPublish: boolean
  setIsFundingPublish: (value: boolean) => void
  handleFundPublishSubmit: (e: React.FormEvent) => void | Promise<void>
  togglePause: () => void
  isPatchingCampaign: boolean
  openFundAndPublishDialog: () => void
  countedViewsForReach: number
  reachGoal: number
  reachProgressPct: number
  headerRefreshing: boolean
  apiCampaignFetching: boolean
  refetchApiCampaign: () => unknown
  refetchSubmissions: () => unknown
  setHeaderRefreshing: (value: boolean) => void
}

export function CampaignDetailHeader(props: CampaignDetailHeaderProps) {
  const {
    campaign,
    statusUi,
    remaining,
    platformFeePercent,
    addFundsGross,
    addFundsBreakdownPlatformFee,
    addFundsBreakdownNetPool,
    addFundsBrandRate,
    addFundsCpv,
    addFundsReach,
    fundPublishGross,
    setFundPublishGross,
    fundPublishGrossAmount,
    fundPublishPlatformFee,
    fundPublishPayoutPool,
    fundPublishBrandRate,
    fundPublishCpv,
    fundPublishReach,
    addFundsOpen,
    setAddFundsOpen,
    isAddingFunds,
    fundAmount,
    setFundAmount,
    handleAddFunds,
    fundPublishOpen,
    setFundPublishOpen,
    isFundingPublish,
    setIsFundingPublish,
    handleFundPublishSubmit,
    togglePause,
    isPatchingCampaign,
    openFundAndPublishDialog,
    countedViewsForReach,
    reachGoal,
    reachProgressPct,
    headerRefreshing,
    apiCampaignFetching,
    refetchApiCampaign,
    refetchSubmissions,
    setHeaderRefreshing,
  } = props

  return (
    <>
      <div className="min-w-0 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex min-w-0 flex-col gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize',
                statusUi.chip
              )}
            >
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusUi.dot)} aria-hidden />
              {campaignStatusLabel(campaign.status)}
            </div>
            <h1 className="min-w-0 wrap-break-word font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {campaign.title}
            </h1>
            {/* <p className="max-w-full min-w-0 wrap-break-word text-sm leading-relaxed text-muted-foreground md:text-base">
              {campaign.description}
            </p> */}
          </div>
          <div className="shrink-0 lg:pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {campaign.status === 'draft' ? (
                <Button
                  className="bg-phc-gradient font-semibold text-white hover:opacity-90"
                  onClick={openFundAndPublishDialog}
                >
                  <Play className="h-4 w-4" /> Fund &amp; Publish
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="border font-semibold"
                    disabled={isPatchingCampaign}
                    onClick={togglePause}
                  >
                    {isPatchingCampaign ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Updating…
                      </>
                    ) : campaign.status === 'paused' ? (
                      <>
                        <Play className="h-4 w-4" /> Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4" /> Pause
                      </>
                    )}
                  </Button>
                  <Button
                    className="bg-phc-gradient font-semibold text-white hover:opacity-90"
                    onClick={() => setAddFundsOpen(true)}
                  >
                    <Plus className="h-4 w-4" /> Add funds
                  </Button>
                </>
              )}
            </div>
            <Dialog
              open={addFundsOpen}
              onOpenChange={(open) => {
                if (!open && isAddingFunds) return
                setAddFundsOpen(open)
              }}
            >
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add funds to campaign</DialogTitle>
                  <DialogDescription>
                    Funds will be added after payment confirmation. Confirming attempts to open
                    Xendit checkout in a new tab, then simulates confirmation for a few seconds
                    before updating your balance.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddFunds} className="space-y-4">
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Current campaign balance</p>
                    <p className="mt-1 font-display text-2xl font-bold">
                      {formatPHP(remaining, { decimals: false })}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fund-amount">Amount to add</Label>
                    <IntegerInput
                      id="fund-amount"
                      pesoPrefix
                      placeholder={(10_000).toLocaleString('en-PH')}
                      value={fundAmount}
                      onValueChange={setFundAmount}
                    />
                  </div>

                  <div className="rounded-3xl border border-border bg-card p-4 space-y-3">
                    <div className="rounded-xl bg-phc-gradient-soft p-4">
                      <p className="text-xs text-muted-foreground">Estimated reach to add</p>
                      <p className="font-display text-3xl font-extrabold text-phc-gradient">
                        {addFundsReach.toLocaleString('en-PH')}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        views, based on the post-fee payout pool
                      </p>
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Brand rate</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(addFundsBrandRate, { decimals: false })} / 1,000 Views
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Total budget</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(addFundsGross, { decimals: false })}
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Platform fee</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(addFundsBreakdownPlatformFee, { decimals: false })} (
                          {Math.round(platformFeePercent * 100)}%)
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Payout pool</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(addFundsBreakdownNetPool, { decimals: false })}
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Cost / view</span>
                        <span className="shrink-0 font-semibold">₱{addFundsCpv.toFixed(3)}</span>
                      </li>
                    </ul>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddFundsOpen(false)}
                      disabled={isAddingFunds}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-phc-gradient text-white hover:opacity-90"
                      disabled={isAddingFunds}
                    >
                      {isAddingFunds ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Confirming payment…
                        </>
                      ) : (
                        'Confirm'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={fundPublishOpen}
              onOpenChange={(open) => {
                setFundPublishOpen(open)
                if (!open) setIsFundingPublish(false)
              }}
            >
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Fund &amp; publish</DialogTitle>
                </DialogHeader>

                <form onSubmit={(e) => void handleFundPublishSubmit(e)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fund-publish-budget">Total budget</Label>
                    <IntegerInput
                      id="fund-publish-budget"
                      pesoPrefix
                      min={MIN_PUBLISH_PHP}
                      placeholder={MIN_PUBLISH_PHP.toLocaleString('en-PH')}
                      value={fundPublishGross}
                      onValueChange={setFundPublishGross}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum ₱{MIN_PUBLISH_PHP.toLocaleString('en-PH')} to publish
                    </p>
                  </div>

                  <div className="rounded-3xl border border-border bg-card p-4 space-y-3">
                    <div className="rounded-xl bg-phc-gradient-soft p-4">
                      <p className="text-xs text-muted-foreground">Estimated reach</p>
                      <p className="font-display text-3xl font-extrabold text-phc-gradient">
                        {fundPublishReach.toLocaleString('en-PH')}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        views, based on the post-fee payout pool
                      </p>
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Brand rate</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(fundPublishBrandRate, { decimals: false })} / 1,000 Views
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Total budget</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(fundPublishGrossAmount, { decimals: false })}
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Platform fee</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(fundPublishPlatformFee, { decimals: false })} (
                          {Math.round(platformFeePercent * 100)}%)
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Payout pool</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(fundPublishPayoutPool, { decimals: false })}
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Cost / view</span>
                        <span className="shrink-0 font-semibold">₱{fundPublishCpv.toFixed(3)}</span>
                      </li>
                    </ul>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFundPublishOpen(false)}
                      disabled={isFundingPublish}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-phc-gradient text-white hover:opacity-90"
                      disabled={isFundingPublish}
                    >
                      {isFundingPublish ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Processing
                        </>
                      ) : (
                        'Pay & publish'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Estimated reach */}
      <div className="w-full rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Target className="h-3.5 w-3.5 shrink-0" />
            Goal Progress
          </p>
          <RefreshButton
            variant="outline"
            size="icon"
            isRefreshing={headerRefreshing || apiCampaignFetching}
            onRefresh={async () => {
              setHeaderRefreshing(true)
              try {
                await Promise.all([refetchApiCampaign(), refetchSubmissions()])
              } finally {
                setHeaderRefreshing(false)
              }
            }}
            successMessage="Campaign updated"
            aria-label="Refresh campaign"
          />
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="font-display text-lg md:text-xl font-bold tabular-nums text-foreground md:text-3xl">
            {reachGoal > 0 ? `${reachProgressPct.toFixed(1)}%` : '—'}
          </p>
          <p className="text-sm font-semibold tabular-nums text-primary sm:text-right">
            {reachGoal > 0 ? (
              <>
                {formatNumber(Math.round(countedViewsForReach))} / {formatNumber(reachGoal)} views
              </>
            ) : (
              <>
                {formatNumber(Math.round(countedViewsForReach))} views
                <span className="block text-xs font-medium text-muted-foreground">
                  No reach goal set
                </span>
              </>
            )}
          </p>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${reachProgressPct}%` }}
          />
        </div>
      </div>
    </>
  )
}
