create type public.skill_level as enum (
  'beginner',
  'improver',
  'intermediate',
  'advanced'
);

create type public.play_format as enum (
  'singles',
  'doubles'
);

create type public.request_status as enum (
  'open',
  'matched',
  'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  skill_level public.skill_level not null default 'beginner',
  preferred_area text not null,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.play_requests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  area text not null,
  play_date date not null,
  time_window text not null,
  skill_level_wanted public.skill_level not null,
  format public.play_format not null default 'singles',
  note text not null default '',
  status public.request_status not null default 'open',
  accepted_player_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accepted_player_is_not_creator check (accepted_player_id is null or accepted_player_id <> creator_id)
);

create table public.request_interests (
  request_id uuid not null references public.play_requests(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, player_id)
);

alter table public.profiles enable row level security;
alter table public.play_requests enable row level security;
alter table public.request_interests enable row level security;

create policy "Profiles are visible to signed in users"
on public.profiles for select
to authenticated
using (true);

create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Open requests are visible to signed in users"
on public.play_requests for select
to authenticated
using (
  status = 'open'
  or creator_id = auth.uid()
  or accepted_player_id = auth.uid()
);

create policy "Users can create their own play requests"
on public.play_requests for insert
to authenticated
with check (auth.uid() = creator_id);

create policy "Request creators can update their own requests"
on public.play_requests for update
to authenticated
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

create policy "Users can view interests on relevant requests"
on public.request_interests for select
to authenticated
using (
  player_id = auth.uid()
  or exists (
    select 1
    from public.play_requests pr
    where pr.id = request_interests.request_id
      and pr.creator_id = auth.uid()
  )
);

create policy "Users can mark their own interest"
on public.request_interests for insert
to authenticated
with check (
  auth.uid() = player_id
  and exists (
    select 1
    from public.play_requests pr
    where pr.id = request_interests.request_id
      and pr.creator_id <> auth.uid()
      and pr.status = 'open'
  )
);

create policy "Users can remove their own interest"
on public.request_interests for delete
to authenticated
using (auth.uid() = player_id);
