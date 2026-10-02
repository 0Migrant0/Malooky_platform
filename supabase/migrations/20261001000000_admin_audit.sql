-- Upgrade migration: secure, append-only admin audit history.
create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_entity_idx on public.admin_audit_logs (entity_type, entity_id);

alter table public.admin_audit_logs enable row level security;
drop policy if exists "admin reads audit logs" on public.admin_audit_logs;
create policy "admin reads audit logs" on public.admin_audit_logs for select using (public.is_admin());
