create type public.ad_platform as enum ('meta','google');
create table public.seo_snapshots (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  period_start date not null, period_end date not null, organic_users integer, organic_sessions integer, organic_clicks integer,
  impressions integer, conversions integer, backlinks integer, referring_domains integer, domain_authority numeric, notes text,
  created_at timestamptz not null default now(), unique(client_id,period_start,period_end)
);
create table public.seo_keywords (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  keyword text not null, target_url text, current_position numeric, previous_position numeric, search_volume integer, status text,
  updated_at timestamptz not null default now()
);
create table public.ad_platform_accounts (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  platform public.ad_platform not null, account_name text not null, external_account_id text, status text not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.marketing_performance (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  platform public.ad_platform not null, period_start date not null, period_end date not null, spend numeric default 0, impressions bigint default 0,
  reach bigint, clicks bigint default 0, link_clicks bigint, conversions numeric default 0, revenue numeric, leads integer, purchases integer,
  cpc numeric, cpm numeric, ctr numeric, cpa numeric, roas numeric, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(client_id,platform,period_start,period_end)
);
create table public.campaign_performance (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  platform public.ad_platform not null, campaign_external_id text, campaign_name text not null, status text not null default 'active', objective text,
  period_start date not null, period_end date not null, spend numeric default 0, impressions bigint default 0, clicks bigint default 0,
  conversions numeric default 0, revenue numeric, leads integer, purchases integer, cpc numeric, ctr numeric, cpa numeric, roas numeric, created_at timestamptz not null default now()
);
create table public.social_accounts (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  platform text not null, username text not null, account_url text, external_account_id text, created_at timestamptz not null default now()
);
create table public.social_performance (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  platform text not null, period_start date not null, period_end date not null, followers integer default 0, follower_change integer default 0,
  reach bigint default 0, impressions bigint default 0, engagements bigint default 0, engagement_rate numeric default 0, profile_visits integer,
  website_clicks integer, posts_published integer, reels_published integer, stories_published integer, created_at timestamptz not null default now(), unique(client_id,platform,period_start,period_end)
);

create index seo_snapshots_client_period_idx on public.seo_snapshots(client_id,period_end desc);
create index seo_keywords_client_idx on public.seo_keywords(client_id);
create index marketing_performance_client_period_idx on public.marketing_performance(client_id,platform,period_end desc);
create index campaign_performance_client_idx on public.campaign_performance(client_id,platform);
create index social_performance_client_period_idx on public.social_performance(client_id,period_end desc);

alter table public.seo_snapshots enable row level security; alter table public.seo_keywords enable row level security; alter table public.ad_platform_accounts enable row level security;
alter table public.marketing_performance enable row level security; alter table public.campaign_performance enable row level security; alter table public.social_accounts enable row level security; alter table public.social_performance enable row level security;
create policy seo_snapshots_member_read on public.seo_snapshots for select using (public.is_admin() or public.is_client_member(client_id));
create policy seo_snapshots_admin_write on public.seo_snapshots for all using (public.is_admin()) with check (public.is_admin());
create policy seo_keywords_member_read on public.seo_keywords for select using (public.is_admin() or public.is_client_member(client_id));
create policy seo_keywords_admin_write on public.seo_keywords for all using (public.is_admin()) with check (public.is_admin());
create policy ad_accounts_member_read on public.ad_platform_accounts for select using (public.is_admin() or public.is_client_member(client_id));
create policy ad_accounts_admin_write on public.ad_platform_accounts for all using (public.is_admin()) with check (public.is_admin());
create policy marketing_member_read on public.marketing_performance for select using (public.is_admin() or public.is_client_member(client_id));
create policy marketing_admin_write on public.marketing_performance for all using (public.is_admin()) with check (public.is_admin());
create policy campaigns_member_read on public.campaign_performance for select using (public.is_admin() or public.is_client_member(client_id));
create policy campaigns_admin_write on public.campaign_performance for all using (public.is_admin()) with check (public.is_admin());
create policy social_accounts_member_read on public.social_accounts for select using (public.is_admin() or public.is_client_member(client_id));
create policy social_accounts_admin_write on public.social_accounts for all using (public.is_admin()) with check (public.is_admin());
create policy social_member_read on public.social_performance for select using (public.is_admin() or public.is_client_member(client_id));
create policy social_admin_write on public.social_performance for all using (public.is_admin()) with check (public.is_admin());
