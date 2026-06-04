-- Groups
create table if not exists groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  destination text,
  date_from date,
  date_to date,
  is_public boolean default false,
  created_by uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- Group members
create table if not exists group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','moderator','member')),
  status text not null default 'invited' check (status in ('invited','active')),
  joined_at timestamptz,
  created_at timestamptz default now(),
  unique(group_id, user_id)
);

-- Group messages
create table if not exists group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Group activities
create table if not exists group_activities (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  title text not null,
  date date,
  location text,
  created_by uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- RLS
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_messages enable row level security;
alter table group_activities enable row level security;

create policy "Public groups visible to all" on groups for select using (is_public = true or created_by = auth.uid() or exists (select 1 from group_members where group_id = groups.id and user_id = auth.uid()));
create policy "Members can insert groups" on groups for insert with check (auth.uid() = created_by);
create policy "Admin can update group" on groups for update using (exists (select 1 from group_members where group_id = groups.id and user_id = auth.uid() and role = 'admin'));

create policy "Members see group members" on group_members for select using (exists (select 1 from group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid()));
create policy "Admin/mod can insert members" on group_members for insert with check (auth.uid() = user_id or exists (select 1 from group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid() and gm.role in ('admin','moderator')));
create policy "Members can update own membership" on group_members for update using (user_id = auth.uid() or exists (select 1 from group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid() and gm.role = 'admin'));
create policy "Admin can delete members" on group_members for delete using (user_id = auth.uid() or exists (select 1 from group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid() and gm.role = 'admin'));

create policy "Members see messages" on group_messages for select using (exists (select 1 from group_members where group_id = group_messages.group_id and user_id = auth.uid() and status = 'active'));
create policy "Members send messages" on group_messages for insert with check (exists (select 1 from group_members where group_id = group_messages.group_id and user_id = auth.uid() and status = 'active'));

create policy "Members see activities" on group_activities for select using (exists (select 1 from group_members where group_id = group_activities.group_id and user_id = auth.uid()));
create policy "Members add activities" on group_activities for insert with check (exists (select 1 from group_members where group_id = group_activities.group_id and user_id = auth.uid() and status = 'active'));
create policy "Creator can delete activity" on group_activities for delete using (created_by = auth.uid());
