create type public.project_status as enum ('planned','active','on_hold','awaiting_client','completed','cancelled');
create type public.project_priority as enum ('low','medium','high','urgent');
create type public.milestone_status as enum ('not_started','in_progress','awaiting_client','completed');
create type public.task_status as enum ('backlog','planned','in_progress','awaiting_client','blocked','completed','cancelled');

create table public.projects (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null, title text not null, description text,
  status public.project_status not null default 'planned', progress integer not null default 0 check(progress between 0 and 100),
  start_date date, due_date date, completed_at timestamptz, project_manager_id uuid references public.profiles(id),
  priority public.project_priority not null default 'medium', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.project_milestones (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  title text not null, description text, status public.milestone_status not null default 'not_started', progress integer not null default 0 check(progress between 0 and 100),
  display_order integer not null default 0, due_date date, completed_at timestamptz, created_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade, service_id uuid references public.services(id) on delete set null,
  milestone_id uuid references public.project_milestones(id) on delete set null, title text not null, description text,
  status public.task_status not null default 'backlog', priority public.project_priority not null default 'medium', assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id), start_date date, due_date date, completed_at timestamptz,
  visible_to_client boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.activities (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null, actor_id uuid references public.profiles(id) on delete set null,
  activity_type text not null, title text not null, description text, metadata jsonb not null default '{}'::jsonb,
  visible_to_client boolean not null default true, created_at timestamptz not null default now()
);

create index projects_client_idx on public.projects(client_id);
create index milestones_project_idx on public.project_milestones(project_id);
create index tasks_client_status_idx on public.tasks(client_id,status);
create index activities_client_created_idx on public.activities(client_id,created_at desc);

alter table public.projects enable row level security;
alter table public.project_milestones enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;

create policy projects_member_read on public.projects for select using (public.is_admin() or public.is_client_member(client_id));
create policy projects_admin_write on public.projects for all using (public.is_admin()) with check (public.is_admin());
create policy milestones_member_read on public.project_milestones for select using (public.is_admin() or exists(select 1 from public.projects p where p.id=project_id and public.is_client_member(p.client_id)));
create policy milestones_admin_write on public.project_milestones for all using (public.is_admin()) with check (public.is_admin());
create policy tasks_member_read on public.tasks for select using ((public.is_admin() or public.is_client_member(client_id)) and (public.is_admin() or visible_to_client));
create policy tasks_admin_write on public.tasks for all using (public.is_admin()) with check (public.is_admin());
create policy activities_member_read on public.activities for select using ((public.is_admin() or public.is_client_member(client_id)) and (public.is_admin() or visible_to_client));
create policy activities_admin_write on public.activities for all using (public.is_admin()) with check (public.is_admin());
