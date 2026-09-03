-- Security corrections and the remaining account-level foundation.
-- This migration is intentionally append-only; previously deployed migrations are not edited.

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where user_id = auth.uid()
      and role in ('super_admin', 'admin')
      and is_active
  )
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'super_admin' and is_active
  )
$$;

create table public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  email_notifications boolean not null default true,
  portal_notifications boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index notifications_profile_created_idx on public.notifications(profile_id, created_at desc);
create index notifications_profile_unread_idx on public.notifications(profile_id) where read_at is null;
create index audit_logs_client_created_idx on public.audit_logs(client_id, created_at desc);

alter table public.notification_preferences enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy preferences_self_read on public.notification_preferences for select
  using (profile_id = (select id from public.profiles where user_id = auth.uid()));
create policy preferences_self_insert on public.notification_preferences for insert
  with check (profile_id = (select id from public.profiles where user_id = auth.uid()));
create policy preferences_self_update on public.notification_preferences for update
  using (profile_id = (select id from public.profiles where user_id = auth.uid()))
  with check (profile_id = (select id from public.profiles where user_id = auth.uid()));

create policy notifications_self_read on public.notifications for select
  using (profile_id = (select id from public.profiles where user_id = auth.uid()));
create policy notifications_admin_write on public.notifications for all
  using (public.is_admin()) with check (public.is_admin());

create policy audit_logs_admin_read on public.audit_logs for select using (public.is_admin());
create policy audit_logs_admin_insert on public.audit_logs for insert with check (public.is_admin());

-- A client must not be able to mutate the subject, client, requester, or preview of an approval.
drop policy if exists approvals_member_respond on public.approvals;

create or replace function public.respond_to_approval(
  target_approval uuid,
  response_status public.approval_status,
  response_text text default null
)
returns public.approvals
language plpgsql
security definer
set search_path = public
as $$
declare
  approval_row public.approvals;
  responder uuid;
begin
  if response_status not in ('approved', 'changes_requested') then
    raise exception 'Invalid approval response';
  end if;
  select * into approval_row from public.approvals where id = target_approval for update;
  if approval_row.id is null or not public.is_client_member(approval_row.client_id) then
    raise exception 'Approval not found';
  end if;
  if approval_row.status <> 'pending' then
    raise exception 'Approval has already been answered';
  end if;
  select id into responder from public.profiles where user_id = auth.uid() and is_active;
  update public.approvals
    set status = response_status,
        client_response = nullif(trim(response_text), ''),
        responded_by = responder,
        responded_at = now(),
        updated_at = now()
    where id = target_approval
    returning * into approval_row;
  insert into public.activities(client_id, project_id, actor_id, activity_type, title, description, visible_to_client)
    values (approval_row.client_id, approval_row.project_id, responder, 'approval_response',
      case when response_status = 'approved' then 'Approval completed' else 'Changes requested' end,
      approval_row.title, true);
  return approval_row;
end;
$$;

revoke all on function public.respond_to_approval(uuid, public.approval_status, text) from public;
grant execute on function public.respond_to_approval(uuid, public.approval_status, text) to authenticated;

-- Tighten client-created ticket and message ownership.
drop policy if exists tickets_member_create on public.support_tickets;
create policy tickets_member_create on public.support_tickets for insert with check (
  public.is_client_member(client_id)
  and created_by = (select id from public.profiles where user_id = auth.uid() and is_active)
);
drop policy if exists messages_member_create on public.support_messages;
create policy messages_member_create on public.support_messages for insert with check (
  author_id = (select id from public.profiles where user_id = auth.uid() and is_active)
  and exists(select 1 from public.support_tickets t where t.id = ticket_id and public.is_client_member(t.client_id))
);

-- Private storage convention: clients/{client_uuid}/filename.ext.
create or replace function public.can_access_client_storage(object_name text)
returns boolean language plpgsql stable security definer set search_path = public, storage
as $$
declare target_client uuid;
begin
  if (storage.foldername(object_name))[1] <> 'clients' then return false; end if;
  target_client := (storage.foldername(object_name))[2]::uuid;
  return public.is_admin() or public.is_client_member(target_client);
exception when others then
  return false;
end;
$$;

drop policy if exists client_files_member_read on storage.objects;
create policy client_files_member_read on storage.objects for select
  using (bucket_id = 'client-files' and public.can_access_client_storage(name));

-- Prevent admins from promoting themselves and protect the final super administrator.
create or replace function public.protect_super_admin_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if old.role = 'super_admin' and (new.role <> 'super_admin' or not new.is_active) then
    if not public.is_super_admin() then raise exception 'Only a super administrator can change this role'; end if;
    if old.user_id = auth.uid() then raise exception 'You cannot demote or deactivate your own super administrator account'; end if;
    if (select count(*) from public.profiles where role = 'super_admin' and is_active) <= 1 then
      raise exception 'At least one active super administrator is required';
    end if;
  end if;
  if new.role = 'super_admin' and old.role <> 'super_admin' and not public.is_super_admin() then
    raise exception 'Only a super administrator can grant this role';
  end if;
  return new;
end;
$$;

create trigger protect_super_admin_before_update
before update of role, is_active on public.profiles
for each row execute function public.protect_super_admin_role();

create or replace function public.update_own_profile(new_full_name text, new_phone text default null, new_avatar_url text default null)
returns public.profiles language plpgsql security definer set search_path = public
as $$
declare result public.profiles;
begin
  if length(trim(new_full_name)) < 2 or length(trim(new_full_name)) > 120 then raise exception 'Invalid full name'; end if;
  update public.profiles set full_name = trim(new_full_name), phone = nullif(trim(new_phone), ''), avatar_url = nullif(trim(new_avatar_url), ''), updated_at = now()
  where user_id = auth.uid() and is_active returning * into result;
  if result.id is null then raise exception 'Profile not found'; end if;
  return result;
end;
$$;

create or replace function public.mark_notification_read(target_notification uuid)
returns void language sql security definer set search_path = public
as $$ update public.notifications set read_at = coalesce(read_at, now()) where id = target_notification and profile_id = (select id from public.profiles where user_id = auth.uid()) $$;

create or replace function public.mark_all_notifications_read()
returns void language sql security definer set search_path = public
as $$ update public.notifications set read_at = coalesce(read_at, now()) where read_at is null and profile_id = (select id from public.profiles where user_id = auth.uid()) $$;

revoke all on function public.update_own_profile(text, text, text) from public;
revoke all on function public.mark_notification_read(uuid) from public;
revoke all on function public.mark_all_notifications_read() from public;
grant execute on function public.update_own_profile(text, text, text) to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
