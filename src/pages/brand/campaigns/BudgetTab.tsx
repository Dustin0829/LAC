import { AlertCircle, BadgeCheck, CircleDollarSign, Clock, Copy, ExternalLink, Info, Loader2, MoreVertical, Pause, Play, Plus, RefreshCw, Undo2, Wallet, XCircle } from 'lucide-react'
import { useEffect, useState, type MutableRefObject } from 'react'
import type { Campaign } from '@/lib/mockData'
import type { PaymentMethod } from '@/lib/mockData'
import { toast } from 'sonner'
import {
  useBrandCampaignTransactions,
  useSyncBrandCampaignCheckout,
} from '@/api/queries/brands/use-campaigns'
import type {
  BrandCampaignTransaction,
  BrandCampaignTransactionStatus,
} from '@/api/types/brands/campaigns.types'
import { getPlatformFeePercent } from '@/lib/mockData'
import { cn, formatBadgeLabel, formatPHP, formatTransactionDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AddPaymentMethodDialog } from '@/components/account/AddPaymentMethodDialog'

function formatSignedAmount(amount: string): string {
  const n = Number(amount)
  if (!Number.isFinite(n)) return amount
  const abs = formatPHP(Math.abs(n), { decimals: false })
  if (n > 0) return `+${abs}`
  if (n < 0) return `−${abs}`
  return abs
}

const DEPOSIT_KINDS = new Set<BrandCampaignTransaction['kind']>(['initial_fund', 'top_up'])

type DepositBreakdown = {
  depositedGross: number
  platformFee: number
  payoutPool: number
  feePercent: number
}

function getDepositBreakdown(row: BrandCampaignTransaction): DepositBreakdown | null {
  if (!DEPOSIT_KINDS.has(row.kind)) return null

  const feePercent = getPlatformFeePercent()
  const gross = Math.abs(Number(row.amountGross))
  const display = Math.abs(Number(row.amountDisplay ?? row.amountGross))
  if (!Number.isFinite(gross) || gross <= 0) return null
  if (row.status === 'awaiting_payment') return null

  if (!Number.isFinite(display) || display <= 0) return null
  if (Math.abs(gross - display) < 0.01) return null

  return {
    depositedGross: gross,
    platformFee: Math.round((gross - display) * 100) / 100,
    payoutPool: display,
    feePercent,
  }
}

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return isMobile
}

type AmountDetailModal =
  | { kind: 'hint' }
  | { kind: 'breakdown'; breakdown: DepositBreakdown }
  | { kind: 'transaction_alert'; message: string; alertKind: 'failed' | 'expired' }
  | null

function getRowAlertMessage(row: BrandCampaignTransaction): {
  message: string
  alertKind: 'failed' | 'expired'
} | null {
  const explicit = row.failureReason?.trim()
  if (row.status === 'expired') {
    return {
      message:
        explicit ??
        'This checkout session expired before payment was completed. The payment link is no longer valid.',
      alertKind: 'expired',
    }
  }
  if (row.status === 'failed') {
    if (explicit) return { message: explicit, alertKind: 'failed' }
    if (row.kind === 'initial_fund' || row.kind === 'top_up') {
      return {
        message: 'This checkout could not be completed. Start a new checkout to try again.',
        alertKind: 'failed',
      }
    }
    if (row.kind === 'refund') {
      return {
        message:
          'Refund could not be processed. Check your refund receiving account and try again.',
        alertKind: 'failed',
      }
    }
    if (row.kind === 'payout_failed') {
      return {
        message: 'Payout could not be sent to the creator. Funds remain in your campaign balance.',
        alertKind: 'failed',
      }
    }
  }
  return null
}

function AmountHintBody({ className }: { className?: string }) {
  return (
    <p className={cn('leading-relaxed text-muted-foreground', className ?? 'text-xs')}>
      Top-ups and initial funding show the{' '}
      <strong className="font-semibold text-foreground">payout pool</strong> credited to your
      campaign (after platform fee).
    </p>
  )
}

function DepositBreakdownBody({
  breakdown,
  className,
}: {
  breakdown: DepositBreakdown
  className?: string
}) {
  const pct = Math.round(breakdown.feePercent * 100)
  const depositedLabel = 'Total deposited'
  const poolLabel = 'Payout pool'

  return (
    <div className={cn('space-y-3', className ?? 'text-xs')}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">{depositedLabel}</span>
        <span className="font-semibold tabular-nums text-foreground">
          {formatPHP(breakdown.depositedGross, { decimals: false })}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Platform fee ({pct}%)</span>
        <span className="font-semibold tabular-nums text-foreground">
          {formatPHP(breakdown.platformFee, { decimals: false })}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
        <span className="font-medium text-foreground">{poolLabel}</span>
        <span className="font-display font-bold tabular-nums text-foreground">
          {formatPHP(breakdown.payoutPool, { decimals: false })}
        </span>
      </div>
    </div>
  )
}

const AMOUNT_HINT_BTN_CLASS =
  'inline-flex shrink-0 rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const FAILURE_HINT_BTN_CLASS =
  'inline-flex shrink-0 rounded-full text-amber-600 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-amber-400 dark:hover:text-amber-300'

function TransactionAlertHint({
  message,
  alertKind,
  isMobile,
  onMobileOpen,
}: {
  message: string
  alertKind: 'failed' | 'expired'
  isMobile: boolean
  onMobileOpen: (payload: { message: string; alertKind: 'failed' | 'expired' }) => void
}) {
  const ariaLabel =
    alertKind === 'expired' ? 'Checkout session expired' : 'Why this transaction failed'

  if (isMobile) {
    return (
      <button
        type="button"
        className={cn(FAILURE_HINT_BTN_CLASS, 'h-8 w-8 items-center justify-center')}
        aria-label={ariaLabel}
        onClick={() => onMobileOpen({ message, alertKind })}
      >
        <AlertCircle className="h-4 w-4" aria-hidden />
      </button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(FAILURE_HINT_BTN_CLASS, 'h-8 w-8 items-center justify-center')}
          aria-label={ariaLabel}
        >
          <AlertCircle className="h-4 w-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <p className="text-xs leading-relaxed text-red-600">{message}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function AmountHeaderHint({
  isMobile,
  onMobileOpen,
}: {
  isMobile: boolean
  onMobileOpen: () => void
}) {
  if (isMobile) {
    return (
      <button
        type="button"
        className={cn(AMOUNT_HINT_BTN_CLASS, 'min-h-8 min-w-8 items-center justify-center')}
        aria-label="How deposit amounts are shown"
        onClick={onMobileOpen}
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(AMOUNT_HINT_BTN_CLASS, 'p-0.5')}
          aria-label="How deposit amounts are shown"
        >
          <Info className="h-3.5 w-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <AmountHintBody />
      </TooltipContent>
    </Tooltip>
  )
}

function TransactionAmountCell({
  amountLabel,
  amountClassName,
  depositBreakdown,
  isMobile,
  onMobileBreakdown,
}: {
  amountLabel: string
  amountClassName: string
  depositBreakdown: DepositBreakdown | null
  isMobile: boolean
  onMobileBreakdown: (breakdown: DepositBreakdown) => void
}) {
  if (!depositBreakdown) {
    return <span className={amountClassName}>{amountLabel}</span>
  }

  if (isMobile) {
    return (
      <button
        type="button"
        className={cn(
          amountClassName,
          'underline decoration-dotted underline-offset-4 active:opacity-80'
        )}
        onClick={() => onMobileBreakdown(depositBreakdown)}
      >
        {amountLabel}
      </button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            amountClassName,
            'cursor-help underline decoration-dotted underline-offset-4'
          )}
        >
          {amountLabel}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <DepositBreakdownBody breakdown={depositBreakdown} />
      </TooltipContent>
    </Tooltip>
  )
}

type RowAction =
  | { kind: 'open_checkout'; url: string }
  | { kind: 'copy_link'; url: string }
  | { kind: 'apply_credit' }

function getRowActions(row: BrandCampaignTransaction): RowAction[] {
  if (row.status === 'awaiting_payment' && row.checkoutUrl) {
    return [
      { kind: 'open_checkout', url: row.checkoutUrl },
      { kind: 'copy_link', url: row.checkoutUrl },
    ]
  }
  if (row.canSync && row.externalId) {
    return [{ kind: 'apply_credit' }]
  }
  return []
}

function TransactionRowToolbar({
  row,
  isSyncing,
  isMobile,
  onMobileAlert,
  onOpenCheckout,
  onCopyLink,
  onApplyCredit,
}: {
  row: BrandCampaignTransaction
  isSyncing: boolean
  isMobile: boolean
  onMobileAlert: (payload: { message: string; alertKind: 'failed' | 'expired' }) => void
  onOpenCheckout: (url: string) => void
  onCopyLink: (url: string) => void
  onApplyCredit: (row: BrandCampaignTransaction) => void
}) {
  const actions = getRowActions(row)
  const alert = getRowAlertMessage(row)
  if (actions.length === 0 && !alert) return null

  return (
    <div className="flex items-center justify-end gap-0.5">
      {alert ? (
        <TransactionAlertHint
          message={alert.message}
          alertKind={alert.alertKind}
          isMobile={isMobile}
          onMobileOpen={onMobileAlert}
        />
      ) : null}
      {actions.length > 0 ? (
        <TransactionRowActionsMenu
          row={row}
          actions={actions}
          isSyncing={isSyncing}
          onOpenCheckout={onOpenCheckout}
          onCopyLink={onCopyLink}
          onApplyCredit={onApplyCredit}
        />
      ) : null}
    </div>
  )
}

function TransactionRowActionsMenu({
  row,
  actions,
  isSyncing,
  onOpenCheckout,
  onCopyLink,
  onApplyCredit,
}: {
  row: BrandCampaignTransaction
  actions: RowAction[]
  isSyncing: boolean
  onOpenCheckout: (url: string) => void
  onCopyLink: (url: string) => void
  onApplyCredit: (row: BrandCampaignTransaction) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Transaction actions"
        >
          <MoreVertical className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {actions.map((action) => {
          if (action.kind === 'open_checkout') {
            return (
              <DropdownMenuItem
                key="open_checkout"
                icon={<ExternalLink />}
                onClick={() => onOpenCheckout(action.url)}
              >
                Open checkout
              </DropdownMenuItem>
            )
          }
          if (action.kind === 'copy_link') {
            return (
              <DropdownMenuItem
                key="copy_link"
                icon={<Copy />}
                onClick={() => void onCopyLink(action.url)}
              >
                Copy link
              </DropdownMenuItem>
            )
          }
          return (
            <DropdownMenuItem
              key="apply_credit"
              disabled={isSyncing}
              icon={isSyncing ? <Loader2 className="animate-spin" /> : <CircleDollarSign />}
              onClick={() => onApplyCredit(row)}
            >
              {isSyncing ? 'Applying…' : 'Apply credit'}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const TRANSACTION_STATUS_STYLES: Record<
  BrandCampaignTransactionStatus,
  { className: string; label: string; Icon: typeof Clock }
> = {
  completed: {
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-400',
    label: 'Completed',
    Icon: BadgeCheck,
  },
  pending: {
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-300',
    label: 'Pending',
    Icon: Clock,
  },
  awaiting_payment: {
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-300',
    label: 'Awaiting payment',
    Icon: Clock,
  },
  expired: {
    className: 'border-muted-foreground/30 bg-muted/60 text-muted-foreground dark:bg-muted/40',
    label: 'Expired',
    Icon: XCircle,
  },
  awaiting_credit: {
    className:
      'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/35 dark:text-sky-300',
    label: 'Payment received',
    Icon: CircleDollarSign,
  },
  failed: {
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-400',
    label: 'Failed',
    Icon: XCircle,
  },
}

/** Budget tab transaction table — used only by `CampaignDetailPage`. */

export type BudgetTabProps = {
  campaignId: string
  campaign: Campaign
  remaining: number
  payoutPool: number
  reserved: number
  paidOut: number
  platformFeePercent: number
  minPublishThreshold: number
  hasRefundReceivingAccount: boolean
  refundReceivingMethods: PaymentMethod[]
  onOpenRefund: () => void
  onOpenAddFunds: () => void
  onOpenFundAndPublish: () => void
  refundOpen: boolean
  setRefundOpen: (open: boolean) => void
  isRefunding: boolean
  setIsRefunding: (value: boolean) => void
  confirmRefundAvailable: () => void
  refundNeedAccountOpen: boolean
  setRefundNeedAccountOpen: (open: boolean) => void
  openAddRefundAccountFromPrompt: () => void
  addRefundAccountOpen: boolean
  setAddRefundAccountOpen: (open: boolean) => void
  skipRefundPromptRestoreRef: MutableRefObject<boolean>
  refundInProgress: boolean
}

export function BudgetTab(props: BudgetTabProps) {
  const {
    campaignId,
    campaign,
    remaining,
    payoutPool,
    reserved,
    paidOut,
    minPublishThreshold,
    onOpenRefund,
    onOpenAddFunds,
    onOpenFundAndPublish,
    refundOpen,
    setRefundOpen,
    isRefunding,
    setIsRefunding,
    confirmRefundAvailable,
    refundNeedAccountOpen,
    setRefundNeedAccountOpen,
    openAddRefundAccountFromPrompt,
    addRefundAccountOpen,
    setAddRefundAccountOpen,
    skipRefundPromptRestoreRef,
    refundReceivingMethods,
    refundInProgress,
  } = props

  return (
<div className="space-y-6" role="tabpanel" aria-labelledby="campaign-tab-budget">
  <section className="space-y-6 rounded-3xl border border-border bg-card p-6 md:p-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-4 items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
          <Wallet className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
            Budget
          </h2>
          <p className="text-sm text-muted-foreground">Manage funds for this campaign.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-col-reverse md:flex-row">
        <Button
          type="button"
          variant="outline"
          className="font-semibold w-full md:w-auto"
          disabled={remaining <= 0 || refundInProgress || isRefunding}
          onClick={onOpenRefund}
        >
          <Undo2 className="h-4 w-4" /> Refund Available Balance
        </Button>
        <Button
          type="button"
          className="shrink-0 bg-phc-gradient font-semibold text-white hover:opacity-90 w-full md:w-auto"
          onClick={campaign.status === 'draft' ? onOpenFundAndPublish : onOpenAddFunds}
        >
          {campaign.status === 'draft' ? (
            <>
              <Play className="h-4 w-4" /> Fund &amp; publish
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Add funds
            </>
          )}
        </Button>
      </div>
    </div>

    {refundInProgress ? (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
        <Clock
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300"
          aria-hidden
        />
        <div>
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            Refund in progress
          </p>
          <p className="mt-0.5 text-amber-800 dark:text-amber-200/90">
            This campaign is paused until the refund finishes. Creators cannot submit new content
            while a refund is processing.
          </p>
        </div>
      </div>
    ) : null}

    {remaining + reserved < minPublishThreshold &&
    campaign.status === 'active' ? (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
        <Pause
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300"
          aria-hidden
        />
        <div>
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            Spendable below publish floor (
            {formatPHP(minPublishThreshold, { decimals: false })})
          </p>
          <p className="mt-0.5 text-amber-800 dark:text-amber-200/90">
            New submissions will be auto-paused until you top up. Included lines still
            settle on next payout.
          </p>
        </div>
      </div>
    ) : null}

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex justify-between items-center rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Payout Pool</p>
          <p className="mt-1 font-display text-lg md:text-xl font-bold tabular-nums text-foreground">
            {formatPHP(payoutPool, { decimals: false })}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/45 dark:text-blue-300">
          <Wallet className="h-5 w-5" aria-hidden />
        </div>
      </div>

      <div className="flex justify-between items-center rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Available</p>
          <p className="mt-1 font-display text-lg md:text-xl font-bold tabular-nums text-foreground">
            {formatPHP(remaining, { decimals: false })}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-300">
          <Wallet className="h-5 w-5" aria-hidden />
        </div>
      </div>

      <div className="flex justify-between items-center rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Reserved</p>
          <p className="mt-1 font-display text-lg md:text-xl font-bold tabular-nums text-foreground">
            {formatPHP(reserved, { decimals: false })}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/45 dark:text-orange-300">
          <Clock className="h-5 w-5" aria-hidden />
        </div>
      </div>

      <div className="flex justify-between items-center rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Paid</p>
          <p className="mt-1 font-display text-lg md:text-xl font-bold tabular-nums text-foreground">
            {formatPHP(paidOut, { decimals: false })}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/45 dark:text-violet-300">
          <CircleDollarSign className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  </section>

  {campaignId ? <CampaignBudgetTransactions campaignId={campaignId} /> : null}

  <Dialog
    open={refundOpen}
    onOpenChange={(open) => {
      setRefundOpen(open)
      if (!open) setIsRefunding(false)
    }}
  >
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Refund available balance?</DialogTitle>
        <DialogDescription>
          This returns your available balance ({formatPHP(remaining, { decimals: false })})
          to your default refund receiving account (Brand account). Paid and reserved
          amounts are unchanged. Total budget becomes paid plus reserved after this refund.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRefundOpen(false)}
          disabled={isRefunding}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="bg-phc-gradient font-semibold text-white hover:opacity-90"
          disabled={isRefunding || remaining <= 0}
          onClick={() => void confirmRefundAvailable()}
        >
          {isRefunding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing
            </>
          ) : (
            `Refund ${formatPHP(remaining, { decimals: false })}`
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog open={refundNeedAccountOpen} onOpenChange={setRefundNeedAccountOpen}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add a refund receiving account</DialogTitle>
        <DialogDescription>
          We need a bank or e-wallet on file before we can send a campaign balance refund.
        </DialogDescription>
      </DialogHeader>
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-50">
        <p className="font-medium">Refund receiving account required</p>
        <p className="mt-1 text-xs leading-relaxed opacity-90">
          Add a bank or e-wallet where we can send your refund.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 text-primary hover:opacity-90"
          onClick={openAddRefundAccountFromPrompt}
        >
          <Plus className="h-4 w-4" /> Add Receiving Account
        </Button>
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRefundNeedAccountOpen(false)}
        >
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <AddPaymentMethodDialog
    mode="brand"
    open={addRefundAccountOpen}
    onOpenChange={(open) => {
      setAddRefundAccountOpen(open)
      if (!open) {
        if (skipRefundPromptRestoreRef.current) {
          skipRefundPromptRestoreRef.current = false
          return
        }
        if (refundReceivingMethods.length === 0) {
          setRefundNeedAccountOpen(true)
        }
      }
    }}
    onSuccess={() => {
      skipRefundPromptRestoreRef.current = true
      setRefundOpen(true)
    }}
  />
</div>
  )
}

function CampaignBudgetTransactions({ campaignId }: { campaignId: string }) {
  const { data, isLoading, isError, refetch, isFetching } = useBrandCampaignTransactions(campaignId)
  const { mutate: syncCheckout } = useSyncBrandCampaignCheckout(campaignId)
  const [syncingExternalId, setSyncingExternalId] = useState<string | null>(null)
  const [amountDetailModal, setAmountDetailModal] = useState<AmountDetailModal>(null)
  const isMobile = useIsMobileViewport()

  const items = data?.items ?? []

  async function copyCheckoutLink(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Checkout link copied.')
    } catch {
      toast.error('Could not copy link.')
    }
  }

  function handleApplyCredit(row: BrandCampaignTransaction) {
    if (!row.externalId || !row.canSync) return
    setSyncingExternalId(row.externalId)
    syncCheckout(row.externalId, { onSettled: () => setSyncingExternalId(null) })
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight">Transaction history</h3>
            <p className="text-sm text-muted-foreground">
              Funding, top-ups, refunds, and creator payouts for this campaign.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 font-semibold"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading transactions…
          </div>
        ) : isError ? (
          <p className="px-5 py-12 text-center text-sm text-destructive">
            Could not load transactions. Try refresh.
          </p>
        ) : items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            No transactions yet. Fund or publish to see payments here.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">
                  <span className="inline-flex items-center justify-end gap-1">
                    Amount
                    <AmountHeaderHint
                      isMobile={isMobile}
                      onMobileOpen={() => setAmountDetailModal({ kind: 'hint' })}
                    />
                  </span>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => {
                const showAmount = row.status !== 'awaiting_payment'
                const isAmountInactive = row.status === 'failed' || row.status === 'expired'
                const displayAmount = row.amountDisplay ?? row.amountGross
                const amountNum = Number(displayAmount)
                const depositBreakdown =
                  showAmount && !isAmountInactive ? getDepositBreakdown(row) : null
                const isSyncing = syncingExternalId === row.externalId
                const statusCfg = TRANSACTION_STATUS_STYLES[row.status]
                const StatusIcon = statusCfg.Icon
                const amountClassName = cn(
                  'font-display font-semibold tabular-nums',
                  isAmountInactive &&
                    'text-muted-foreground line-through decoration-muted-foreground/70',
                  !isAmountInactive && amountNum > 0 && 'text-emerald-600 dark:text-emerald-400',
                  !isAmountInactive && amountNum < 0 && 'text-red-600 dark:text-red-400'
                )
                const amountLabel = formatSignedAmount(displayAmount)
                return (
                  <TableRow key={`${row.kind}-${row.id}`} className="border-border">
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatTransactionDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{row.description}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      {showAmount ? (
                        <TransactionAmountCell
                          amountLabel={amountLabel}
                          amountClassName={amountClassName}
                          depositBreakdown={depositBreakdown}
                          isMobile={isMobile}
                          onMobileBreakdown={(breakdown) =>
                            setAmountDetailModal({ kind: 'breakdown', breakdown })
                          }
                        />
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          statusCfg.className,
                          'flex w-fit items-center gap-1 border font-medium'
                        )}
                      >
                        <StatusIcon className="h-3 w-3 shrink-0" aria-hidden />
                        {formatBadgeLabel(statusCfg.label)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <TransactionRowToolbar
                        row={row}
                        isSyncing={isSyncing}
                        isMobile={isMobile}
                        onMobileAlert={(payload) =>
                          setAmountDetailModal({ kind: 'transaction_alert', ...payload })
                        }
                        onOpenCheckout={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
                        onCopyLink={copyCheckoutLink}
                        onApplyCredit={(r) => void handleApplyCredit(r)}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog
        open={amountDetailModal !== null}
        onOpenChange={(open) => {
          if (!open) setAmountDetailModal(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {amountDetailModal?.kind === 'breakdown'
                ? 'Deposit Breakdown'
                : amountDetailModal?.kind === 'transaction_alert'
                  ? amountDetailModal.alertKind === 'expired'
                    ? 'Checkout Expired'
                    : 'Why This Failed'
                  : 'About Amounts'}
            </DialogTitle>
          </DialogHeader>
          {amountDetailModal?.kind === 'hint' ? (
            <AmountHintBody className="text-sm" />
          ) : amountDetailModal?.kind === 'breakdown' ? (
            <DepositBreakdownBody breakdown={amountDetailModal.breakdown} className="text-sm" />
          ) : amountDetailModal?.kind === 'transaction_alert' ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {amountDetailModal.message}
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
