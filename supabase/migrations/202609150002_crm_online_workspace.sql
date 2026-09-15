-- Online state bridge for the existing CRM UI. This provides immediate
-- cross-device persistence while normalized CRM modules are adopted in phases.
create table if not exists public.crm_workspace_state (
  id text primary key default 'primary' check(id='primary'),
  payload jsonb not null default '{"leads":[],"prospects":[],"clients":[],"payments":[]}'::jsonb,
  version bigint not null default 1,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.crm_workspace_state enable row level security;
drop policy if exists crm_workspace_internal on public.crm_workspace_state;
drop policy if exists crm_workspace_managers on public.crm_workspace_state;
create policy crm_workspace_internal on public.crm_workspace_state for select
  using(public.has_internal_role(array['super_admin','admin','sales','account_manager','team_member','finance']));
create policy crm_workspace_managers on public.crm_workspace_state for all
  using(public.has_internal_role(array['super_admin','admin']))
  with check(public.has_internal_role(array['super_admin','admin']));
