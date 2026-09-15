-- DCampaign CRM production foundation.
-- Apply after the existing portal migrations. Existing portal tables are reused where practical.

alter type public.app_role add value if not exists 'sales';
alter type public.app_role add value if not exists 'account_manager';
alter type public.app_role add value if not exists 'finance';

alter table public.clients add column if not exists crm_legacy_browser_id text;
alter table public.clients add column if not exists client_health text check(client_health is null or client_health in ('Good','Attention Needed','At Risk'));
alter table public.clients add column if not exists health_note text;
alter table public.client_services add column if not exists pricing_type text;
alter table public.client_services add column if not exists billing_frequency text;
alter table public.client_services add column if not exists renewal_date date;
alter table public.client_services add column if not exists account_manager_id uuid references public.profiles(id) on delete set null;
alter table public.client_services add column if not exists scope_summary text;

create or replace function public.has_internal_role(allowed_roles text[])
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.profiles
    where user_id=auth.uid() and is_active and role::text=any(allowed_roles)
  )
$$;

create table if not exists public.crm_prospects (
  id uuid primary key default gen_random_uuid(),
  business_name text not null check(length(trim(business_name)) between 1 and 200),
  industry text, contact_person text, phone text, whatsapp text, email text, website text,
  city text, state text, address text, maps_url text, instagram_url text, facebook_url text, linkedin_url text,
  research_source text not null default 'Other', research_notes text,
  priority text not null default 'Warm' check(priority in ('Hot','Warm','Cold')),
  status text not null default 'New' check(status in ('New','Ready for Outreach','Contacted','Follow-up','Interested','Not Interested','No Response','Converted to Lead')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  converted_lead_id uuid,
  legacy_browser_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.crm_prospect_opportunities (
  id uuid primary key default gen_random_uuid(), prospect_id uuid not null references public.crm_prospects(id) on delete cascade,
  opportunity text not null, unique(prospect_id,opportunity)
);

create table if not exists public.crm_prospect_services (
  prospect_id uuid not null references public.crm_prospects(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  primary key(prospect_id,service_id)
);

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(), prospect_id uuid references public.crm_prospects(id) on delete set null,
  contact_name text not null check(length(trim(contact_name)) between 1 and 200), company_name text,
  phone text, whatsapp text, email text, website text, city text, lead_source text not null default 'Other',
  estimated_budget numeric check(estimated_budget is null or estimated_budget>=0), expected_value numeric not null default 0 check(expected_value>=0),
  priority text not null default 'Warm' check(priority in ('Hot','Warm','Cold')),
  status text not null default 'New' check(status in ('New','Contacted','Interested','Meeting','Proposal Sent','Follow-up','Negotiation','Won','Lost')),
  assigned_to uuid references public.profiles(id) on delete set null, requirement_notes text,
  lost_reason text, lost_notes text, converted_client_id uuid references public.clients(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null, legacy_browser_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);

alter table public.crm_prospects drop constraint if exists crm_prospects_converted_lead_id_fkey;
alter table public.crm_prospects add constraint crm_prospects_converted_lead_id_fkey foreign key(converted_lead_id) references public.crm_leads(id) on delete set null;

create table if not exists public.crm_lead_services (
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  primary key(lead_id,service_id)
);

create table if not exists public.crm_outreach_attempts (
  id uuid primary key default gen_random_uuid(), prospect_id uuid not null references public.crm_prospects(id) on delete cascade,
  outreach_date date not null, outreach_time time, method text not null, outcome text not null, notes text,
  salesperson_id uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);

create table if not exists public.crm_follow_ups (
  id uuid primary key default gen_random_uuid(), prospect_id uuid references public.crm_prospects(id) on delete cascade,
  lead_id uuid references public.crm_leads(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  follow_up_date date not null, follow_up_time time, method text not null default 'Phone', notes text,
  assigned_to uuid references public.profiles(id) on delete set null,
  status text not null default 'Pending' check(status in ('Pending','Completed','Cancelled')),
  outcome text, completed_at timestamptz, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(num_nonnulls(prospect_id,lead_id,client_id)=1)
);

create table if not exists public.crm_meetings (
  id uuid primary key default gen_random_uuid(), prospect_id uuid references public.crm_prospects(id) on delete set null,
  lead_id uuid references public.crm_leads(id) on delete set null, client_id uuid references public.clients(id) on delete set null,
  title text not null, contact_person text, meeting_type text not null, meeting_date date not null,
  start_time time not null, end_time time, meeting_mode text not null, meeting_link_or_location text,
  agenda text, meeting_notes text, outcome text, next_action text,
  assigned_to uuid[] not null default '{}', created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(num_nonnulls(prospect_id,lead_id,client_id)=1)
);

create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(), deal_number text unique not null,
  lead_id uuid references public.crm_leads(id) on delete set null, client_id uuid references public.clients(id) on delete set null,
  deal_name text not null, deal_type text not null default 'New Business' check(deal_type in ('New Business','Upsell','Cross-sell')),
  expected_value numeric not null default 0, pricing_type text not null default 'One-Time', expected_close_date date,
  probability integer not null default 10 check(probability between 0 and 100), pipeline_stage text not null default 'New',
  assigned_to uuid references public.profiles(id) on delete set null, priority text not null default 'Warm', notes text,
  won_date date, lost_date date, lost_reason text, lost_notes text, final_value numeric,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(num_nonnulls(lead_id,client_id)>=1)
);

create table if not exists public.crm_deal_services (
  deal_id uuid not null references public.crm_deals(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  primary key(deal_id,service_id)
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(), prospect_id uuid references public.crm_prospects(id) on delete cascade,
  lead_id uuid references public.crm_leads(id) on delete cascade, deal_id uuid references public.crm_deals(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  activity_type text not null, subject text not null, description text, outcome text,
  scheduled_at timestamptz, completed_at timestamptz, created_by uuid references public.profiles(id) on delete set null,
  internal_only boolean not null default true, created_at timestamptz not null default now(),
  check(num_nonnulls(prospect_id,lead_id,deal_id,client_id)=1)
);

create table if not exists public.crm_imports (
  id uuid primary key default gen_random_uuid(), requested_by uuid not null references public.profiles(id),
  source text not null default 'browser-localstorage', checksum text unique not null, status text not null default 'Pending',
  summary jsonb not null default '{}'::jsonb, imported_at timestamptz, created_at timestamptz not null default now()
);


-- Transitional online workspace for the existing CRM screens. This preserves the
-- current UI while records are progressively moved into the normalized tables
-- above. The version column prevents silent last-write-wins data loss.
create table if not exists public.crm_workspace_state (
  id text primary key default 'primary' check(id='primary'),
  payload jsonb not null default '{"leads":[],"prospects":[],"clients":[],"payments":[]}'::jsonb,
  version bigint not null default 1,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_payments (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete restrict,
  invoice_id uuid references public.invoices(id) on delete set null, payment_number text unique,
  amount numeric not null check(amount>0), payment_date date, due_date date, payment_method text not null default 'Other',
  transaction_reference text, notes text, status text not null default 'Pending' check(status in ('Pending','Paid','Overdue')),
  recorded_by uuid references public.profiles(id) on delete set null, legacy_browser_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists crm_prospects_status_idx on public.crm_prospects(status,assigned_to);
create index if not exists crm_prospects_contact_idx on public.crm_prospects(phone,email,website);
create index if not exists crm_leads_status_idx on public.crm_leads(status,assigned_to);
create index if not exists crm_followups_due_idx on public.crm_follow_ups(status,follow_up_date,assigned_to);
create index if not exists crm_outreach_prospect_idx on public.crm_outreach_attempts(prospect_id,outreach_date desc);
create index if not exists crm_deals_stage_idx on public.crm_deals(pipeline_stage,assigned_to);
create index if not exists crm_activities_entity_idx on public.crm_activities(lead_id,created_at desc);
create index if not exists crm_payments_client_idx on public.crm_payments(client_id,payment_date desc);

alter table public.crm_prospects enable row level security;
alter table public.crm_prospect_opportunities enable row level security;
alter table public.crm_prospect_services enable row level security;
alter table public.crm_leads enable row level security;
alter table public.crm_lead_services enable row level security;
alter table public.crm_outreach_attempts enable row level security;
alter table public.crm_follow_ups enable row level security;
alter table public.crm_meetings enable row level security;
alter table public.crm_deals enable row level security;
alter table public.crm_deal_services enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_imports enable row level security;
alter table public.crm_workspace_state enable row level security;
alter table public.crm_payments enable row level security;

create policy crm_prospects_internal on public.crm_prospects for all using(public.has_internal_role(array['super_admin','admin','sales'])) with check(public.has_internal_role(array['super_admin','admin','sales']));
create policy crm_prospect_opportunities_internal on public.crm_prospect_opportunities for all using(public.has_internal_role(array['super_admin','admin','sales'])) with check(public.has_internal_role(array['super_admin','admin','sales']));
create policy crm_prospect_services_internal on public.crm_prospect_services for all using(public.has_internal_role(array['super_admin','admin','sales'])) with check(public.has_internal_role(array['super_admin','admin','sales']));
create policy crm_leads_internal on public.crm_leads for all using(public.has_internal_role(array['super_admin','admin','sales'])) with check(public.has_internal_role(array['super_admin','admin','sales']));
create policy crm_lead_services_internal on public.crm_lead_services for all using(public.has_internal_role(array['super_admin','admin','sales'])) with check(public.has_internal_role(array['super_admin','admin','sales']));
create policy crm_outreach_internal on public.crm_outreach_attempts for all using(public.has_internal_role(array['super_admin','admin','sales'])) with check(public.has_internal_role(array['super_admin','admin','sales']));
create policy crm_followups_internal on public.crm_follow_ups for all using(public.has_internal_role(array['super_admin','admin','sales','account_manager'])) with check(public.has_internal_role(array['super_admin','admin','sales','account_manager']));
create policy crm_meetings_internal on public.crm_meetings for all using(public.has_internal_role(array['super_admin','admin','sales','account_manager','team_member'])) with check(public.has_internal_role(array['super_admin','admin','sales','account_manager']));
create policy crm_deals_internal on public.crm_deals for all using(public.has_internal_role(array['super_admin','admin','sales','account_manager','finance'])) with check(public.has_internal_role(array['super_admin','admin','sales']));
create policy crm_deal_services_internal on public.crm_deal_services for all using(public.has_internal_role(array['super_admin','admin','sales','account_manager','finance'])) with check(public.has_internal_role(array['super_admin','admin','sales']));
create policy crm_activities_internal on public.crm_activities for all using(public.has_internal_role(array['super_admin','admin','sales','account_manager','team_member','finance'])) with check(public.has_internal_role(array['super_admin','admin','sales','account_manager','team_member','finance']));
create policy crm_imports_admin on public.crm_imports for all using(public.has_internal_role(array['super_admin','admin'])) with check(public.has_internal_role(array['super_admin','admin']));
create policy crm_workspace_internal on public.crm_workspace_state for select using(public.has_internal_role(array['super_admin','admin','sales','account_manager','team_member','finance']));
create policy crm_workspace_managers on public.crm_workspace_state for all using(public.has_internal_role(array['super_admin','admin'])) with check(public.has_internal_role(array['super_admin','admin']));
create policy crm_payments_finance on public.crm_payments for all using(public.has_internal_role(array['super_admin','admin','finance'])) with check(public.has_internal_role(array['super_admin','admin','finance']));

create or replace function public.touch_crm_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create trigger crm_prospects_touch before update on public.crm_prospects for each row execute function public.touch_crm_updated_at();
create trigger crm_leads_touch before update on public.crm_leads for each row execute function public.touch_crm_updated_at();
create trigger crm_followups_touch before update on public.crm_follow_ups for each row execute function public.touch_crm_updated_at();
create trigger crm_meetings_touch before update on public.crm_meetings for each row execute function public.touch_crm_updated_at();
create trigger crm_deals_touch before update on public.crm_deals for each row execute function public.touch_crm_updated_at();
create trigger crm_payments_touch before update on public.crm_payments for each row execute function public.touch_crm_updated_at();

insert into public.services(name,slug,display_order)
select name,slug,display_order from (values
 ('Brand Strategy','brand-strategy',10),('Logo Designing','logo-designing',11),('UI & UX','ui-ux',12),('Packaging Designing','packaging-designing',13),('Graphic Designing','graphic-designing',14),
 ('Web Development','web-development',20),('WordPress Development','wordpress-development',21),('Shopify Development','shopify-development',22),('App Development','app-development',23),('Marketplace Management','marketplace-management',24),
 ('Performance Marketing','performance-marketing',30),('Email Marketing','email-marketing',33),('WhatsApp Marketing','whatsapp-marketing',34),
 ('AI Automation','ai-automation',40),('AI Agents','ai-agents',41),('AI Sales Agent','ai-sales-agent',42),('Marketing Automation','marketing-automation',43),('Content Creation','content-creation',44),
 ('Google My Business','google-my-business',50),('Content Writing','content-writing',51),('CRM Development','crm-development',52),('AEO & GEO','aeo-geo',53),('Personal Branding','personal-branding',54)
) as v(name,slug,display_order)
on conflict(slug) do update set name=excluded.name,display_order=excluded.display_order;
