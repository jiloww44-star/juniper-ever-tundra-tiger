create table if not exists audit_submissions (
  id text primary key,
  reference text not null,
  payload jsonb not null,
  contact jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  completeness integer not null default 0,
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists audit_submissions_created_at_idx
  on audit_submissions (created_at desc);