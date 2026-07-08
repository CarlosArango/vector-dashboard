-- Vector — local development seed.
--
-- Login:  demo@vector.dev  /  password123
--
-- Inserting the auth.users row fires handle_new_user() (see 0001_init.sql),
-- which bootstraps the profile, a personal workspace, and the owner membership.
-- We then fill that workspace with projects + tickets so the board has enough
-- data to exercise (and profile) real load.
--
-- Runs on `pnpm db:reset` / `supabase db reset --local`.

-- ---------------------------------------------------------------------------
-- Auth user (bcrypt password via pgcrypto; email pre-confirmed)
-- ---------------------------------------------------------------------------
-- The empty-string token columns are required: GoTrue's Go scanner errors with
-- "Database error querying schema" (500 on login) if they are left NULL.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change,
  email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'demo@vector.dev',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Demo User"}',
  false,
  '', '', '', '', '', '', '', ''
);

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"demo@vector.dev","email_verified":true}',
  'email', now(), now(), now()
);

-- ---------------------------------------------------------------------------
-- Projects + tickets in the bootstrapped workspace
-- ---------------------------------------------------------------------------
do $$
declare
  uid   uuid := '11111111-1111-1111-1111-111111111111';
  ws    uuid;
  pid   uuid;
  proj  text[];
  n     int;
  statuses  text[] := array['backlog','todo','inprogress','done'];
  prios     text[] := array['urgent','high','medium','low'];
  -- name, color, icon, key, ticket_count
  projects  text[][] := array[
    array['Web Platform',   '#3b82f6', 'globe',    'WEB',  '300'],
    array['Mobile App',     '#8b5cf6', 'phone',    'MOB',  '180'],
    array['API Services',   '#10b981', 'server',   'API',  '220'],
    array['Design System',  '#f59e0b', 'palette',  'DS',   '90'],
    array['Data Pipeline',  '#ef4444', 'database', 'DATA', '140'],
    array['Growth',         '#ec4899', 'rocket',   'GRW',  '60']
  ];
begin
  select workspace_id into ws
  from public.workspace_members
  where user_id = uid
  limit 1;

  foreach proj slice 1 in array projects loop
    n := proj[5]::int;

    insert into public.projects (workspace_id, name, description, color, icon, key, ticket_seq)
    values (ws, proj[1], proj[1] || ' — seeded project', proj[2], proj[3], proj[4], n)
    returning id into pid;

    insert into public.project_members (project_id, user_id)
    values (pid, uid);

    insert into public.tickets (project_id, code, title, status, priority, assignee_id, position, created_at)
    select
      pid,
      proj[4] || '-' || g,
      'Ticket ' || g || ': ' || (array['fix','add','refactor','investigate','ship','polish'])[1 + (g % 6)] || ' ' || proj[1],
      (statuses[1 + (g % 4)])::ticket_status,
      (prios[1 + (g % 4)])::ticket_priority,
      case when g % 3 = 0 then uid else null end,
      g::double precision,
      now() - (g || ' minutes')::interval
    from generate_series(1, n) as g;
  end loop;
end $$;
