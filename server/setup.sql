-- Isolated table; browser roles cannot read rooms or hidden guesses directly.
create table if not exists public.zero100_rooms (
 code text primary key check (code ~ '^[A-Z2-9]{8}$'),
 state jsonb not null,
 revision bigint not null default 0,
 expires_at timestamptz not null default (now() + interval '5 hours'),
 created_at timestamptz not null default now()
);
alter table public.zero100_rooms enable row level security;
revoke all on public.zero100_rooms from anon, authenticated;
grant select, insert, update, delete on public.zero100_rooms to service_role;
create index if not exists zero100_rooms_expires_idx on public.zero100_rooms(expires_at);


-- For existing installations, apply during the coordinated v2 rollout.
alter table public.zero100_rooms alter column expires_at set default (now() + interval '5 hours');
