# Tech stack & integrations

**Scope:** Stack, **API trust boundary**, TikTok/Meta **for ownership + submit-time fetch + rule check** (not general social features), **liveness** jobs. Creator UX: [Creator flow](03-creator-flow.md).

---

## Tech stack (MVP)

| Layer | Choices |
|--------|-----------|
| **Frontend** | React 19, Vite, TypeScript, React Router · Tailwind · shadcn/ui · TanStack Query · Zustand · React Hook Form + Zod · Axios |
| **Auth** | Supabase Auth (sessions / JWT) |
| **Database** | Supabase-hosted PostgreSQL; Prisma migrations from the **API** (Prisma ORM on same Postgres) |
| **Files** | Cloudflare R2 (S3-compatible), **private** objects; **presigned** URLs from API |
| **Backend** | Node.js, Express, Prisma, Zod, helmet, CORS, rate limiting, Winston, Jest, ESLint/Prettier — domain logic, webhooks (Xendit, etc.), scheduled/queued **jobs**, **TikTok** & **Meta** OAuth + submit fetch + liveness |
| **Payments** | Xendit — **xenPlatform Owned sub-account per brand** (created on **first successful campaign fund**); **money-in** and **Disbursements** scoped with **`for-user-id`**; **no cross-brand** settlement; campaign splits + references in **app ledger + API metadata** ([Xendit xenPlatform](01-business-model.md#xendit-xenplatform-per-brand)); **monthly** creator payouts **after** brand **confirms** batch ([Monthly payout](01-business-model.md#4-monthly-payout)) |

---

## API trust boundary (**no RLS for app traffic**)

| Rule | Detail |
|------|--------|
| **Express = boundary** | Our **SPA** talks to **Express** for app data. We **don’t** use Postgres RLS as the main security for those routes; our API DB user may **bypass RLS**. |
| **No PostgREST to browser for app tables** | Campaigns, submissions, ledgers, payouts, etc. — **not** exposed via Supabase PostgREST to the browser. Supabase = **Auth** (and only exceptions we document). |
| **Every route** | Verify JWT; **role** Brand vs Creator when needed ([Access](02-auth-and-signin.md#user-access-and-identity-both-roles)); **own** the resource (brand’s campaign, creator’s submission). Tester/internal tools: same Express (or separate hardened service), not open PostgREST. |
| **Writes** | Zod validation. **HTTP:** Helmet, CORS allowlist for SPA origin, rate limits on auth/sensitive routes. |
| **DB roles** | Migration role vs **runtime** API role — least privilege. |

**Also:** R2 for campaign assets; metadata and presigned URLs from the API. **Webhooks:** signed payloads; handlers **safe to run twice** without double-crediting ([Critical paths](06-policies-and-trust.md#critical-paths)).

---

## TikTok and Meta integration

In the product, TikTok/Meta are **not** general social features — they are how we **verify** submissions:

1. **Ownership** — the platform API tells us who authored the post; we match that to the **connected account** so we know the submitter controls that URL.
2. **Legitimacy + rules** — we read real post metadata (caption, media signals we use, etc.) to **auto-check** campaign rules; we do **not** trust user-typed stats.
3. **Submit-time snapshot** — views/engagement come from the API **at submit** and are **locked** there; liveness later only checks the post stayed **public** ([retention](03-creator-flow.md#content-retention)).

**How it runs:** creators **connect once per platform** (OAuth). That gives our **backend** tokens to call TikTok/Meta **as them** when they paste a link. The [Submit-time pipeline](#submit-time-pipeline) below does normalize URL → fetch → ownership → eligibility → rule check → snapshot. Creator UX detail: [Creator flow — Connect TikTok and Meta](03-creator-flow.md#connect-tiktok-and-meta).

**Implementation (short):** Persist one row per `(creator, platform)` with stable **`platform_user_id`**, **encrypted** access/refresh tokens (never to the SPA), **scopes**, timestamps, and **status** (`healthy` / `reconnect_required` / `revoked`). **Connect** = OAuth code exchange → store. **Refresh** = job before expiry; on failure → reconnect prompt and **block new submits** on that platform. **Revoke/disconnect** → block new submits; keep **liveness** jobs for **included**-unpaid posts until retention ends. **Reconnect** = same flow; keep ids stable where the provider allows.

### Submit-time pipeline

Synchronous (UI shows loading):

1. **Normalize** URL → canonical post id (platform rules).
2. **Fetch** post with creator token: author id, views, likes, comments, shares/saves if available, publish date.
3. **Ownership** — author id **=** stored **`platform_user_id`**; else hard-block (*not from the connected account*).
4. **Eligibility** — public; publish date ≥ campaign active (± grace if we allow); not duplicate `(campaign, canonical id)`.
5. **Rule check** — pass / soft_flag / hard_block + reasons.
6. **Snapshot** — persist views, likes, comments, shares, `captured_at` on submission row; persist **TikTok yellow basket** boolean when platform is TikTok ([Creator flow](03-creator-flow.md#tiktok-yellow-basket-submit)).
7. **Estimate** — gross from campaign rate; creator-facing headline uses **default** **80%** net on gross unless product chooses to reflect yellow-basket **50%** for preview on that row only — return to modal.

Creator confirms **Submit** → snapshot final → `pending_brand_review`. **No** ongoing polling for **payout** (pay is not tied to growth).

### Content liveness checks (replaces the old metrics polling)

Pay does not use post-submit view growth. We **do** need to know the post stayed **public** through [retention](03-creator-flow.md#content-retention).

| Item | Rule |
|------|------|
| **Job** | e.g. daily, per **included** submission, until retention window ends |
| **Probe** | Can the URL still be read as a **public** post by the **same** author? |
| **If not** | Void submission; return reserved gross to **available** |
| **Rate limits** | Backoff, queue, spread calls |
| **False negative** | Transient errors → retry with backoff before void; document threshold (e.g. **N** fails over **M** hours ⇒ void) |

### Security and compliance

- Tokens: encrypted at rest; not in logs; not to browser.
- **Scopes:** minimum for profile + content read; disclose in Terms / UI.
- Provider **webhooks** (if we use them): signed; **ignore duplicate delivery**; same discipline as Xendit.
- **App review:** TikTok/Meta need review for read scopes — we plan **lead time** before launch that depends on live fetch.

### MVP contract

| # | Contract |
|---|----------|
| 1 | One **durable** OAuth per creator per platform |
| 2 | **Reuse** for all submits — no per-campaign login |
| 3 | **[Platforms](04-brand-flow.md#campaign-fields)** gate allowed channel |
| 4 | **Submit fetch** = source of truth for stats; **locked at submit** |
| 5 | **Liveness** = we only check posts stay public for retention, **not** recalculating pay from new views later |
| 6 | **Rule check** at submit → pass / soft-flag / hard-block |
