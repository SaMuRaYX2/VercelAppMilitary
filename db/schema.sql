create table if not exists survey_response (
  user_id         text primary key references "user"(id) on delete cascade,
  answers         jsonb not null default '{}'::jsonb,
  ip              text,
  country         text,
  city            text,
  user_agent      text,
  accept_language text,
  client_info     jsonb,
  last_ip         text,
  visitor_id      text,
  first_seen_at   timestamptz,
  started_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  submitted_at    timestamptz
);

alter table survey_response add column if not exists visitor_id text;
alter table survey_response add column if not exists first_seen_at timestamptz;

create index if not exists survey_response_updated_at_idx on survey_response (updated_at desc);

-- Who changed roles, emails or deleted users from the admin panel. Emails are copied
-- so the record survives deleting either side.
create table if not exists admin_audit (
  id           bigserial primary key,
  actor_id     text references "user"(id) on delete set null,
  actor_email  text not null,
  target_id    text not null,
  target_email text not null,
  action       text not null,
  detail       jsonb,
  ip           text,
  created_at   timestamptz not null default now()
);

create index if not exists admin_audit_created_at_idx on admin_audit (created_at desc);
