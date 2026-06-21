create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  name text not null,
  description text,
  files jsonb not null default '[]'::jsonb,
  last_prompt text,
  deployment_url text,
  github_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects add column if not exists description text;
alter table public.projects add column if not exists files jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists last_prompt text;
alter table public.projects add column if not exists deployment_url text;
alter table public.projects add column if not exists github_url text;

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  clerk_user_id text not null,
  prompt text not null,
  files jsonb not null,
  summary text,
  kind text not null default 'ai' check (kind in ('ai', 'manual')),
  model text,
  created_at timestamptz not null default now()
);

alter table public.generations add column if not exists summary text;
alter table public.generations add column if not exists kind text not null default 'ai';
alter table public.generations add column if not exists model text;

create table if not exists public.billing_customers (
  clerk_user_id text primary key,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text,
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.billing_customers add column if not exists stripe_subscription_id text unique;

create index if not exists projects_user_updated_idx on public.projects (clerk_user_id, updated_at desc);
create index if not exists generations_user_created_idx on public.generations (clerk_user_id, created_at desc);
create index if not exists generations_project_created_idx on public.generations (project_id, created_at desc);

alter table public.projects enable row level security;
alter table public.generations enable row level security;
alter table public.billing_customers enable row level security;

-- All access in this MVP goes through authenticated Vercel API functions using
-- SUPABASE_SERVICE_ROLE_KEY. Never expose the service-role key in VITE_* variables.
