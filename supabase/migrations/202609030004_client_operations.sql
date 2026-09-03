create type public.content_status as enum ('idea','planned','in_production','internal_review','awaiting_client','approved','scheduled','published','revision_requested','cancelled');
create type public.approval_status as enum ('pending','approved','changes_requested','cancelled');
create type public.invoice_status as enum ('draft','issued','paid','overdue','cancelled');
create type public.ticket_status as enum ('open','in_progress','awaiting_client','resolved','closed');
create type public.ticket_priority as enum ('low','normal','high','urgent');

create table public.content_items (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade, service_id uuid references public.services(id) on delete set null,
  title text not null, platform text not null, content_type text not null, caption text, scheduled_date date, published_at timestamptz,
  status public.content_status not null default 'idea', preview_url text, notes text, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.approvals (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade, project_id uuid references public.projects(id) on delete set null,
  content_item_id uuid references public.content_items(id) on delete set null, requested_by uuid references public.profiles(id), title text not null, description text,
  preview_url text, status public.approval_status not null default 'pending', due_date date, client_response text, responded_by uuid references public.profiles(id), responded_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.reports (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade, service_id uuid references public.services(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null, title text not null, description text, report_type text not null, period_start date, period_end date,
  storage_path text, external_url text, status text not null default 'ready', visible_to_client boolean not null default true, uploaded_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.files (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade, project_id uuid references public.projects(id) on delete set null,
  uploaded_by uuid references public.profiles(id), name text not null, original_filename text not null, storage_path text not null, mime_type text not null, size_bytes bigint not null check(size_bytes >= 0),
  category text not null default 'other', description text, visible_to_client boolean not null default true, created_at timestamptz not null default now()
);
create table public.invoices (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade, invoice_number text unique not null, issue_date date not null,
  due_date date, subtotal numeric not null default 0, tax numeric not null default 0, total numeric not null default 0, currency text not null default 'INR', status public.invoice_status not null default 'draft',
  description text, storage_path text, external_payment_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade, created_by uuid references public.profiles(id), subject text not null,
  category text not null default 'general', priority public.ticket_priority not null default 'normal', status public.ticket_status not null default 'open', assigned_to uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), resolved_at timestamptz
);
create table public.support_messages (
  id uuid primary key default gen_random_uuid(), ticket_id uuid not null references public.support_tickets(id) on delete cascade, author_id uuid references public.profiles(id), body text not null, created_at timestamptz not null default now()
);
insert into storage.buckets (id,name,public) values ('client-files','client-files',false) on conflict (id) do update set public=false;
create policy client_files_member_read on storage.objects for select using (bucket_id='client-files' and (public.is_admin() or public.is_client_member((storage.foldername(name))[2]::uuid)));
create policy client_files_admin_write on storage.objects for all using (bucket_id='client-files' and public.is_admin()) with check (bucket_id='client-files' and public.is_admin());
create index content_client_date_idx on public.content_items(client_id,scheduled_date);
create index approvals_client_status_idx on public.approvals(client_id,status);
create index reports_client_period_idx on public.reports(client_id,period_end desc);
create index files_client_category_idx on public.files(client_id,category);
create index invoices_client_date_idx on public.invoices(client_id,due_date);
create index support_client_status_idx on public.support_tickets(client_id,status);

alter table public.content_items enable row level security; alter table public.approvals enable row level security; alter table public.reports enable row level security; alter table public.files enable row level security; alter table public.invoices enable row level security; alter table public.support_tickets enable row level security; alter table public.support_messages enable row level security;
create policy content_member_read on public.content_items for select using (public.is_admin() or public.is_client_member(client_id)); create policy content_admin_write on public.content_items for all using(public.is_admin()) with check(public.is_admin());
create policy approvals_member_read on public.approvals for select using (public.is_admin() or public.is_client_member(client_id)); create policy approvals_admin_write on public.approvals for all using(public.is_admin()) with check(public.is_admin());
create policy approvals_member_respond on public.approvals for update using(public.is_client_member(client_id) and status='pending') with check(public.is_client_member(client_id));
create policy reports_member_read on public.reports for select using ((public.is_admin() or public.is_client_member(client_id)) and (public.is_admin() or visible_to_client)); create policy reports_admin_write on public.reports for all using(public.is_admin()) with check(public.is_admin());
create policy files_member_read on public.files for select using ((public.is_admin() or public.is_client_member(client_id)) and (public.is_admin() or visible_to_client)); create policy files_admin_write on public.files for all using(public.is_admin()) with check(public.is_admin());
create policy invoices_member_read on public.invoices for select using (public.is_admin() or public.is_client_member(client_id)); create policy invoices_admin_write on public.invoices for all using(public.is_admin()) with check(public.is_admin());
create policy tickets_member_read on public.support_tickets for select using(public.is_admin() or public.is_client_member(client_id)); create policy tickets_member_create on public.support_tickets for insert with check(public.is_client_member(client_id)); create policy tickets_admin_write on public.support_tickets for all using(public.is_admin()) with check(public.is_admin());
create policy messages_member_read on public.support_messages for select using(public.is_admin() or exists(select 1 from public.support_tickets t where t.id=ticket_id and public.is_client_member(t.client_id))); create policy messages_member_create on public.support_messages for insert with check(public.is_admin() or exists(select 1 from public.support_tickets t where t.id=ticket_id and public.is_client_member(t.client_id))); create policy messages_admin_write on public.support_messages for all using(public.is_admin()) with check(public.is_admin());
