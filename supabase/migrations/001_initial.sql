-- Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null default '',
  age int,
  country text,
  bio text default '',
  profile_image_url text,
  travel_style text,
  languages text[] default '{}',
  verified boolean default false,
  is_premium boolean default false,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

-- Travel destinations
create table travel_destinations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  country text not null,
  city text,
  date_from date,
  date_to date,
  created_at timestamptz default now()
);

-- Interests
create table user_interests (
  user_id uuid references profiles(id) on delete cascade,
  interest text not null,
  primary key (user_id, interest)
);

-- Swipes
create table swipes (
  swiper_id uuid references profiles(id) on delete cascade,
  swiped_id uuid references profiles(id) on delete cascade,
  direction text not null check (direction in ('left', 'right')),
  created_at timestamptz default now(),
  primary key (swiper_id, swiped_id)
);

-- Matches
create table matches (
  id uuid default gen_random_uuid() primary key,
  user_a_id uuid references profiles(id) on delete cascade,
  user_b_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_a_id, user_b_id)
);

-- Messages
create table messages (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references matches(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table travel_destinations enable row level security;
alter table user_interests enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;

-- Profiles: anyone can read, only owner can write
create policy "profiles_read" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Destinations: anyone can read, owner can write
create policy "destinations_read" on travel_destinations for select using (true);
create policy "destinations_write" on travel_destinations
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Interests: anyone can read, owner can write
create policy "interests_read" on user_interests for select using (true);
create policy "interests_write" on user_interests
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Swipes: only owner can read/write their own swipes
create policy "swipes_own" on swipes for all using (auth.uid() = swiper_id);

-- Matches: parties can read their own matches
create policy "matches_read" on matches for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);
create policy "matches_insert" on matches for insert
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- Messages: parties of the match can read/write
create policy "messages_read" on messages for select
  using (
    exists (
      select 1 from matches
      where matches.id = messages.match_id
        and (matches.user_a_id = auth.uid() or matches.user_b_id = auth.uid())
    )
  );
create policy "messages_insert" on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from matches
      where matches.id = messages.match_id
        and (matches.user_a_id = auth.uid() or matches.user_b_id = auth.uid())
    )
  );

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Indexes for common query patterns
create index on travel_destinations(user_id);
create index on matches(user_a_id);
create index on matches(user_b_id);
create index on messages(match_id, created_at);

-- Enable realtime for messages
alter publication supabase_realtime add table messages;
