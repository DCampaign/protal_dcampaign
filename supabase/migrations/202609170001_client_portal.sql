-- Shared delivery records. CRM remains the source of client/services/payment data.
create table public.portal_accounts (
 id uuid primary key default gen_random_uuid(), crm_client_id text unique not null,
 is_active boolean not null default true, manager_id uuid references public.profiles(id),
 created_at timestamptz not null default now()
);
create table public.portal_members (
 id uuid primary key default gen_random_uuid(), account_id uuid not null references public.portal_accounts(id),
 profile_id uuid not null unique references public.profiles(id) on delete cascade,
 is_active boolean not null default true, last_read_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.portal_records (
 id uuid primary key default gen_random_uuid(), account_id uuid not null references public.portal_accounts(id),
 kind text not null check(kind in ('work','deliverable','request','file','meeting')),
 parent_id uuid references public.portal_records(id), visible boolean not null default false,
 details jsonb not null, version integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,account_id),
 foreign key(parent_id,account_id) references public.portal_records(id,account_id)
);
create table public.portal_events (
 id uuid primary key default gen_random_uuid(), account_id uuid not null references public.portal_accounts(id),
 record_id uuid not null, kind text not null, message text not null default '', attachment text not null default '',
 visible boolean not null default false, actor_id uuid references public.profiles(id), actor_name text not null,
 actor_type text not null, snapshot jsonb, created_at timestamptz not null default now(),
 foreign key(record_id,account_id) references public.portal_records(id,account_id)
);
create index portal_records_account on public.portal_records(account_id,updated_at desc);
create index portal_events_account on public.portal_events(account_id,created_at desc);
alter table public.portal_accounts enable row level security;
alter table public.portal_members enable row level security;
alter table public.portal_records enable row level security;
alter table public.portal_events enable row level security;
-- No direct browser access. Server APIs authorize every operation; private tables
-- are also inaccessible via the public PostgREST API even with guessed IDs.
revoke all on public.portal_accounts, public.portal_members, public.portal_records, public.portal_events from anon, authenticated;
grant all on public.portal_accounts, public.portal_members, public.portal_records, public.portal_events to service_role;

-- Record mutations and immutable history commit together, with optimistic locking.
create function public.portal_write(p_actor uuid, p_account uuid, p_action text, p_input jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare actor public.profiles; acc public.portal_accounts; rec public.portal_records;
 employee boolean; target uuid; event_visible boolean; event_message text; event_kind text; payload jsonb;
begin
 select * into actor from profiles where id=p_actor and is_active;
 if actor.id is null then raise exception 'Unauthorized'; end if;
 select * into acc from portal_accounts where id=p_account for update;
 if acc.id is null then raise exception 'Not found'; end if;
 if not exists(select 1 from crm_workspace_state s, jsonb_array_elements(s.payload->'clients') c
   where c->>'id'=acc.crm_client_id and coalesce(c->>'archivedAt','')='') then raise exception 'Client unavailable'; end if;
 employee := actor.role::text in ('super_admin','admin','account_manager','team_member');
 if employee then
   if actor.role::text not in ('super_admin','admin') and acc.manager_id is distinct from actor.id then raise exception 'Unauthorized'; end if;
 elsif actor.role::text <> 'client' or not acc.is_active or not exists(select 1 from portal_members where account_id=acc.id and profile_id=actor.id and is_active) then
   raise exception 'Unauthorized';
 end if;
 target := nullif(p_input->>'id','')::uuid;
 if target is not null then
   select * into rec from portal_records where id=target and account_id=acc.id for update;
   if rec.id is null or (not employee and not rec.visible) then raise exception 'Not found'; end if;
   if (p_input->>'version') is null or rec.version is distinct from (p_input->>'version')::integer then raise exception 'Record changed. Refresh and retry.'; end if;
 end if;
 if p_action='save' then
   payload := p_input->'details';
   if not employee and (target is not null or p_input->>'kind'<>'request' or payload->>'status'<>'Submitted' or not (p_input->>'visible')::boolean) then raise exception 'Unauthorized'; end if;
   if target is not null and rec.kind<>p_input->>'kind' then raise exception 'Record type cannot change'; end if;
   if nullif(p_input->>'parentId','') is not null and not exists(select 1 from portal_records where id=(p_input->>'parentId')::uuid and account_id=acc.id and kind='work' and (employee or visible)) then raise exception 'Invalid related work'; end if;
   if target is null then
     insert into portal_records(account_id,kind,parent_id,visible,details) values(acc.id,p_input->>'kind',nullif(p_input->>'parentId','')::uuid,(p_input->>'visible')::boolean,payload) returning * into rec;
     event_kind := 'Created';
   else
     update portal_records set details=payload,parent_id=nullif(p_input->>'parentId','')::uuid,visible=(p_input->>'visible')::boolean,version=version+1,updated_at=now() where id=target returning * into rec;
     event_kind := 'Updated';
   end if;
   event_visible:=rec.visible; event_message:=coalesce(nullif(payload->>'latestUpdate',''),payload->>'title');
 elsif p_action in ('approve','changes') then
   if employee or rec.id is null or rec.kind<>'deliverable' or rec.details->>'status'<>'Ready for Review' or not coalesce((rec.details->>'approvalRequired')::boolean,false) then raise exception 'Approval unavailable'; end if;
   if p_action='changes' and length(trim(coalesce(p_input->>'message','')))<2 then raise exception 'Feedback required'; end if;
   event_kind:=case when p_action='approve' then 'Approved' else 'Changes Requested' end;
   update portal_records set details=jsonb_set(details,'{status}',to_jsonb(event_kind)),version=version+1,updated_at=now() where id=rec.id returning * into rec;
   event_visible:=true;event_message:=coalesce(p_input->>'message','');
 elsif p_action='comment' then
   if rec.id is null or rec.kind not in ('work','deliverable','request') or length(trim(coalesce(p_input->>'message','')))<2 then raise exception 'Comment required'; end if;
   event_kind:='Comment';event_visible:=case when employee then coalesce((p_input->>'visible')::boolean,false) else true end;event_message:=p_input->>'message';
 else raise exception 'Unknown action'; end if;
 insert into portal_events(account_id,record_id,kind,message,attachment,visible,actor_id,actor_name,actor_type,snapshot)
 values(acc.id,rec.id,event_kind,event_message,coalesce(p_input->>'attachment',''),event_visible,actor.id,actor.full_name,case when employee then 'Employee' else 'Client' end,case when p_action='comment' then null else rec.details end);
 return rec.id;
end $$;
revoke all on function public.portal_write(uuid,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.portal_write(uuid,uuid,text,jsonb) to service_role;

-- Safe contact edits update the same CRM record and bump its synchronization version.
create function public.portal_update_contact(p_actor uuid,p_account uuid,p_contact jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare acc public.portal_accounts; state public.crm_workspace_state; actor_name text; idx integer; changed_at timestamptz:=now();
begin
 select a.* into acc from portal_accounts a join portal_members m on m.account_id=a.id join profiles p on p.id=m.profile_id
 where a.id=p_account and a.is_active and m.is_active and p.id=p_actor and p.is_active and p.role='client';
 if acc.id is null then raise exception 'Unauthorized'; end if;
 select * into state from crm_workspace_state where id='primary' for update;
 select (ordinality-1)::integer into idx from jsonb_array_elements(state.payload->'clients') with ordinality
 where value->>'id'=acc.crm_client_id and coalesce(value->>'archivedAt','')='';
 if idx is null then raise exception 'Client unavailable'; end if;
 select full_name into actor_name from profiles where id=p_actor;
 -- A linked lead/prospect can be the source of these fields. Store explicit contact
 -- overrides on the CRM client; the CRM applies them after its derived lead fields.
 update crm_workspace_state set payload=jsonb_set(
   jsonb_set(payload,array['clients',idx::text],
     (payload->'clients'->idx) || jsonb_build_object('portalContact',jsonb_build_object('name',p_contact->>'name','email',p_contact->>'email','phone',p_contact->>'phone','website',p_contact->>'website','address',p_contact->>'address'),'updatedAt',changed_at),true),
   '{history}',coalesce(payload->'history','[]'::jsonb) || jsonb_build_array(jsonb_build_object(
     'id',gen_random_uuid()::text,'actor',actor_name,'action','Updated','entity','Client portal profile',
     'entityId',acc.crm_client_id,'details','Client updated safe contact details','createdAt',changed_at::text)),true),
   version=version+1,updated_at=changed_at,updated_by=p_actor where id='primary';
end $$;
revoke all on function public.portal_update_contact(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.portal_update_contact(uuid,uuid,jsonb) to service_role;
