import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Loader2,
  Wallet,
  Plus,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { mockBrandClips } from '@/lib/mockData'
import { formatPHP, formatViews, formatTimeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClipStatusBadge } from '@/components/ClipStatusBadge'
import { PlatformIcon } from '@/components/PlatformIcon'
import {
  getPlatformFeePercent,
  NICHE_LABEL,
  PLATFORM_LABEL,
} from '@/lib/mockData'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function BrandCampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const campaign = useCampaignsStore((s) => s.campaigns.find((c) => c.id === id))
  const updateCampaign = useCampaignsStore((s) => s.updateCampaign)
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('xendit-invoice')
  const [isAddingFunds, setIsAddingFunds] = useState(false)

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-lg font-bold">Campaign not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/brand/campaigns">Back to campaigns</Link>
        </Button>
      </div>
    )
  }

  const platformFeePercent = campaign.platformFeePercent ?? getPlatformFeePercent(campaign.budget)
  const brandRatePer1k = campaign.brandRatePer1k ?? campaign.ratePer1k
  const platformFee = campaign.budget * platformFeePercent
  const payoutPool = Math.max(0, campaign.budget - platformFee)
  const remaining = Math.max(0, payoutPool - campaign.spent)
  const progress = payoutPool > 0 ? Math.min(100, (campaign.spent / payoutPool) * 100) : 0
  const submissions = mockBrandClips.filter((c) => c.campaignId === campaign.id)
  const totalViews = submissions.reduce((s, c) => s + c.views, 0)

  function togglePause() {
    if (!campaign) return
    const next = campaign.status === 'paused' ? 'active' : 'paused'
    updateCampaign(campaign.id, { status: next })
    toast.success(next === 'paused' ? 'Campaign paused' : 'Campaign resumed')
  }

  async function handleAddFunds(e: React.FormEvent) {
    e.preventDefault()
    if (!campaign) return

    const amount = Number(fundAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount to add.')
      return
    }

    setIsAddingFunds(true)
    await new Promise((resolve) => setTimeout(resolve, 650))
    updateCampaign(campaign.id, { budget: campaign.budget + amount })
    setIsAddingFunds(false)
    setAddFundsOpen(false)
    setFundAmount('')
    toast.success(`${formatPHP(amount, { decimals: false })} added to this campaign.`)
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/brand/campaigns"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All campaigns
        </Link>
      </div>

      {/* Hero */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${campaign.coverColor} text-white p-8 md:p-10`}
      >
        {campaign.coverImageUrl ? (
          <img
            src={campaign.coverImageUrl}
            alt={campaign.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.3),transparent_60%)]" />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/45 to-black/20" />
        <div className="relative flex flex-col md:flex-row md:items-end gap-6">
          <div className="flex-1">
            <Badge className="capitalize bg-white/15 backdrop-blur border-white/20 text-white">
              {campaign.status}
            </Badge>
            <h1 className="mt-4 font-display text-3xl md:text-4xl font-extrabold leading-tight">
              {campaign.title}
            </h1>
            <p className="mt-2 max-w-2xl text-white/90">{campaign.description}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-white/15 backdrop-blur border-white/30 text-white hover:bg-white/25"
              onClick={togglePause}
            >
              {campaign.status === 'paused' ? (
                <>
                  <Play className="h-4 w-4" /> Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" /> Pause
                </>
              )}
            </Button>
            <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-gray-900 hover:bg-white/90 font-bold">
                  <Plus className="h-4 w-4" /> Add funds
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add funds to campaign</DialogTitle>
                  <DialogDescription>
                    Funds will be added after payment confirmation.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddFunds} className="space-y-4">
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Current campaign balance</p>
                    <p className="mt-1 font-display text-2xl font-extrabold">
                      {formatPHP(remaining, { decimals: false })}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fund-amount">Amount to add (₱)</Label>
                    <Input
                      id="fund-amount"
                      type="number"
                      min="1"
                      inputMode="decimal"
                      placeholder="10000"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Payment method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xendit-invoice">Xendit invoice / payment link</SelectItem>
                        <SelectItem value="gcash">GCash</SelectItem>
                        <SelectItem value="maya">Maya</SelectItem>
                        <SelectItem value="bank-transfer">Bank transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
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
                          <Loader2 className="h-4 w-4 animate-spin" /> Processing
                        </>
                      ) : (
                        'Confirm add funds'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Payout pool left
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold">
            {formatPHP(remaining, { decimals: false })}
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-phc-gradient" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">PHC budget fee</p>
          <p className="mt-2 font-display text-2xl font-extrabold">
            {formatPHP(platformFee, { decimals: false })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.round(platformFeePercent * 100)}% non-refundable platform cut
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Total views
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold">{formatViews(totalViews)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Brand rate</p>
          <p className="mt-2 font-display text-2xl font-extrabold">
            {formatPHP(brandRatePer1k, { decimals: false })}
            <span className="text-sm font-medium text-muted-foreground"> / 1K</span>
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-extrabold">PHC revenue breakdown</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Total brand budget</p>
            <p className="mt-1 font-display text-lg font-extrabold">
              {formatPHP(campaign.budget, { decimals: false })}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Payout pool</p>
            <p className="mt-1 font-display text-lg font-extrabold">
              {formatPHP(payoutPool, { decimals: false })}
            </p>
          </div>
        </div>
      </section>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {campaign.platforms.map((p) => (
          <Badge key={p} className="bg-foreground text-background">
            {PLATFORM_LABEL[p]}
          </Badge>
        ))}
        {campaign.niches.map((n) => (
          <Badge key={n} variant="secondary">
            {NICHE_LABEL[n]}
          </Badge>
        ))}
      </div>

      {/* Campaign assets */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-extrabold">Campaign assets</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These are the files clippers can use when creating their clips.
            </p>
          </div>
          <Badge variant="secondary">{campaign.assets?.length ?? 0} files</Badge>
        </div>

        {campaign.assets?.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {campaign.assets.map((asset) => (
              <a
                key={asset.id}
                href={asset.url}
                download={asset.name}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {asset.type || 'File'} · {formatBytes(asset.size)}
                  </p>
                </div>
                <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="font-medium">No assets uploaded</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add files when creating a campaign so clippers have raw materials to use.
            </p>
          </div>
        )}
      </section>

      {/* Submissions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-extrabold">Submitted clips</h2>
          <p className="text-sm text-muted-foreground">{submissions.length} clips</p>
        </div>
        {submissions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <p className="font-medium">No submissions yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Clippers will start submitting soon.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Clipper</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Submitted</th>
                  <th className="px-5 py-3 font-medium">Views</th>
                  <th className="px-5 py-3 font-medium">Earnings</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((clip) => (
                  <tr key={clip.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <PlatformIcon platform={clip.platform} className="h-9 w-9" />
                        <div>
                          <p className="font-medium">{clip.clipperName}</p>
                          <a
                            href={clip.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                          >
                            View clip <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-muted-foreground">
                      {formatTimeAgo(clip.submittedAt)}
                    </td>
                    <td className="px-5 py-4 font-display font-bold">{formatViews(clip.views)}</td>
                    <td className="px-5 py-4 font-display font-bold text-phc-gradient">
                      {formatPHP(clip.earnings, { decimals: false })}
                    </td>
                    <td className="px-5 py-4">
                      <ClipStatusBadge status={clip.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {clip.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                              onClick={() => toast.success('Approved!')}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                              onClick={() => toast.success('Rejected')}
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
