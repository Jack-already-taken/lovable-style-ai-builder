create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  clerk_user_id text not null,
  prompt text not null,
  files jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_customers (
  clerk_user_id text primary key,
  stripe_customer_id text unique,
  subscription_status text,
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_created_idx on public.projects (clerk_user_id, created_at desc);
create index if not exists generations_user_created_idx on public.generations (clerk_user_id, created_at desc);

alter table public.projects enable row level security;
alter table public.generations enable row level security;
alter table public.billing_customers enable row level security;

-- This skeleton uses SUPABASE_SERVICE_ROLE_KEY from serverless API routes.
-- Do not expose service-role keys in browser code.
-- Add RLS policies later if you want direct browser reads through the anon key.
