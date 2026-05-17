import {
  createBrandCampaign,
  createBrandCampaignCheckout,
  patchBrandCampaign,
} from '@/api/services/brands/campaigns'
import { postUploadPresign } from '@/api/services/brands/uploads'
import {
  createBrandCampaignBodySchema,
  type CreateCampaignFormInput,
  type CreateCampaignFormValidationIssue,
} from '@/api/schema/brands/createCampaign.schema'
import type {
  BrandCampaignDetailDto,
  CreateBrandCampaignBody,
  PatchBrandCampaignBody,
} from '@/api/types/brands/campaigns.types'
import type { CampaignCoverContentType } from '@/api/types/brands/uploads.types'
import { DEFAULT_CAMPAIGN_RULES, MIN_BRAND_RATE_PER_1K, MIN_PUBLISH_PHP } from '@/lib/constants'
import { isValidHttpOrHttpsUrl } from '@/lib/utils'

/** Placeholder for a rule row — derived from `DEFAULT_CAMPAIGN_RULES`, not duplicated in the page. */
export function campaignRulePlaceholder(index: number): string {
  const example = DEFAULT_CAMPAIGN_RULES[index]
  return example ? `e.g. ${example}` : `Rule ${index + 1}`
}

export function initialCampaignRules(): string[] {
  return [...DEFAULT_CAMPAIGN_RULES]
}

export type { CreateCampaignFormInput, CreateCampaignFormValidationIssue }

/** Thrown when draft exists but cover upload or checkout failed — caller should retry with `existingCampaignId`. */
export class CampaignSubmitError extends Error {
  readonly campaignId: string
  readonly stage: 'cover' | 'checkout'

  constructor(message: string, partial: { campaignId: string; stage: 'cover' | 'checkout' }) {
    super(message)
    this.name = 'CampaignSubmitError'
    this.campaignId = partial.campaignId
    this.stage = partial.stage
  }
}

export function buildCreateBrandCampaignBody(input: CreateCampaignFormInput): CreateBrandCampaignBody {
  const body: CreateBrandCampaignBody = {
    title: input.title.trim(),
    description: input.description.trim(),
    ratePer1k: input.ratePer1k,
    plannedGrossBudget: input.plannedGrossBudget,
    platforms: input.platforms,
    rules: input.rules.map((r) => r.trim()).filter(Boolean),
  }
  if (input.referenceLinks.length > 0) body.referenceLinks = input.referenceLinks
  if (input.assetUrls.length > 0) body.assetUrls = input.assetUrls
  return body
}

function bodyToPatchBody(body: CreateBrandCampaignBody): PatchBrandCampaignBody {
  return {
    title: body.title,
    description: body.description,
    platforms: body.platforms,
    ratePer1k: body.ratePer1k,
    plannedGrossBudget: body.plannedGrossBudget,
    rules: body.rules,
    referenceLinks: body.referenceLinks ?? null,
    assetUrls: body.assetUrls ?? null,
  }
}

export function validateCreateCampaignForm(
  input: CreateCampaignFormInput,
  opts: { requirePublishFunding: boolean }
): CreateCampaignFormValidationIssue | null {
  if (!input.title.trim()) {
    return { message: 'Add a campaign title.', fieldId: 'title' }
  }
  if (!input.description.trim()) {
    return { message: 'Add a description so creators know what to film.', fieldId: 'description' }
  }
  if (input.platforms.length === 0) {
    return { message: 'Pick at least one platform.', fieldId: 'campaign-platforms' }
  }
  const trimmedRules = input.rules.map((r) => r.trim()).filter(Boolean)
  if (trimmedRules.length === 0) {
    return { message: 'Add at least one rule for creators.', fieldId: 'campaign-rule-0' }
  }

  const assetUrl = input.assetUrls[0]?.trim() ?? ''
  if (assetUrl && !isValidHttpOrHttpsUrl(assetUrl)) {
    return {
      message:
        'Add a valid link for assets (https:// or http://, e.g. Google Drive or Dropbox), or leave it blank.',
      fieldId: 'asset-pack-url',
    }
  }

  for (const link of input.referenceLinks) {
    if (!isValidHttpOrHttpsUrl(link)) {
      return {
        message:
          'Each line must be a full http(s) URL (for example https://example.com/page). Fix or remove invalid lines before saving.',
        fieldId: 'reference-links',
      }
    }
  }

  if (input.ratePer1k < MIN_BRAND_RATE_PER_1K) {
    return {
      message: `Brand rate must be at least ₱${MIN_BRAND_RATE_PER_1K} per 1,000 views.`,
      fieldId: 'rate',
    }
  }
  if (input.plannedGrossBudget < MIN_PUBLISH_PHP) {
    return {
      message: `Total budget must be at least ₱${MIN_PUBLISH_PHP.toLocaleString('en-PH')}.`,
      fieldId: 'budget',
    }
  }

  if (opts.requirePublishFunding) {
    if (!assetUrl) {
      return {
        message: 'Add an asset link creators need (Drive, Dropbox, etc.) before publishing.',
        fieldId: 'asset-pack-url',
      }
    }
  }

  const body = buildCreateBrandCampaignBody(input)
  const parsed = createBrandCampaignBodySchema.safeParse(body)
  if (!parsed.success) {
    return { message: 'Fix the highlighted fields before saving.', fieldId: 'title' }
  }

  return null
}

function contentTypeForCoverFile(file: File): CampaignCoverContentType | null {
  if (file.type === 'image/jpeg') return 'image/jpeg'
  if (file.type === 'image/png') return 'image/png'
  if (file.type === 'image/webp') return 'image/webp'
  return null
}

/** Presign → PUT → patch campaign cover (after draft exists). */
export async function uploadBrandCampaignCover(campaignId: string, file: File): Promise<void> {
  const contentType = contentTypeForCoverFile(file)
  if (!contentType) {
    throw new Error('Cover must be a JPEG, PNG, or WebP image.')
  }

  const presign = await postUploadPresign({
    purpose: 'campaign_cover',
    contentType,
    campaignId,
  })

  const uploadRes = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: presign.headers,
    body: file,
  })
  if (!uploadRes.ok) {
    throw new Error(
      'Cover upload failed. Configure R2 bucket CORS for browser PUT from your app origin, or save without a cover.'
    )
  }

  await patchBrandCampaign(campaignId, { coverImageObjectKey: presign.objectKey })
}

export type BrandSubmitCampaignCreateInput = {
  body: CreateBrandCampaignBody
  coverFile: File | null
  checkout?: { grossAmount: number }
  /** Reuse an existing draft instead of POST /brands/campaigns again. */
  existingCampaignId?: string
}

export type BrandSubmitCampaignCreateResult = {
  campaign: BrandCampaignDetailDto
  checkoutUrl?: string
}

/** Create or update draft → optional cover upload → optional checkout session. */
export async function submitBrandCampaignCreate(
  input: BrandSubmitCampaignCreateInput
): Promise<BrandSubmitCampaignCreateResult> {
  let campaign: BrandCampaignDetailDto
  if (input.existingCampaignId) {
    const { campaign: updated } = await patchBrandCampaign(
      input.existingCampaignId,
      bodyToPatchBody(input.body)
    )
    campaign = updated
  } else {
    const { campaign: created } = await createBrandCampaign(input.body)
    campaign = created
  }

  if (input.coverFile) {
    try {
      await uploadBrandCampaignCover(campaign.id, input.coverFile)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Cover upload failed.'
      throw new CampaignSubmitError(message, { campaignId: campaign.id, stage: 'cover' })
    }
  }

  if (!input.checkout) {
    return { campaign }
  }

  try {
    const checkout = await createBrandCampaignCheckout(campaign.id, {
      grossAmount: input.checkout.grossAmount,
      intent: 'initial_publish',
    })
    return { campaign, checkoutUrl: checkout.checkoutUrl }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not start checkout.'
    throw new CampaignSubmitError(message, { campaignId: campaign.id, stage: 'checkout' })
  }
}
