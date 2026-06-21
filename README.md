# BuilderKit AI — Lovable-style AI Web App Builder Skeleton

A GitHub-ready MVP skeleton for an AI web app builder. It is inspired by the product pattern of prompt-to-app tools, but it uses original branding and UI.

## Stack

- Frontend: Vite + React + TypeScript
- Auth: Clerk React SDK (`@clerk/react`)
- AI generation: Anthropic TypeScript SDK, called server-side only
- Payments: Stripe Checkout subscription, $20/mo price placeholder
- Database: Supabase Postgres
- Server: Vercel Serverless Functions in `/api`
- Deploy: Vercel, with optional Namecheap custom domain

## Features included

- Landing page
- Pricing page with Stripe Checkout button
- Clerk sign up / login
- Auth-protected `/app` builder
- Prompt input panel
- Live preview iframe
- Code panel for generated `index.html`, `styles.css`, `script.js`
- Supabase project and generation history
- Stripe webhook skeleton for subscription status
- Vercel deployment config
- Supabase schema

## 1. Install

```bash
npm install
cp .env.example .env.local
npm run build
npx vercel dev --listen 3000
```

On Windows PowerShell:

```powershell
npm install
Copy-Item .env.example .env.local
npm run build
npx vercel dev --listen 3000
```

Open `http://localhost:3000`. Node.js 22 is the supported runtime for this repository.

Vite alone can run the frontend, but the full demo needs the `/api` functions. Use `npx vercel dev --listen 3000` for normal development.

## 2. Environment variables

Set these locally and in Vercel project settings:

```bash
VITE_CLERK_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=

CLERK_SECRET_KEY=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
```

Never expose `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, or `CLERK_SECRET_KEY` in browser code.

## 3. Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy project URL and anon key to frontend env.
5. Copy service role key to server-only env.

## 4. Clerk

1. Create a Clerk application.
2. Copy the publishable key to `VITE_CLERK_PUBLISHABLE_KEY`.
3. Copy the secret key to `CLERK_SECRET_KEY`.
4. Add your deployed domain and localhost as allowed origins if needed. The frontend uses the current `@clerk/react` SDK.

## 5. Anthropic

1. Create an Anthropic API key.
2. Set `ANTHROPIC_API_KEY` server-side.
3. Set `ANTHROPIC_MODEL` to the current coding-capable model you want to use.
4. Keep generation inside `/api/generate.ts`; do not call Anthropic directly from the browser.

## 6. Stripe

1. Create a product: `Builder Pro`.
2. Create a recurring price: `$20/month`.
3. Copy the price ID to `STRIPE_PRICE_ID`.
4. Add webhook endpoint: `https://yourdomain.com/api/stripe-webhook`.
5. Subscribe to at least:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

## 7. Deploy to Vercel

```bash
npm run build
npx vercel
npx vercel --prod
```

Set Clerk, Anthropic, and Supabase variables before testing generation. Stripe variables are optional until checkout testing. The AI generation function is configured for a maximum duration of 300 seconds.

## 8. Namecheap DNS checklist

In Namecheap:

1. Domain List → Manage → Advanced DNS.
2. Add the records Vercel shows in Project Settings → Domains.
3. Usually:
   - Apex/root domain uses an `A` record.
   - `www` or other subdomains use a `CNAME` record.
   - Domain verification uses a `TXT` record when Vercel asks for one.
4. Remove conflicting records for the same host.
5. Wait for DNS propagation.

Use the exact DNS values shown in Vercel because Vercel may provide project-specific targets.

## 9. Next TODOs

- Add subscription enforcement in `/api/generate.ts`.
- Add GitHub export with a GitHub App or OAuth flow.
- Add Monaco editor for richer code editing.
- Add project rename/delete.
- Add template gallery.
- Add deployment of generated apps as separate Vercel projects.
- Add safer model output validation and repair retries.
