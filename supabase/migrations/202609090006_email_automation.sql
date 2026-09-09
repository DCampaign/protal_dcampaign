-- Automated email marketing queue. This is intentionally limited to the
-- current Hostinger free-mail allowance: 100 messages in a rolling 24 hours.

create table public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  name text not null default 'Untitled campaign',
  subject text not null,
  html text not null,
  status text not null default 'scheduled' check (status in ('draft', 'scheduled', 'sending', 'completed', 'paused', 'failed')),
  batch_size integer not null default 25 check (batch_size between 1 and 25),
  interval_minutes integer not null default 30 check (interval_minutes >= 30),
  daily_limit integer not null default 100 check (daily_limit between 1 and 100),
  scheduled_at timestamptz,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.email_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  email text not null,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'unsubscribed')),
  attempts integer not null default 0,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, email)
);

create index email_campaigns_schedule_idx on public.email_campaigns(status, next_run_at);
create index email_recipients_campaign_status_idx on public.email_recipients(campaign_id, status);
create index email_recipients_sent_at_idx on public.email_recipients(sent_at) where status = 'sent';

alter table public.email_campaigns enable row level security;
alter table public.email_recipients enable row level security;

create policy email_campaigns_admin_access on public.email_campaigns for all
  using (public.is_admin()) with check (public.is_admin());
create policy email_recipients_admin_access on public.email_recipients for all
  using (public.is_admin()) with check (public.is_admin());

-- Claims a small number of recipients at once. The advisory lock prevents two
-- cron requests from selecting the same recipient while a batch is in flight.
create or replace function public.claim_email_recipients(max_batch integer default 25, rolling_daily_limit integer default 100)
returns table (id uuid, campaign_id uuid, email text, subject text, html text, interval_minutes integer)
language plpgsql security definer set search_path = public
as $$
declare
  sent_in_window integer;
  available integer;
begin
  perform pg_advisory_xact_lock(hashtext('dcampaign-email-automation'));
  select count(*) into sent_in_window from public.email_recipients
    where status = 'sent' and sent_at >= now() - interval '24 hours';
  available := greatest(least(max_batch, rolling_daily_limit - sent_in_window), 0);
  if available = 0 then return; end if;

  return query
  with selected as (
    select r.id
    from public.email_recipients r
    join public.email_campaigns c on c.id = r.campaign_id
    where r.status = 'queued'
      and c.status in ('scheduled', 'sending')
      and c.next_run_at <= now()
    order by c.next_run_at asc, r.created_at asc
    limit available
    for update of r skip locked
  ), claimed as (
    update public.email_recipients r
      set status = 'sending', attempts = attempts + 1, updated_at = now()
    from selected s
    where r.id = s.id
    returning r.id, r.campaign_id, r.email
  )
  select claimed.id, claimed.campaign_id, claimed.email, c.subject, c.html, c.interval_minutes
  from claimed join public.email_campaigns c on c.id = claimed.campaign_id;
end;
$$;

revoke all on function public.claim_email_recipients(integer, integer) from public;
grant execute on function public.claim_email_recipients(integer, integer) to service_role;
