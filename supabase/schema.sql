-- ============================================================
-- Poker Night — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  avatar_url  text,
  phone       text,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SESSIONS
-- ============================================================
create table if not exists sessions (
  id              uuid primary key default uuid_generate_v4(),
  date            date not null default current_date,
  buy_in_amount   numeric(10,2) not null,
  chip_ratio      integer not null,           -- chips per 1 buy-in
  host_cost       numeric(10,2),
  created_by      uuid references profiles(id) on delete set null,
  status          text not null default 'active' check (status in ('active', 'completed')),
  created_at      timestamptz not null default now()
);

-- ============================================================
-- SESSION PLAYERS
-- ============================================================
create table if not exists session_players (
  id              uuid primary key default uuid_generate_v4(),
  session_id      uuid not null references sessions(id) on delete cascade,
  player_id       uuid not null references profiles(id) on delete cascade,
  total_buy_ins   integer not null default 1 check (total_buy_ins >= 1),
  final_chips     integer,
  created_at      timestamptz not null default now(),
  unique(session_id, player_id)     -- each player can appear once per session
);

-- ============================================================
-- SETTLEMENTS
-- ============================================================
create table if not exists settlements (
  id              uuid primary key default uuid_generate_v4(),
  session_id      uuid not null references sessions(id) on delete cascade,
  from_player     uuid not null references profiles(id) on delete cascade,
  to_player       uuid not null references profiles(id) on delete cascade,
  amount          numeric(10,2) not null check (amount > 0),
  created_at      timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table session_players enable row level security;
alter table settlements enable row level security;

-- Profiles: anyone authenticated can read; only owner can update
create policy "Public profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Sessions: authenticated users can do anything (shared game context)
create policy "Authenticated users can view all sessions"
  on sessions for select
  to authenticated
  using (true);

create policy "Authenticated users can create sessions"
  on sessions for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Session creator can update session"
  on sessions for update
  to authenticated
  using (auth.uid() = created_by);

create policy "Session creator can delete session"
  on sessions for delete
  to authenticated
  using (auth.uid() = created_by);

-- Session players: read by all authenticated, write by session creator
create policy "Authenticated users can view session players"
  on session_players for select
  to authenticated
  using (true);

create policy "Authenticated users can manage session players"
  on session_players for insert
  to authenticated
  with check (
    exists (
      select 1 from sessions
      where id = session_id and created_by = auth.uid()
    )
  );

create policy "Authenticated users can update session players"
  on session_players for update
  to authenticated
  using (
    exists (
      select 1 from sessions
      where id = session_id and created_by = auth.uid()
    )
  );

create policy "Authenticated users can delete session players"
  on session_players for delete
  to authenticated
  using (
    exists (
      select 1 from sessions
      where id = session_id and created_by = auth.uid()
    )
  );

-- Settlements: read by all authenticated, write by session creator
create policy "Authenticated users can view settlements"
  on settlements for select
  to authenticated
  using (true);

create policy "Authenticated users can manage settlements"
  on settlements for insert
  to authenticated
  with check (
    exists (
      select 1 from sessions
      where id = session_id and created_by = auth.uid()
    )
  );

create policy "Authenticated users can delete settlements"
  on settlements for delete
  to authenticated
  using (
    exists (
      select 1 from sessions
      where id = session_id and created_by = auth.uid()
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_sessions_status on sessions(status);
create index if not exists idx_sessions_created_by on sessions(created_by);
create index if not exists idx_session_players_session on session_players(session_id);
create index if not exists idx_session_players_player on session_players(player_id);
create index if not exists idx_settlements_session on settlements(session_id);
