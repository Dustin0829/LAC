# PHC — Philippine Clippers

PHC is a clipping marketplace for Philippine creators. Brands launch campaigns, upload creative assets, and set a budget. Clippers create short-form clips from those assets and earn automatically based on verified views.

This repository is currently a **frontend-only mock prototype**. There is no backend, database, real authentication, real file storage, real view tracking, or real Xendit payment integration yet. All data is mocked in the browser through local state and seed data.

## Product Concept

PHC has two roles:

- **Brand Owner**: Creates campaigns, funds budgets, uploads assets, reviews submitted clips, and tracks campaign performance.
- **Clipper**: Browses active campaigns, downloads assets, posts clips on social platforms, submits clip URLs, and earns from views.

The core mechanic is simple:

```text
clipper earnings = verified views / 1,000 * clipper payout rate
```

There is no per-clip cap and no minimum view threshold in the current product direction. If a clip reaches 1 million views, the clipper earns based on all verified views.

## Current Mock Features

### Authentication and Onboarding

- Mock email/password sign-up and sign-in.
- Mock “Continue with Google”.
- Role selection after sign-up:
  - Clipper
  - Brand Owner
- Role switching from the user menu for demo purposes.

### Brand Owner Features

- Dashboard with campaign performance metrics.
- Campaign list and campaign detail pages.
- Create campaign flow with:
  - Campaign title and description.
  - Real cover image upload for campaign cards/detail pages.
  - Campaign asset uploads for clippers to use.
  - Platform and niche selection.
  - Budget and brand rate per 1,000 views.
- Campaign math panel showing:
  - Estimated reach.
  - Brand rate.
  - Total budget.
  - PHC budget fee.
  - Payout pool.
  - Cost per view.
- Submitted clips table with clear `Approve` and `Reject` buttons.

### Clipper Features

- Dashboard with earnings, views, recent clips, and hot campaigns.
- Campaign discovery with filters and sorting.
- Campaign detail page with:
  - Campaign info.
  - Payout rate shown to clippers.
  - Uploaded brand assets/resources.
  - Submit clip URL modal.
- My Clips page with clip status tracking.
- Earnings page with mocked payout/transaction history.
- Account page with mocked payout methods:
  - GCash
  - Maya
  - Bank transfer

### Mock Payment Behavior

Payouts are currently simulated. In the real product, payouts should be automatic, not manually requested by clippers. After a clip is approved and views are verified, the backend should calculate earnings and trigger payout through Xendit based on the clipper’s default payout method.

## PHC Revenue Model

PHC earns in two ways:

1. **Budget fee from brand campaigns**
   - PHC keeps a percentage of the total campaign budget.
   - Current mocked tiers:
     - Budget below `₱50,000`: PHC keeps `20%`.
     - Budget from `₱50,000` to `₱199,999`: PHC keeps `15%`.
     - Budget `₱200,000+`: PHC keeps `10%`.
   - The remaining amount becomes the campaign payout pool.

2. **Spread between brand rate and clipper payout rate**
   - Brands enter the gross rate per 1,000 views.
   - Clippers receive `80%` of that rate.
   - PHC keeps the remaining `20%` spread internally.
   - Example:
     - Brand rate: `₱10 / 1,000 views`.
     - Clipper payout: `₱8 / 1,000 views`.
     - PHC spread: `₱2 / 1,000 views`.

The UI does not expose the internal spread to clippers. Clippers only see the payout rate they can earn.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS v4
- Radix UI primitives
- Zustand
- Recharts
- Sonner
- Lucide React
- pnpm

## Project Structure

```text
src/
  App.tsx                         Route definitions
  main.tsx                        React entry point
  globals.css                     PHC theme, Tailwind setup, global utilities
  components/
    CampaignCard.tsx              Campaign card shared by brand/clipper pages
    ClipStatusBadge.tsx           Clip status UI
    PlatformIcon.tsx              TikTok/YouTube/IG/Facebook display
    StatCard.tsx                  Dashboard metric card
    guards/ProtectedRoute.tsx     Auth/role route guard
    layout/AppSidebar.tsx         Shared sidebar for both roles
    ui/                           Minimal local UI primitives
  layouts/
    BrandLayout.tsx
    ClipperLayout.tsx
    RootLayout.tsx
  lib/
    mockData.ts                   All mock campaigns, clips, assets, payment methods
    hooks/useAuth.ts
    stores/                       Zustand stores
    utils/                        Formatting and class helpers
  pages/
    auth/
    onboarding/
    brand/
    clipper/
```

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the Vite dev server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm run build
```

Run lint:

```bash
pnpm run lint
```

## Demo Flow

1. Open `/auth`.
2. Sign in with any email/password or use the mocked Google button.
3. Choose either `Clipper` or `Brand Owner`.
4. Explore the dashboards and switch roles from the avatar menu.

## Backend APIs Needed

The frontend is mock-only right now, but these are the backend APIs needed to make PHC production-ready.

### Auth APIs

- `POST /auth/register`
  - Create account with email/password.
  - Returns user, session token, and onboarding state.
- `POST /auth/login`
  - Login with email/password.
- `POST /auth/google`
  - Exchange Google OAuth token for PHC session.
- `POST /auth/logout`
  - Invalidate current session.
- `GET /auth/me`
  - Return current authenticated user, role, profile, and permissions.
- `PATCH /auth/role`
  - Set or update user role: `clipper` or `brand`.

### User and Profile APIs

- `GET /users/me`
  - Get user profile.
- `PATCH /users/me`
  - Update name, avatar, contact info.
- `GET /clippers/me`
  - Get clipper profile, payout readiness, stats.
- `PATCH /clippers/me`
  - Update clipper profile.
- `GET /brands/me`
  - Get brand owner profile and company data.
- `PATCH /brands/me`
  - Update brand/company profile.

### Campaign APIs

- `GET /campaigns`
  - Public/clipper campaign discovery.
  - Supports filters: platform, niche, status, search, sort.
- `GET /campaigns/:campaignId`
  - Get campaign detail.
- `POST /brand/campaigns`
  - Brand creates campaign.
  - Stores gross brand rate, computed clipper rate, platform fee, payout pool, budget, dates, platforms, niches, rules.
- `GET /brand/campaigns`
  - Brand lists owned campaigns.
- `GET /brand/campaigns/:campaignId`
  - Brand gets owned campaign detail with internal revenue fields.
- `PATCH /brand/campaigns/:campaignId`
  - Update campaign info/status.
- `POST /brand/campaigns/:campaignId/pause`
  - Pause campaign.
- `POST /brand/campaigns/:campaignId/resume`
  - Resume campaign.
- `POST /brand/campaigns/:campaignId/close`
  - Close campaign and trigger refund calculation.

### Campaign Asset APIs

- `POST /brand/campaigns/:campaignId/assets`
  - Request signed upload URL or upload campaign assets.
  - Supports videos, images, PDFs, ZIP files, scripts, and brand guidelines.
- `GET /campaigns/:campaignId/assets`
  - Clippers fetch downloadable campaign assets.
- `DELETE /brand/campaigns/:campaignId/assets/:assetId`
  - Brand removes asset.

Recommended production storage:

- Object storage such as S3, Cloudflare R2, Google Cloud Storage, or another signed-URL capable storage service.
- Backend should return signed upload URLs and signed download URLs when assets are private.

### Clip Submission APIs

- `POST /campaigns/:campaignId/clips`
  - Clipper submits posted clip URL.
  - Required fields: platform, URL, optional notes.
- `GET /clippers/me/clips`
  - Clipper views own submitted clips.
- `GET /brand/campaigns/:campaignId/clips`
  - Brand sees submitted clips for a campaign.
- `POST /brand/clips/:clipId/approve`
  - Brand approves a pending clip.
- `POST /brand/clips/:clipId/reject`
  - Brand rejects a pending clip with reason.
- `GET /clips/:clipId`
  - Get single clip detail.

### View Tracking APIs

- `POST /views/sync`
  - Internal job endpoint to sync clip views from TikTok, YouTube, Instagram, Facebook, or third-party data provider.
- `POST /webhooks/social/:provider`
  - Receive view/update webhook if provider supports it.
- `GET /clips/:clipId/views`
  - Return current verified view count and history.
- `GET /campaigns/:campaignId/performance`
  - Return campaign view, spend, payout, and ROI charts.

Important: view counts must be verified server-side. Do not trust view counts entered by clippers.

### Earnings and Payout APIs

- `GET /clippers/me/earnings`
  - Earnings summary: available, pending, paid, lifetime.
- `GET /clippers/me/transactions`
  - Payout and earnings transaction list.
- `POST /payouts/run`
  - Internal scheduled job to automatically pay approved/eligible earnings.
- `POST /webhooks/xendit/payouts`
  - Receive Xendit payout status events.
- `GET /payouts/:payoutId`
  - Payout detail/status.

Payouts should be automatic. Clippers should not need to manually withdraw.

### Payment Method APIs

- `GET /payment-methods`
  - List current user’s payout/funding methods.
- `POST /payment-methods`
  - Add GCash, Maya, or bank account.
- `PATCH /payment-methods/:paymentMethodId/default`
  - Set default payout/funding method.
- `DELETE /payment-methods/:paymentMethodId`
  - Remove method.
- `POST /payment-methods/:paymentMethodId/verify`
  - Verify account details if required by Xendit/bank flow.

### Brand Funding and Refund APIs

- `POST /brand/campaigns/:campaignId/funding/invoice`
  - Create Xendit invoice/payment link for campaign budget.
- `POST /webhooks/xendit/invoices`
  - Receive invoice paid/expired events.
- `GET /brand/campaigns/:campaignId/balance`
  - Return total budget, PHC fee, payout pool, spent amount, remaining amount, refundable amount.
- `POST /brand/campaigns/:campaignId/refunds`
  - Request or process refund when campaign closes.
- `GET /brand/refunds`
  - List brand refunds.

### Platform Revenue/Admin APIs

- `GET /admin/revenue`
  - PHC revenue summary: budget fees, per-view spread, refunds, payouts.
- `GET /admin/campaigns`
  - Platform-wide campaign monitoring.
- `GET /admin/users`
  - User management.
- `GET /admin/payouts`
  - Payout audit and reconciliation.
- `GET /admin/ledger`
  - Full ledger for accounting.

### Notification APIs

- `GET /notifications`
  - User notifications.
- `PATCH /notifications/:notificationId/read`
  - Mark as read.
- `POST /notifications/test`
  - Internal/dev endpoint for testing notifications.

Notifications needed:

- Campaign approved/paused/closed.
- Clip approved/rejected.
- Earnings updated.
- Payout sent/failed.
- Asset added to joined campaign.

## Suggested Backend Data Models

Core tables/collections:

- `users`
- `profiles`
- `brand_profiles`
- `clipper_profiles`
- `campaigns`
- `campaign_assets`
- `campaign_platforms`
- `campaign_niches`
- `clips`
- `clip_view_snapshots`
- `earnings_ledger`
- `payouts`
- `payment_methods`
- `campaign_funding`
- `refunds`
- `platform_revenue_ledger`
- `notifications`

## Production Notes

- All PHC revenue calculations must happen on the backend.
- The frontend should only display values returned by the API.
- Xendit secret keys must never be exposed to the browser.
- Social view verification must be server-side.
- Asset upload/download should use signed URLs.
- Payouts should be idempotent and ledger-backed to avoid duplicate payments.
- Store every balance movement in a ledger for auditability.

## Current Limitations

- Auth is local mock state.
- Campaigns/clips/assets are browser-only mock data.
- Uploaded files use temporary browser object URLs.
- Payouts are mocked and do not call Xendit.
- View counts are seeded mock values.
- Approve/reject actions currently show UI feedback but do not persist to a backend.
