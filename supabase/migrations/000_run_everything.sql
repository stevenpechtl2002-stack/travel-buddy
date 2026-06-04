-- ============================================================
-- ALLES IN EINEM — einmal in Supabase SQL Editor ausführen
-- ============================================================

-- SCHRITT 1: GRUPPEN TABELLEN
-- ============================================================
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

create table if not exists group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists group_activities (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  title text not null,
  date date,
  location text,
  created_by uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_messages enable row level security;
alter table group_activities enable row level security;

drop policy if exists "Public groups visible to all" on groups;
drop policy if exists "Members can insert groups" on groups;
drop policy if exists "Admin can update group" on groups;
drop policy if exists "Members see group members" on group_members;
drop policy if exists "Admin/mod can insert members" on group_members;
drop policy if exists "Members can update own membership" on group_members;
drop policy if exists "Admin can delete members" on group_members;
drop policy if exists "Members see messages" on group_messages;
drop policy if exists "Members send messages" on group_messages;
drop policy if exists "Members see activities" on group_activities;
drop policy if exists "Members add activities" on group_activities;
drop policy if exists "Creator can delete activity" on group_activities;

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


-- SCHRITT 2: 30 DEMO BENUTZER (auth.users + profiles)
-- ============================================================
do $$
declare
  all_ids uuid[] := array[
    '11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000006',
    '11111111-0000-0000-0000-000000000007','11111111-0000-0000-0000-000000000008',
    '11111111-0000-0000-0000-000000000009','11111111-0000-0000-0000-000000000010',
    '22222222-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000005','22222222-0000-0000-0000-000000000006',
    '22222222-0000-0000-0000-000000000007','22222222-0000-0000-0000-000000000008',
    '22222222-0000-0000-0000-000000000009','22222222-0000-0000-0000-000000000010',
    '22222222-0000-0000-0000-000000000011','22222222-0000-0000-0000-000000000012',
    '22222222-0000-0000-0000-000000000013','22222222-0000-0000-0000-000000000014',
    '22222222-0000-0000-0000-000000000015','22222222-0000-0000-0000-000000000016',
    '22222222-0000-0000-0000-000000000017','22222222-0000-0000-0000-000000000018',
    '22222222-0000-0000-0000-000000000019','22222222-0000-0000-0000-000000000020'
  ];
  all_emails text[] := array[
    'lena@demo.app','max@demo.app','sofia@demo.app','jonas@demo.app','mia@demo.app',
    'lukas@demo.app','anna@demo.app','felix@demo.app','sara@demo.app','tom@demo.app',
    'julia@demo.app','noah@demo.app','emma@demo.app','leon@demo.app','hannah@demo.app',
    'paul@demo.app','marie@demo.app','ben@demo.app','lara@demo.app','tim@demo.app',
    'nina@demo.app','david@demo.app','chloe@demo.app','jan@demo.app','sarah@demo.app',
    'alex@demo.app','lea@demo.app','moritz@demo.app','lisa@demo.app','tobias@demo.app'
  ];
begin
  for i in 1..30 loop
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token)
    values (all_ids[i], all_emails[i], crypt('Demo1234!', gen_salt('bf')), now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated', '')
    on conflict (id) do nothing;
  end loop;
end $$;

-- SCHRITT 3: PROFILE
-- ============================================================
insert into profiles (id, email, name, age, country, bio, travel_style, profile_image_url, onboarding_complete) values
  ('11111111-0000-0000-0000-000000000001','lena@demo.app','Lena',24,'Deutschland','Backpackerin durch Südostasien 🌏','backpacker','https://randomuser.me/api/portraits/women/21.jpg',true),
  ('11111111-0000-0000-0000-000000000002','max@demo.app','Max',27,'Österreich','Fotograf & Abenteurer ⛰️','adventure','https://randomuser.me/api/portraits/men/22.jpg',true),
  ('11111111-0000-0000-0000-000000000003','sofia@demo.app','Sofia',22,'Schweiz','Yoga & Beach Life 🏖️','beach','https://randomuser.me/api/portraits/women/23.jpg',true),
  ('11111111-0000-0000-0000-000000000004','jonas@demo.app','Jonas',30,'Deutschland','Digital Nomad & Kaffee-Fan ☕','city','https://randomuser.me/api/portraits/men/24.jpg',true),
  ('11111111-0000-0000-0000-000000000005','mia@demo.app','Mia',25,'Niederlande','Roadtrip Queen 🚗','adventure','https://randomuser.me/api/portraits/women/25.jpg',true),
  ('11111111-0000-0000-0000-000000000006','lukas@demo.app','Lukas',28,'Deutschland','Surfer & Taucher 🤿','beach','https://randomuser.me/api/portraits/men/26.jpg',true),
  ('11111111-0000-0000-0000-000000000007','anna@demo.app','Anna',23,'Österreich','Stadtentdeckerin & Foodie 🍜','city','https://randomuser.me/api/portraits/women/27.jpg',true),
  ('11111111-0000-0000-0000-000000000008','felix@demo.app','Felix',26,'Schweiz','Bergsteiger & Skifahrer ⛷️','adventure','https://randomuser.me/api/portraits/men/28.jpg',true),
  ('11111111-0000-0000-0000-000000000009','sara@demo.app','Sara',29,'Deutschland','Solo Traveler & Buchautorin 📚','backpacker','https://randomuser.me/api/portraits/women/29.jpg',true),
  ('11111111-0000-0000-0000-000000000010','tom@demo.app','Tom',31,'Österreich','Weltenbummler seit 10 Jahren ✈️','backpacker','https://randomuser.me/api/portraits/men/30.jpg',true),
  ('22222222-0000-0000-0000-000000000001','julia@demo.app','Julia',23,'Deutschland','Entdecke die Welt mit offenen Augen 🌏','adventure','https://randomuser.me/api/portraits/women/1.jpg',true),
  ('22222222-0000-0000-0000-000000000002','noah@demo.app','Noah',26,'Österreich','Surfer tagsüber, Sternegucker nachts 🏄‍♂️','beach','https://randomuser.me/api/portraits/men/2.jpg',true),
  ('22222222-0000-0000-0000-000000000003','emma@demo.app','Emma',24,'Schweiz','Yoga-Lehrerin auf Weltreise 🧘‍♀️','beach','https://randomuser.me/api/portraits/women/3.jpg',true),
  ('22222222-0000-0000-0000-000000000004','leon@demo.app','Leon',28,'Deutschland','Fotograf & Backpacker 📸','backpacker','https://randomuser.me/api/portraits/men/4.jpg',true),
  ('22222222-0000-0000-0000-000000000005','hannah@demo.app','Hannah',22,'Niederlande','Gap Year Reisende 🎓','backpacker','https://randomuser.me/api/portraits/women/5.jpg',true),
  ('22222222-0000-0000-0000-000000000006','paul@demo.app','Paul',31,'Deutschland','Remote Worker & Digitaler Nomade 💻','city','https://randomuser.me/api/portraits/men/6.jpg',true),
  ('22222222-0000-0000-0000-000000000007','marie@demo.app','Marie',25,'Frankreich','Foodie & Kulturliebhaberin 🍷','city','https://randomuser.me/api/portraits/women/7.jpg',true),
  ('22222222-0000-0000-0000-000000000008','ben@demo.app','Ben',29,'USA','Bergsteiger & Extremsportler ⛰️','adventure','https://randomuser.me/api/portraits/men/8.jpg',true),
  ('22222222-0000-0000-0000-000000000009','lara@demo.app','Lara',27,'Österreich','Sprachenlernerin — 5 Sprachen 🗣️','city','https://randomuser.me/api/portraits/women/9.jpg',true),
  ('22222222-0000-0000-0000-000000000010','tim@demo.app','Tim',30,'Schweiz','Van-Life Enthusiast 🚐','adventure','https://randomuser.me/api/portraits/men/10.jpg',true),
  ('22222222-0000-0000-0000-000000000011','nina@demo.app','Nina',21,'Deutschland','Erste Solotrip mit 21 🦋','backpacker','https://randomuser.me/api/portraits/women/11.jpg',true),
  ('22222222-0000-0000-0000-000000000012','david@demo.app','David',33,'UK','Taucher & Meeresliebhaber 🤿','beach','https://randomuser.me/api/portraits/men/12.jpg',true),
  ('22222222-0000-0000-0000-000000000013','chloe@demo.app','Chloé',26,'Frankreich','Künstlerin auf Reisen 🎨','city','https://randomuser.me/api/portraits/women/13.jpg',true),
  ('22222222-0000-0000-0000-000000000014','jan@demo.app','Jan',32,'Deutschland','Ex-Banker, jetzt Weltenbummler 🌍','backpacker','https://randomuser.me/api/portraits/men/14.jpg',true),
  ('22222222-0000-0000-0000-000000000015','sarah@demo.app','Sarah',24,'Kanada','Wildlife-Fotografin 📷🦁','adventure','https://randomuser.me/api/portraits/women/15.jpg',true),
  ('22222222-0000-0000-0000-000000000016','alex@demo.app','Alex',28,'Deutschland','Musikfestival-Junkie 🎵','city','https://randomuser.me/api/portraits/men/16.jpg',true),
  ('22222222-0000-0000-0000-000000000017','lea@demo.app','Lea',23,'Österreich','Kletterin & Naturliebhaberin 🧗‍♀️','adventure','https://randomuser.me/api/portraits/women/17.jpg',true),
  ('22222222-0000-0000-0000-000000000018','moritz@demo.app','Moritz',35,'Deutschland','Familienreisen weltweit 👨‍👧‍👦','city','https://randomuser.me/api/portraits/men/18.jpg',true),
  ('22222222-0000-0000-0000-000000000019','lisa@demo.app','Lisa',27,'Schweiz','Vegane Köchin auf Reisen 🌱','beach','https://randomuser.me/api/portraits/women/19.jpg',true),
  ('22222222-0000-0000-0000-000000000020','tobias@demo.app','Tobias',29,'Deutschland','Historiker & Kulturreisender 🏛️','city','https://randomuser.me/api/portraits/men/20.jpg',true)
on conflict (id) do nothing;

-- SCHRITT 4: REISEZIELE
-- ============================================================
insert into travel_destinations (user_id, country, city) values
  ('11111111-0000-0000-0000-000000000001','Thailand','Bangkok'),('11111111-0000-0000-0000-000000000001','Indonesien','Bali'),
  ('11111111-0000-0000-0000-000000000002','Japan','Tokio'),('11111111-0000-0000-0000-000000000002','Neuseeland',null),
  ('11111111-0000-0000-0000-000000000003','Australien','Sydney'),('11111111-0000-0000-0000-000000000003','Thailand','Koh Samui'),
  ('11111111-0000-0000-0000-000000000004','Portugal','Lissabon'),('11111111-0000-0000-0000-000000000004','Mexiko','Mexico City'),
  ('11111111-0000-0000-0000-000000000005','Spanien','Barcelona'),('11111111-0000-0000-0000-000000000005','Argentinien','Buenos Aires'),
  ('11111111-0000-0000-0000-000000000006','Indonesien','Bali'),('11111111-0000-0000-0000-000000000006','Philippinen','Palawan'),
  ('11111111-0000-0000-0000-000000000007','Frankreich','Paris'),('11111111-0000-0000-0000-000000000007','Italien','Rom'),
  ('11111111-0000-0000-0000-000000000008','Schweiz','Zermatt'),('11111111-0000-0000-0000-000000000008','Nepal','Kathmandu'),
  ('11111111-0000-0000-0000-000000000009','Peru','Cusco'),('11111111-0000-0000-0000-000000000009','Kolumbien','Medellín'),
  ('11111111-0000-0000-0000-000000000010','Kanada','Vancouver'),('11111111-0000-0000-0000-000000000010','Island','Reykjavik'),
  ('22222222-0000-0000-0000-000000000001','Thailand','Chiang Mai'),('22222222-0000-0000-0000-000000000001','Vietnam','Hanoi'),('22222222-0000-0000-0000-000000000001','Kambodscha','Siem Reap'),
  ('22222222-0000-0000-0000-000000000002','Australien','Byron Bay'),('22222222-0000-0000-0000-000000000002','Indonesien','Bali'),
  ('22222222-0000-0000-0000-000000000003','Indien','Rishikesh'),('22222222-0000-0000-0000-000000000003','Sri Lanka','Colombo'),
  ('22222222-0000-0000-0000-000000000004','Japan','Tokio'),('22222222-0000-0000-0000-000000000004','Mongolei','Ulaanbaatar'),
  ('22222222-0000-0000-0000-000000000005','Neuseeland','Auckland'),('22222222-0000-0000-0000-000000000005','Peru','Cusco'),
  ('22222222-0000-0000-0000-000000000006','Portugal','Lissabon'),('22222222-0000-0000-0000-000000000006','Georgien','Tiflis'),
  ('22222222-0000-0000-0000-000000000007','Italien','Neapel'),('22222222-0000-0000-0000-000000000007','Marokko','Marrakesch'),
  ('22222222-0000-0000-0000-000000000008','Nepal','Kathmandu'),('22222222-0000-0000-0000-000000000008','Island','Reykjavik'),
  ('22222222-0000-0000-0000-000000000009','Spanien','Barcelona'),('22222222-0000-0000-0000-000000000009','Korea','Seoul'),
  ('22222222-0000-0000-0000-000000000010','Norwegen','Bergen'),('22222222-0000-0000-0000-000000000010','Schottland','Edinburgh'),
  ('22222222-0000-0000-0000-000000000011','Thailand','Bangkok'),('22222222-0000-0000-0000-000000000011','Kolumbien','Medellín'),
  ('22222222-0000-0000-0000-000000000012','Malediven','Malé'),('22222222-0000-0000-0000-000000000012','Philippinen','Palawan'),
  ('22222222-0000-0000-0000-000000000013','Japan','Kyoto'),('22222222-0000-0000-0000-000000000013','Mexiko','Oaxaca'),
  ('22222222-0000-0000-0000-000000000014','Myanmar','Yangon'),('22222222-0000-0000-0000-000000000014','Laos','Luang Prabang'),
  ('22222222-0000-0000-0000-000000000015','Kenia','Nairobi'),('22222222-0000-0000-0000-000000000015','Tansania','Serengeti'),
  ('22222222-0000-0000-0000-000000000016','UK','London'),('22222222-0000-0000-0000-000000000016','USA','New Orleans'),
  ('22222222-0000-0000-0000-000000000017','Frankreich','Chamonix'),('22222222-0000-0000-0000-000000000017','Kanada','Banff'),
  ('22222222-0000-0000-0000-000000000018','Japan','Tokio'),('22222222-0000-0000-0000-000000000018','Dänemark','Kopenhagen'),
  ('22222222-0000-0000-0000-000000000019','Griechenland','Kreta'),('22222222-0000-0000-0000-000000000019','Costa Rica','Manuel Antonio'),
  ('22222222-0000-0000-0000-000000000020','Griechenland','Athen'),('22222222-0000-0000-0000-000000000020','Türkei','Istanbul');

-- SCHRITT 5: INTERESSEN
-- ============================================================
insert into user_interests (user_id, interest) values
  ('11111111-0000-0000-0000-000000000001','🏄 Surfen'),('11111111-0000-0000-0000-000000000001','📸 Fotografie'),('11111111-0000-0000-0000-000000000001','🍜 Street Food'),
  ('11111111-0000-0000-0000-000000000002','⛰️ Wandern'),('11111111-0000-0000-0000-000000000002','📸 Fotografie'),('11111111-0000-0000-0000-000000000002','🎵 Musik'),
  ('11111111-0000-0000-0000-000000000003','🧘 Yoga'),('11111111-0000-0000-0000-000000000003','🏄 Surfen'),('11111111-0000-0000-0000-000000000003','🍷 Wein'),
  ('11111111-0000-0000-0000-000000000004','🎵 Musik'),('11111111-0000-0000-0000-000000000004','🍜 Street Food'),('11111111-0000-0000-0000-000000000004','📸 Fotografie'),
  ('11111111-0000-0000-0000-000000000005','🚴 Fahrrad'),('11111111-0000-0000-0000-000000000005','🎨 Kunst'),('11111111-0000-0000-0000-000000000005','🧘 Yoga'),
  ('11111111-0000-0000-0000-000000000006','🤿 Tauchen'),('11111111-0000-0000-0000-000000000006','🏄 Surfen'),('11111111-0000-0000-0000-000000000006','📸 Fotografie'),
  ('11111111-0000-0000-0000-000000000007','🎨 Kunst'),('11111111-0000-0000-0000-000000000007','🍜 Street Food'),('11111111-0000-0000-0000-000000000007','🎭 Theater'),
  ('11111111-0000-0000-0000-000000000008','⛷️ Ski'),('11111111-0000-0000-0000-000000000008','🥾 Wandern'),('11111111-0000-0000-0000-000000000008','📸 Fotografie'),
  ('11111111-0000-0000-0000-000000000009','📚 Lesen'),('11111111-0000-0000-0000-000000000009','🍜 Street Food'),('11111111-0000-0000-0000-000000000009','🎵 Musik'),
  ('11111111-0000-0000-0000-000000000010','🥾 Wandern'),('11111111-0000-0000-0000-000000000010','📸 Fotografie'),('11111111-0000-0000-0000-000000000010','🍷 Wein'),
  ('22222222-0000-0000-0000-000000000001','🏄 Surfen'),('22222222-0000-0000-0000-000000000001','🍜 Street Food'),('22222222-0000-0000-0000-000000000001','🎭 Theater'),
  ('22222222-0000-0000-0000-000000000002','🏄 Surfen'),('22222222-0000-0000-0000-000000000002','🤿 Tauchen'),('22222222-0000-0000-0000-000000000002','🎵 Musik'),
  ('22222222-0000-0000-0000-000000000003','🧘 Yoga'),('22222222-0000-0000-0000-000000000003','🍷 Wein'),('22222222-0000-0000-0000-000000000003','📚 Lesen'),
  ('22222222-0000-0000-0000-000000000004','📸 Fotografie'),('22222222-0000-0000-0000-000000000004','🥾 Wandern'),('22222222-0000-0000-0000-000000000004','🎨 Kunst'),
  ('22222222-0000-0000-0000-000000000005','🎵 Musik'),('22222222-0000-0000-0000-000000000005','🍜 Street Food'),('22222222-0000-0000-0000-000000000005','📸 Fotografie'),
  ('22222222-0000-0000-0000-000000000006','📚 Lesen'),('22222222-0000-0000-0000-000000000006','☕ Kaffee'),('22222222-0000-0000-0000-000000000006','🎵 Musik'),
  ('22222222-0000-0000-0000-000000000007','🍷 Wein'),('22222222-0000-0000-0000-000000000007','🎨 Kunst'),('22222222-0000-0000-0000-000000000007','🍜 Street Food'),
  ('22222222-0000-0000-0000-000000000008','🥾 Wandern'),('22222222-0000-0000-0000-000000000008','⛷️ Ski'),('22222222-0000-0000-0000-000000000008','📸 Fotografie'),
  ('22222222-0000-0000-0000-000000000009','🎭 Theater'),('22222222-0000-0000-0000-000000000009','🍷 Wein'),('22222222-0000-0000-0000-000000000009','🎵 Musik'),
  ('22222222-0000-0000-0000-000000000010','🚴 Fahrrad'),('22222222-0000-0000-0000-000000000010','🥾 Wandern'),('22222222-0000-0000-0000-000000000010','🎵 Musik'),
  ('22222222-0000-0000-0000-000000000011','🍜 Street Food'),('22222222-0000-0000-0000-000000000011','📸 Fotografie'),('22222222-0000-0000-0000-000000000011','🧘 Yoga'),
  ('22222222-0000-0000-0000-000000000012','🤿 Tauchen'),('22222222-0000-0000-0000-000000000012','🏄 Surfen'),('22222222-0000-0000-0000-000000000012','📸 Fotografie'),
  ('22222222-0000-0000-0000-000000000013','🎨 Kunst'),('22222222-0000-0000-0000-000000000013','🍷 Wein'),('22222222-0000-0000-0000-000000000013','🎵 Musik'),
  ('22222222-0000-0000-0000-000000000014','📚 Lesen'),('22222222-0000-0000-0000-000000000014','🍜 Street Food'),('22222222-0000-0000-0000-000000000014','📸 Fotografie'),
  ('22222222-0000-0000-0000-000000000015','📸 Fotografie'),('22222222-0000-0000-0000-000000000015','🥾 Wandern'),('22222222-0000-0000-0000-000000000015','🎨 Kunst'),
  ('22222222-0000-0000-0000-000000000016','🎵 Musik'),('22222222-0000-0000-0000-000000000016','🎭 Theater'),('22222222-0000-0000-0000-000000000016','🍷 Wein'),
  ('22222222-0000-0000-0000-000000000017','🥾 Wandern'),('22222222-0000-0000-0000-000000000017','⛷️ Ski'),('22222222-0000-0000-0000-000000000017','🧘 Yoga'),
  ('22222222-0000-0000-0000-000000000018','📸 Fotografie'),('22222222-0000-0000-0000-000000000018','🍜 Street Food'),('22222222-0000-0000-0000-000000000018','🎭 Theater'),
  ('22222222-0000-0000-0000-000000000019','🧘 Yoga'),('22222222-0000-0000-0000-000000000019','🏄 Surfen'),('22222222-0000-0000-0000-000000000019','🌱 Vegan'),
  ('22222222-0000-0000-0000-000000000020','📚 Lesen'),('22222222-0000-0000-0000-000000000020','🎨 Kunst'),('22222222-0000-0000-0000-000000000020','🍷 Wein')
on conflict do nothing;
