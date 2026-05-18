import { Loader2, RotateCcw, Send } from 'lucide-react'
import type { BrandSubmissionRow } from '@/api/types/brands/submissions.types'
import type { Campaign } from '@/lib/campaigns/types'
import { cn, formatPHP, formatViews } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ContentStatusBadge } from '@/components/ContentStatusBadge'
import { PersonAvatar } from '@/components/PersonAvatar'
import { PlatformCell } from '@/components/PlatformIcon'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  BRAND_REJECT_OUTLINE_BTN_CLASS,
  BRAND_REJECT_PRESETS,
  BRAND_REJECTED_ROW_CLASS,
  BRAND_REJECTED_STRIKETHROUGH_CLASS,
  type BrandRejectPresetId,
  type BrandRejectTarget,
} from '@/lib/brands/campaigns/campaignDetailUi'

export type SubmissionsTabProps = {
  campaign: Campaign
  submissionsLoading: boolean
  campaignSubmissions: BrandSubmissionRow[]
  pendingPayoutSubmissions: BrandSubmissionRow[]
  pendingPayoutTotal: number
  isReleasingPayout: boolean
  releasePayoutOpen: boolean
  setReleasePayoutOpen: (open: boolean) => void
  openReleasePayoutDialog: () => void
  confirmReleasePayouts: () => void
  /** False while Xendit split to brand sub-account is pending. */
  payoutPoolSettled: boolean
  /** Shown on disabled release button while settlement is pending. */
  payoutSettlingMessage?: string
  rejectTarget: BrandRejectTarget | null
  rejectPreset: BrandRejectPresetId
  setRejectPreset: (id: BrandRejectPresetId) => void
  rejectOtherDetail: string
  setRejectOtherDetail: (value: string) => void
  openRejectForSubmission: (submissionId: string, creatorName: string) => void
  resetRejectDialog: () => void
  confirmBrandReject: () => void
  isRejectingSubmission: boolean
  restoreRejectedSubmission: (submissionId: string) => void
  isRestoringSubmission: boolean
}

export function SubmissionsTab(props: SubmissionsTabProps) {
  const {
    campaign,
    submissionsLoading,
    campaignSubmissions,
    pendingPayoutSubmissions,
    pendingPayoutTotal,
    isReleasingPayout,
    releasePayoutOpen,
    setReleasePayoutOpen,
    openReleasePayoutDialog,
    confirmReleasePayouts,
    payoutPoolSettled,
    payoutSettlingMessage,
    rejectTarget,
    rejectPreset,
    setRejectPreset,
    rejectOtherDetail,
    setRejectOtherDetail,
    openRejectForSubmission,
    resetRejectDialog,
    confirmBrandReject,
    isRejectingSubmission,
    restoreRejectedSubmission,
    isRestoringSubmission,
  } = props

  return (
    <>
<div
  className="space-y-4"
  role="tabpanel"
  aria-labelledby="campaign-tab-submissions-payout"
>
  {submissionsLoading ? (
    <div className="rounded-3xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
      Loading submissions…
    </div>
  ) : campaignSubmissions.length === 0 ? (
    <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
      <p className="font-medium">No submissions yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Creator posts for this campaign will show here once creators start submitting.
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      {pendingPayoutSubmissions.length > 0 && campaign.status !== 'draft' ? (
        <div className="flex justify-end">
          {payoutSettlingMessage && !payoutPoolSettled ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-not-allowed">
                  <Button
                    type="button"
                    className="pointer-events-none bg-phc-gradient font-semibold text-white hover:opacity-90"
                    disabled
                  >
                    <Send className="h-4 w-4" /> Release payout
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm leading-relaxed">{payoutSettlingMessage}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              type="button"
              className="bg-phc-gradient font-semibold text-white hover:opacity-90"
              disabled={!payoutPoolSettled}
              onClick={openReleasePayoutDialog}
            >
              <Send className="h-4 w-4" /> Release payout
            </Button>
          )}
        </div>
      ) : null}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
              <TableHead>Creator</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Payout</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaignSubmissions.map((row) => {
              const canReject = row.status === 'pending' || row.status === 'payout_failed'
              const isRejected = row.status === 'rejected'
              const strikethrough = isRejected ? BRAND_REJECTED_STRIKETHROUGH_CLASS : undefined
              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    'border-border',
                    row.url && 'cursor-pointer hover:bg-muted/25',
                    row.status === 'rejected' && BRAND_REJECTED_ROW_CLASS
                  )}
                  onClick={() => {
                    if (row.url) window.open(row.url, '_blank', 'noopener,noreferrer')
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <PersonAvatar
                        name={row.creatorName}
                        src={row.creatorAvatarUrl}
                        size="xs"
                        className="shrink-0"
                      />
                      <span className={cn('font-medium', strikethrough)}>{row.creatorName}</span>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <PlatformCell platform={row.platform} iconClassName="h-5 w-5" />
                  </TableCell>
                  <TableCell className={cn('font-display font-semibold tabular-nums', strikethrough)}>
                    {formatViews(row.views)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'font-display font-semibold tabular-nums',
                      isRejected ? strikethrough : 'text-phc-gradient'
                    )}
                  >
                    {formatPHP(row.payoutGross, { decimals: false })}
                  </TableCell>
                  <TableCell>
                    <ContentStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {canReject ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className={cn(
                          'rounded-md font-normal',
                          BRAND_REJECT_OUTLINE_BTN_CLASS
                        )}
                        onClick={() => openRejectForSubmission(row.id, row.creatorName)}
                      >
                        Reject
                      </Button>
                    ) : isRejected ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="rounded-md font-normal"
                        disabled={isRestoringSubmission}
                        onClick={() => restoreRejectedSubmission(row.id)}
                      >
                        {isRestoringSubmission ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                        )}
                        Restore
                      </Button>
                    ) : (
                      <span className="inline-block min-w-17" aria-hidden />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </section>
    </div>
  )}
</div>

<Dialog open={releasePayoutOpen} onOpenChange={setReleasePayoutOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="font-display text-xl">Release payout</DialogTitle>
      <DialogDescription>
        Confirm payout for all pending submissions. Reject any submission you do not want to
        pay before confirming.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Total gross releasing
        </p>
        <p className="mt-1 font-display text-lg md:text-xl font-bold tabular-nums text-foreground">
          {formatPHP(pendingPayoutTotal, { decimals: false })}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {pendingPayoutSubmissions.length} submission
          {pendingPayoutSubmissions.length === 1 ? '' : 's'} included
        </p>
      </div>
    </div>
    <DialogFooter className="gap-2 sm:gap-0">
      <Button
        type="button"
        variant="outline"
        disabled={isReleasingPayout}
        onClick={() => setReleasePayoutOpen(false)}
      >
        Cancel
      </Button>
      <Button
        type="button"
        className="bg-phc-gradient font-semibold text-white hover:opacity-90"
        disabled={isReleasingPayout || pendingPayoutSubmissions.length === 0}
        onClick={() => void confirmReleasePayouts()}
      >
        {isReleasingPayout ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Confirming…
          </>
        ) : (
          'Confirm release'
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog
  open={rejectTarget !== null}
  onOpenChange={(open) => {
    if (!open) resetRejectDialog()
  }}
>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>
        {rejectTarget ? `Reject ${rejectTarget.creatorName}?` : 'Reject submission?'}
      </DialogTitle>
      <DialogDescription>
        This submission will not be paid on the next payout release. Pick the closest reason.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {BRAND_REJECT_PRESETS.map((preset) => (
        <label
          key={preset.id}
          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
            rejectPreset === preset.id
              ? 'border-primary bg-primary/5'
              : 'border-border hover:bg-muted/40'
          }`}
        >
          <input
            type="radio"
            name="brand-reject-reason"
            className="mt-0.5 size-4 shrink-0"
            checked={rejectPreset === preset.id}
            onChange={() => setRejectPreset(preset.id)}
          />
          <span className="text-sm leading-snug">{preset.label}</span>
        </label>
      ))}
      {rejectPreset === 'other' ? (
        <div className="space-y-1.5 p-1">
          <Label htmlFor="brand-reject-other" className="text-xs text-muted-foreground">
            Describe the reason
          </Label>
          <Textarea
            id="brand-reject-other"
            rows={3}
            placeholder="Short note for your records (e.g. creator requested removal)."
            value={rejectOtherDetail}
            onChange={(e) => setRejectOtherDetail(e.target.value)}
            className="resize-none text-sm leading-snug"
          />
        </div>
      ) : null}
    </div>
    <DialogFooter className="gap-2 sm:gap-0">
      <Button
        type="button"
        variant="outline"
        disabled={isRejectingSubmission}
        onClick={() => {
          resetRejectDialog()
        }}
      >
        Cancel
      </Button>
      <Button
        type="button"
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        disabled={isRejectingSubmission}
        onClick={confirmBrandReject}
      >
        {isRejectingSubmission ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Rejecting…
          </>
        ) : (
          'Reject'
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </>
  )
}
