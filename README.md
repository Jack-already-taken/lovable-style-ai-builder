# BuilderKit — AI web-app builder MVP

A Vite + React application that implements the original prompt-to-app checklist with an original UI. Users authenticate with Clerk, generate and revise static sites through Anthropic, edit the result in a split preview/code workspace, store project history in Supabase, and optionally subscribe through Stripe, deploy generated sites to Vercel, or export code to GitHub.

## Architecture

### Frontend

- Landing and pricing pages
- Clerk modal sign-up/sign-in
- Project/prompt sidebar
- Design preview on the left
- Editable HTML/CSS/JavaScript on the right
- Project history and deployment/export links

### Backend

All secrets stay in Vercel Functions under `/api`.

| Route | Purpose |
|---|---|
| `GET /api/health` | Shows which service integrations are configured without exposing secrets |
| `GET/POST /api/projects` | List or create user projects |
| `GET/PATCH/DELETE /api/project?id=...` | Read, rename, or delete an owned project |
| `POST /api/generate` | Authenticate, check access, call Anthropic structured outputs, and save code/history |
| `POST /api/save` | Save manual code edits and create a history snapshot |
| `GET /api/history` | Read generation history, optionally filtered by project |
| `GET /api/billing-status` | Return subscription and daily usage state |
| `POST /api/checkout` | Create Stripe subscription Checkout session |
| `POST /api/billing-portal` | Open Stripe customer portal |
| `POST /api/stripe-webhook` | Verify Stripe events and synchronize subscription state |
| `POST /api/deploy` | Deploy stored static files through the Vercel Deployments API |
| `POST /api/export-github` | Demo export into a server-owned GitHub account/repository |

## Generated app format

The current MVP deliberately generates three dependency-free files:

```text
index.html
styles.css
script.js
```

This makes browser preview and static deployment reliable. It does not yet generate arbitrary npm/Vite projects.

## Requirements

- Node.js 22.12+ or Node.js 24
- npm
- Clerk development application
- Anthropic Developer Platform API key and supported structured-output model
- Supabase project
- Vercel account for full local/API testing

Stripe, generated-app Vercel deployment, GitHub export, Namecheap, and DigitalOcean are not required for the first core test.

## 1. Install and verify

Windows PowerShell:

```powershell
npm.cmd ci
npm.cmd run build
```

The repository includes `.npmrc` and a public-registry `package-lock.json`, so installs should use `https://registry.npmjs.org/`.

## 2. Create local environment file

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

Minimum core-testing variables:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_APP_URL=http://localhost:3000

CLERK_SECRET_KEY=sk_test_...
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=your-supported-model-id
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

DAILY_GENERATION_LIMIT=10
ENABLE_BILLING_ENFORCEMENT=false
```

Never prefix server secrets with `VITE_`.

## 3. Create the database

In Supabase:

1. Open **SQL Editor**.
2. Run `supabase/schema.sql`.
3. Confirm these tables exist:
   - `projects`
   - `generations`
   - `billing_customers`

This MVP uses the service-role key only inside authenticated API routes. It does not expose Supabase directly to the browser.

## 4. Run the complete app locally

```powershell
npx.cmd vercel login
npx.cmd vercel dev --listen 3000
```

Open `http://localhost:3000`.

`npm run dev` runs only the Vite frontend. Use `vercel dev` for the `/api` functions.

## 5. Core test sequence

1. Open `/api/health` and confirm Clerk, Anthropic, and Supabase are `true`.
2. Create a Clerk account and sign in.
3. Open the Builder.
4. Generate a small site.
5. Apply a follow-up prompt.
6. Edit one source file manually and click **Save**.
7. Open History and reopen the project.
8. Verify the project and generation rows in Supabase.

A useful first prompt:

```text
Create a modern SaaS landing page for a GPU marketplace with a hero,
three feature cards, pricing, and a responsive navigation bar.
```

## 6. Vercel Preview deployment

Push the repository to a personal GitHub repository and import it into Vercel.

Settings:

```text
Framework preset: Vite
Install command: npm ci
Build command: npm run build
Output directory: dist
Root directory: directory containing package.json
```

Add the core environment variables to **Preview**, redeploy, and test the generated `vercel.app` URL before configuring a custom domain.

## 7. Stripe sandbox setup

Optional until the core builder works.

1. Create a Stripe sandbox product and recurring `$20/month` Price.
2. Set:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. Register `/api/stripe-webhook` for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Test Checkout and the customer portal.
5. Only then set:

```env
ENABLE_BILLING_ENFORCEMENT=true
```

When enforcement is false, signed-in users are controlled by `DAILY_GENERATION_LIMIT` instead.

## 8. Deploy generated sites to Vercel

Optional environment variables:

```env
VERCEL_API_TOKEN=
VERCEL_TEAM_ID=
VERCEL_GENERATED_PROJECT_PREFIX=builderkit
VERCEL_GENERATED_TARGET=preview
```

The **Deploy** button publishes the three stored files as a separate static Vercel deployment and stores the returned URL in Supabase.

## 9. GitHub export

The included implementation is appropriate for a private demo where all exports go to one controlled GitHub account.

```env
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_OWNER_TYPE=user
GITHUB_API_VERSION=2022-11-28
```

The token needs repository creation/access plus Contents write permission. Replace this server-owned token flow with a GitHub App or per-user OAuth before a public multi-user launch.

## 10. Namecheap DNS

After the Vercel Preview works:

1. Add the custom domain in Vercel.
2. Copy the exact A, CNAME, and/or TXT records Vercel displays.
3. Add them in Namecheap → Domain List → Manage → Advanced DNS.
4. Remove conflicting records for the same host.
5. Add the final domain in Clerk and update `VITE_APP_URL`.
6. Update Stripe webhook/return URLs.

## Security and operating notes

- Anthropic, Clerk secret, Stripe, Supabase service role, Vercel token, and GitHub token are server-only.
- Claude output is constrained with a Zod structured-output schema.
- Preview code runs inside a sandboxed iframe.
- API queries always filter projects by the authenticated Clerk user ID.
- Daily generation limiting is implemented for demo cost control.
- `npm audit --omit=dev` reports zero production dependency vulnerabilities at the time this repository was built.
- Do not run `npm audit fix --force` without reviewing breaking dependency changes.

See `IMPLEMENTATION_CHECKLIST.md` for the requirement-by-requirement status.
