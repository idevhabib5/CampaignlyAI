# Campaignly.AI — Functional POC

AI-powered SaaS proof of concept for automating Meta (Facebook/Instagram) advertising, lead management, and WhatsApp nurturing — based on the attached project Scope of Work (FA23-BCS-045 / FA23-BCS-116).

## Product / POC overview

Campaignly.AI helps SMBs across fitness, ecommerce, real estate, beauty, healthcare, education, and local services:

1. Onboard a business (brand, industry, audience)
2. Generate AI Meta ad copy with compliance scoring
3. Deploy & manage campaigns (Meta Graph API — mocked)
4. Sync & manage leads
5. Nurture leads via WhatsApp AI and get conversion-ready alerts
6. Manage subscriptions (Stripe — mocked)
7. Operate the platform from an admin dashboard

This is a **working demonstrable POC**, not a wireframe prototype: forms, validation, persistence, role-based access, and end-to-end data flow are implemented.

## Implemented scope (by module)

| Module | Status |
|--------|--------|
| 1 Business Onboarding & Brand Setup | Implemented (multi-step, resume, AI tips, edit) |
| 2 AI Advertisement & Content Generation | Implemented (mock RAG + compliance) |
| 3 AI Media Editing & Creative Automation | Partial (upload, brand flag, captions, placements — mock S3) |
| 4 Meta Campaign Automation | Implemented (mock OAuth, deploy, pause/activate/stop, sync, duplicate) |
| 5 Lead Management System | Implemented (sync, search/filter, detail, status) |
| 6 WhatsApp Lead Nurturing | Implemented (AI replies, scoring, takeover, alerts) |
| 7 Subscription & Billing | Implemented (plans, mock checkout/portal/webhook) |
| 8 Admin Dashboard | Implemented (users, metrics, Meta health, jobs, enquiries) |
| 9 Marketing Website | Implemented (landing, pricing, diagnostic, about, contact, privacy, terms) |
| 10 Authentication & User Management | Implemented (email/password + JWT cookies, roles) |

**Not in POC (per scope limits or deferred):** Google OAuth, real OpenAI/Pinecone, real Meta/Stripe/WhatsApp/S3, Redis/BullMQ workers, AWS deploy, blog CMS, advanced A/B testing (LI-4).

## Architecture

```
Next.js 15 (App Router)
├── Marketing pages (/ , /pricing, /diagnostic, ...)
├── Auth (/login, /register)
├── Onboarding wizard (/onboarding)
├── Owner dashboard (/dashboard/*)
├── Admin ops (/admin)
└── REST API routes (/api/*)
       ├── Prisma ORM + SQLite (POC)
       └── Service abstractions (AI, Meta, Stripe, WhatsApp, Media)
```

**Assumption:** Scope targets Express + MongoDB + separate Next.js dashboard + Vite marketing site. For a zero-config stakeholder demo, this POC consolidates into one Next.js app with SQLite. Service interfaces are isolated so production can split into Express + MongoDB and swap mocks for real SDKs.

## Tech stack

- Next.js 15, React 19, TypeScript, Tailwind CSS
- Prisma + SQLite (production target: MongoDB/Mongoose)
- JWT sessions (`jose`) + bcrypt password hashing
- Zod validation
- Lucide icons

## Installation

```bash
npm install
cp .env.example .env
npm run setup
```

`npm run setup` pushes the schema and seeds demo data.

## Environment variables

See `.env.example`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma SQLite path (`file:./dev.db`) |
| `JWT_SECRET` | Session signing secret |
| `NEXT_PUBLIC_APP_URL` | App URL |
| `USE_MOCK_*` | Flags documenting mock mode (services are mock by default) |

Optional real keys (`OPENAI_API_KEY`, `META_*`, `STRIPE_*`) are unused until mocks are replaced.

## Database setup

```bash
npm run db:push      # apply schema
npm run db:seed      # seed demo data
npm run db:reset     # wipe + reseed
```

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Business owner (full demo data) | `owner@fitstudio.demo` | `demo1234` |
| Admin | `admin@campaignly.ai` | `demo1234` |
| Incomplete onboarding | `newbie@demo.com` | `demo1234` |

## How to run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production-like:

```bash
npm run build
npm start
```

## Core user journeys (demo script)

### Owner journey (Priority 1)

1. Log in as `owner@fitstudio.demo` / `demo1234`
2. **Overview** — see metrics, campaigns, conversion-ready notification
3. **Ad Generator** — generate new AI ad variations + compliance score
4. **Campaigns** — deploy creative to Meta (mock), pause/activate, sync metrics
5. **Leads** — search/filter, open detail, **Refresh from Meta**
6. **WhatsApp AI** — simulate lead replies, watch score rise, conversion-ready alert; try manual takeover
7. **Billing** — switch plans via mock Stripe checkout
8. **Media / Meta Connect** — upload mock assets; reconnect Meta OAuth

### New user journey

1. Register → onboarding wizard (4 steps) → dashboard

### Admin journey

1. Log in as `admin@campaignly.ai`
2. Open `/admin` — platform metrics, user plan actions, enquiries, Meta health

### Marketing

1. Landing → Pricing → Campaign diagnostic → Contact enquiry (visible in admin)

## Implemented integrations

Service interfaces live under `src/lib/services/`:

| Integration | File | POC behavior |
|-------------|------|--------------|
| AI / RAG / Bradley Filter | `ai.ts` | Industry templates + mock RAG insights + compliance notes |
| Meta Graph API | `meta.ts` | Mock OAuth accounts/pages, deploy, metric sync, health |
| Stripe | `stripe.ts` | Mock checkout session + portal + webhook apply |
| WhatsApp agent | `whatsapp.ts` | Intent scoring, replies, conversion readiness |
| AWS S3 / media | `media.ts` | Mock upload URLs + placement presets |

## Mocked integrations

All external services above are **explicitly mocked**. Comments in each service file mark them as mocks. No API keys are required to demo.

## Known limitations

- SQLite instead of MongoDB; single Next.js process instead of Express + Redis/BullMQ
- Media “upload” does not store binary files (placeholder URLs)
- Lead “encryption” is not production-grade crypto (scope FE-3 deferred)
- Google OAuth, email password-reset, and real WhatsApp webhooks not wired
- Subscription feature gating is soft (plan displayed; hard locks minimal)
- Meta approval cannot be guaranteed (LI-2) — mocked as `PENDING_REVIEW` then activatable

## Assumptions (ambiguous scope)

1. **Single web app** is acceptable for POC vs three deployables.
2. **SQLite** is acceptable locally; schema maps cleanly to future Mongo collections.
3. **Fitness-seeded demo** represents multi-industry capability (generator is industry-aware).
4. **“Bradley Filter”** interpreted as a compliance scoring/policy checklist layer over generated ads.
5. **Video editing** reduced to mock captions/brand flags/placement metadata rather than a full editor.

## Recommended next steps toward production

1. Split API into Express service; adopt MongoDB + Mongoose
2. Wire OpenAI + Pinecone RAG with real Meta policy corpus
3. Implement Meta OAuth + Marketing API campaign create
4. Stripe Checkout + webhooks with real price IDs
5. WhatsApp Business Cloud API + BullMQ follow-up jobs
6. S3 uploads + real media processing pipeline
7. Harden PII encryption, RBAC, audit logs, and CI/CD (Docker/AWS)

## Project structure (high level)

```
prisma/                 schema + seed
src/app/                pages + API routes
src/components/         UI shells
src/lib/auth.ts         JWT auth
src/lib/db.ts           Prisma client
src/lib/services/       mockable integrations
```

## License / academic note

Built as a functional POC for academic demonstration of the Campaignly.AI scope. Not a commercial release.
