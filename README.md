# Campaignly.AI — Full-Scope Demo Product

Complete SOW-aligned demo covering **all 10 modules** with **realistic mocks** (OpenAI, Meta, Stripe, WhatsApp, S3, Redis/BullMQ, Google OAuth). No paid API keys required.

Stack: **Next.js App Router + Prisma SQLite** (Vercel-capable). Service interfaces in `src/lib/services/*` can later swap to live APIs.

## End-to-end demo script (~12–15 minutes)

### Marketing & auth (Modules 9–10)
1. Open `/` — brand hero, how-it-works, testimonials/case studies.
2. Visit `/diagnostic` — submit the campaign diagnostic (stores result via `/api/marketing`).
3. Skim `/blog` — static posts list.
4. `/login` → **Continue with Google** (mock OAuth → `google.demo@campaignly.ai`) or sign in as owner.
5. Optional: **Forgot password** → copy in-app reset link → `/reset-password` → update password locally.

### Owner workspace (Modules 1–7)
6. Sign in: `owner@fitstudio.demo` / `demo1234`.
7. **Overview** — metrics + checklist.
8. **Ads** — pick a template from the gallery → Generate → review **RAG insights** + **Bradley Filter** panel → Deploy to campaign.
9. **Media** — real file upload → captions / Meta placements / brand / enhance / snippet / manual crop-trim (requires FFmpeg for video).
10. **Meta** — mock OAuth connect, select Page/ad account, reconnect/disconnect.
11. **Campaigns** — six objectives, attach media + creative, location confirm, placement preview, Bradley recheck, deploy/sync/pause.
12. **Leads** — campaign conversion table + activity timeline; **Refresh from Meta**.
13. **WhatsApp** — intent presets → scoring panel; click **Run follow-up jobs** (mock BullMQ tick).
14. **Billing** — plan cards, mock checkout/portal; soft gates on trial.
15. **Settings** — profile edit / plan badge.

### Admin (Module 8)
16. Sign in: `admin@campaignly.ai` / `demo1234` → `/admin`.
17. Review Meta health, job queue, AI usage, enquiries, referrals, high-performing ads, user plan actions.

Fresh path: **Register** → 3-step onboarding → same dashboard.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Owner (seeded fitness studio) | `owner@fitstudio.demo` | `demo1234` |
| Admin | `admin@campaignly.ai` | `demo1234` |
| Incomplete onboarding | `newbie@demo.com` | `demo1234` |
| Google mock (first click) | `google.demo@campaignly.ai` | (OAuth only) |

## Modules covered

| # | Module | UI path |
|---|--------|---------|
| 1 | Onboarding | `/onboarding`, Settings profile |
| 2 | AI Ads | `/dashboard/ads` (templates + RAG/Bradley) |
| 3 | Media | `/dashboard/media` (Sharp + FFmpeg + Whisper/local S3) |
| 4 | Meta Campaigns | `/dashboard/meta` + `/dashboard/campaigns` + Settings integrations |
| 5 | Leads | `/dashboard/leads` (analytics + activity) |
| 6 | WhatsApp | `/dashboard/whatsapp` (scoring + follow-up jobs) |
| 7 | Billing | `/dashboard/billing` |
| 8 | Admin | `/admin` |
| 9 | Marketing | `/`, `/pricing`, `/diagnostic`, `/blog`, contact/legal |
| 10 | Auth | Login, register, Google mock, password reset |

## Run locally

```bash
npm install
cp .env.example .env
npm run setup
npm run dev
```

Open http://localhost:3000

`npm run setup` typically runs Prisma generate, db push, and seed.

## Module 3 — hybrid media pipeline

| Capability | Implementation |
|------------|----------------|
| Upload (FE-1) | Multipart upload → local `public/uploads` or AWS S3 |
| Video trim (FE-2 / FE-9) | `fluent-ffmpeg` (system FFmpeg required) |
| Captions (FE-3) | OpenAI Whisper when `OPENAI_API_KEY` set; else Gemini/Groq tips or demo text + VTT |
| Meta resize (FE-4) | Sharp (images) / FFmpeg (video) |
| Brand kit (FE-5) | Business profile colors + logo overlay |
| Snippets (FE-6) | FFmpeg short clip |
| Library (FE-7) | Variants linked by `parentId`; delete removes storage |
| Enhance (FE-8) | Sharp normalize + sharpen |
| Manual edit (FE-9) | Crop ratios (images) / trim range (video) |

**Prerequisites for video:** install [FFmpeg](https://ffmpeg.org/download.html) and ensure it is on your PATH. Image workflows work without FFmpeg.

**Vercel note:** FFmpeg is not available on default Vercel serverless. Prefer local/`npm run dev` or an EC2-style host for full Module 3 video demos. Uploads and Sharp image actions can still work when file system / S3 is configured.

Set `USE_MOCK_S3=false` and fill AWS vars in `.env` to use real S3.

## Module 4 — hybrid Meta campaign automation

| Capability | Implementation |
|------------|----------------|
| Connect / reconnect / disconnect (FR-026, FR-036) | Persisted `MetaConnection`; mock OAuth; Settings + `/dashboard/meta` |
| Page & ad account select (FR-027) | Server rejects forged IDs not in the connected asset list |
| Six objectives + budget/schedule (FR-028) | Awareness, Traffic, Engagement, Leads, App promotion, Sales; daily or lifetime |
| Attach media + copy (FR-029) | Owned `MediaAsset` + `AdCreative`; cross-tenant attach rejected |
| Location confirm (FR-030) | Mock geocode from business profile; deploy blocked until confirmed |
| Special ad categories (FR-086) | Housing / Employment / Credit declarations; political rejected |
| Bradley recheck (FR-015 / BR-002) | Internal filter before Meta write; never claimed as Meta approval |
| Placement preview (FR-089) | Feed / Stories-Reels / Landscape preview in builder |
| Control (FR-033) | Pause / activate / stop after mock provider acknowledgement |
| Status + sync (FR-031, FR-034, FR-035) | Separate local vs Meta status; unavailable ≠ zero; failed sync keeps last snapshot |

Keep `USE_MOCK_META=true` for demos. Live Graph OAuth remains deferred until Meta app review.

Smoke: with `npm run dev` running, `npx tsx scripts/smoke-meta.ts`.

## Vercel

Environment variables:

- `DATABASE_URL` = `file:./dev.db`
- `JWT_SECRET` = long random string
- `NEXT_PUBLIC_APP_URL` = your Vercel URL

Build uses `vercel-build` (Prisma generate → db push → seed → next build). SQLite is seeded at build and copied to `/tmp` on serverless cold starts (writes are ephemeral).

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind · Prisma + SQLite · JWT auth (jose + bcrypt)

## Architecture

```
Next.js App Router
├── Marketing (/ , /pricing, /diagnostic, /blog, /contact, …)
├── Auth (email/password, mock Google, password reset)
├── Onboarding
├── Dashboard (Overview · Ads · Campaigns · Media · Leads · WhatsApp · Meta · Billing · Settings)
├── Admin (metrics · Meta health · jobs · AI usage · referrals · ads dataset)
└── /api/* + src/lib/services/* (mocks)
```

## Mocked integrations

| Service | File | Behavior |
|---------|------|----------|
| AI / RAG / Bradley | `src/lib/services/ai.ts` | Ad copy, variations, compliance |
| Meta Graph | `src/lib/services/meta.ts` | OAuth, deploy, control, sync, health (persisted MetaConnection) |
| WhatsApp | `src/lib/services/whatsapp.ts` | Intent/sentiment scoring, follow-ups |
| Stripe | `src/lib/services/stripe.ts` | Checkout, portal, webhooks stubs |
| Media / S3 | `src/lib/services/media/*` | Sharp + FFmpeg + Whisper; local or S3 storage |
| Jobs | WhatsApp + Admin | Mock BullMQ follow-up ticks |
| Google OAuth | `/api/auth` `action: google` | Creates/logs in demo Google user |

## Explicitly deferred

- Real Meta Graph OAuth, Stripe keys, WhatsApp Cloud API (still mocked)
- Real Redis/BullMQ workers for media (processing is synchronous in API)
- Express API + MongoDB split
- Full NLE / multi-track video editor

## Scope note

Based on the Campaignly.AI project proposal (FA23-BCS-045 / FA23-BCS-116). This full-scope demo proves every module’s UI and data flow against SQLite; production would replace mocks with live credentials and optional service split.
