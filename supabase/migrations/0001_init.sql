-- Vector — initial schema, RLS, triggers
-- ---------------------------------------------------------------------------

create type ticket_status as enum ('backlog', 'todo', 'inprogress', 'done');
create type ticket_priority as enum ('urgent', 'high', 'medium', 'low');

-- Tables --------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  color text not null default 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
  initials text not null default '?',
  created_at timestamptz not null default now()
);

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'Free',
  created_at timestamptz not null default now()
);

create table workspace_members (
  workspace_id uuid not null references workspaces (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role text not null default 'member',
  primary key (workspace_id, user_id)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null,
  icon text not null,
  key text not null,
  ticket_seq bigint not null default 0,
  due_date date,
  created_at timestamptz not null default now()
);
create index projects_workspace_idx on projects (workspace_id);

create table project_members (
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  primary key (project_id, user_id)
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  code text not null,
  title text not null,
  description text not null default '',
  status ticket_status not null default 'backlog',
  priority ticket_priority not null default 'medium',
  assignee_id uuid references profiles (id) on delete set null,
  due_date date,
  position double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tickets_board_idx on tickets (project_id, status, position);
create index tickets_assignee_idx on tickets (assignee_id);
create index tickets_due_idx on tickets (due_date);

create table comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index comments_ticket_idx on comments (ticket_id);

-- Helper functions (SECURITY DEFINER to avoid RLS recursion) -----------------

create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

create or replace function public.can_access_project(pid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_workspace_member((select workspace_id from projects where id = pid));
$$;

create or replace function public.can_access_ticket(tid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.can_access_project((select project_id from tickets where id = tid));
$$;

-- updated_at trigger ---------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tickets_touch_updated_at
  before update on tickets
  for each row execute function public.touch_updated_at();

-- New auth user -> profile ---------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
  ws_id uuid;
begin
  display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );
  insert into public.profiles (id, name, email, initials)
  values (
    new.id,
    display_name,
    new.email,
    upper(left(regexp_replace(display_name, '[^a-zA-Z]', '', 'g'), 2))
  )
  on conflict (id) do nothing;

  -- Bootstrap a personal workspace so every new user starts with an empty
  -- (but usable) space of their own.
  insert into public.workspaces (name, plan)
  values (display_name || '''s Workspace', 'Free')
  returning id into ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS ------------------------------------------------------------------------

alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table tickets enable row level security;
alter table comments enable row level security;

-- profiles: readable by anyone who shares a workspace; self-update.
create policy profiles_select on profiles for select using (
  id = auth.uid()
  or exists (
    select 1 from workspace_members me
    join workspace_members them on them.workspace_id = me.workspace_id
    where me.user_id = auth.uid() and them.user_id = profiles.id
  )
);
create policy profiles_update on profiles for update using (id = auth.uid());

-- workspaces
create policy workspaces_select on workspaces for select
  using (public.is_workspace_member(id));

-- workspace_members
create policy workspace_members_select on workspace_members for select
  using (public.is_workspace_member(workspace_id));

-- projects
create policy projects_select on projects for select
  using (public.is_workspace_member(workspace_id));
create policy projects_insert on projects for insert
  with check (public.is_workspace_member(workspace_id));
create policy projects_update on projects for update
  using (public.is_workspace_member(workspace_id));
create policy projects_delete on projects for delete
  using (public.is_workspace_member(workspace_id));

-- project_members
create policy project_members_select on project_members for select
  using (public.can_access_project(project_id));
create policy project_members_write on project_members for all
  using (public.can_access_project(project_id))
  with check (public.can_access_project(project_id));

-- tickets
create policy tickets_select on tickets for select
  using (public.can_access_project(project_id));
create policy tickets_insert on tickets for insert
  with check (public.can_access_project(project_id));
create policy tickets_update on tickets for update
  using (public.can_access_project(project_id));
create policy tickets_delete on tickets for delete
  using (public.can_access_project(project_id));

-- comments
create policy comments_select on comments for select
  using (public.can_access_ticket(ticket_id));
create policy comments_insert on comments for insert
  with check (public.can_access_ticket(ticket_id) and author_id = auth.uid());
