create extension if not exists pgcrypto;

create type public.app_role as enum ('super_admin','admin','team_member','client');
create type public.client_status as enum ('lead','onboarding','active','paused','completed','archived');
create type public.service_status as enum ('upcoming','active','paused','completed','cancelled');

create table public.profiles (
  id uuid primary key default gen_random_uuid(), user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text not null, email text not null, avatar_url text, role public.app_role not null default 'client',
  phone text, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.clients (
  id uuid primary key default gen_random_uuid(), company_name text not null, slug text unique not null, logo_url text,
  website text, industry text, contact_name text, contact_email text, contact_phone text, account_manager_id uuid references public.profiles(id),
  start_date date, status public.client_status not null default 'lead', package_name text, monthly_fee numeric, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.client_members (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade, client_role text not null default 'member',
  is_primary boolean not null default false, created_at timestamptz not null default now(), unique(client_id, profile_id)
);
create table public.services (
  id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, description text, icon text,
  is_active boolean not null default true, display_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.client_services (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict, start_date date not null default current_date, end_date date,
  status public.service_status not null default 'active', monthly_fee numeric, progress integer not null default 0 check(progress between 0 and 100), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(client_id, service_id)
);

insert into public.services(name,slug,display_order) values ('SEO','seo',1),('Social Media Marketing','social-media',2),('Meta Ads','meta-ads',3),('Google Ads','google-ads',4),('Website Development','website-development',5) on conflict (slug) do nothing;
create index client_members_profile_idx on public.client_members(profile_id);
create index client_services_client_idx on public.client_services(client_id);

create or replace function public.current_profile() returns public.profiles language sql stable security definer set search_path = public as $$ select * from public.profiles where user_id = auth.uid() limit 1 $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.profiles where user_id=auth.uid() and role in ('super_admin','admin','team_member') and is_active) $$;
create or replace function public.is_client_member(target_client uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.client_members cm join public.profiles p on p.id=cm.profile_id where cm.client_id=target_client and p.user_id=auth.uid() and p.is_active) $$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_members enable row level security;
alter table public.services enable row level security;
alter table public.client_services enable row level security;
create policy profiles_self_or_admin on public.profiles for select using (user_id=auth.uid() or public.is_admin());
create policy profiles_admin_write on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy clients_member_or_admin on public.clients for select using (public.is_admin() or public.is_client_member(id));
create policy clients_admin_write on public.clients for all using (public.is_admin()) with check (public.is_admin());
create policy memberships_self_or_admin on public.client_members for select using (public.is_admin() or profile_id=(select id from public.profiles where user_id=auth.uid()));
create policy memberships_admin_write on public.client_members for all using (public.is_admin()) with check (public.is_admin());
create policy services_authenticated_read on public.services for select to authenticated using (is_active or public.is_admin());
create policy services_admin_write on public.services for all using (public.is_admin()) with check (public.is_admin());
create policy client_services_member_or_admin on public.client_services for select using (public.is_admin() or public.is_client_member(client_id));
create policy client_services_admin_write on public.client_services for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles(user_id,full_name,email) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','Client'),new.email); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
