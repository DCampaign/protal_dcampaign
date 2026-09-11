-- Access is restricted to the server API, which checks active admin membership.
create table if not exists public.smm_providers (
  id uuid primary key default gen_random_uuid(), name text not null,
  endpoint text not null, encrypted_key text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.smm_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.smm_providers(id),
  remote_id text not null, name text not null, category text not null,
  rate numeric not null check (rate >= 0), min integer not null check (min > 0),
  max integer not null check (max >= min), type text not null,
  unique(provider_id, remote_id)
);
create table if not exists public.smm_orders (
  id uuid primary key, service_id uuid not null references public.smm_services(id),
  link text not null, quantity integer not null check (quantity > 0),
  cost numeric not null, status text not null default 'Submitting',
  remote_id text, created_at timestamptz not null default now()
);
alter table public.smm_providers enable row level security;
alter table public.smm_services enable row level security;
alter table public.smm_orders enable row level security;
revoke all on public.smm_providers, public.smm_services, public.smm_orders from anon, authenticated;
grant all on public.smm_providers, public.smm_services, public.smm_orders to service_role;
