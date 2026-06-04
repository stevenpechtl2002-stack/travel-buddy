-- Demo users (run in Supabase SQL Editor with service role)
-- Password for all: Demo1234!

do $$
declare
  ids uuid[] := array[
    '11111111-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000005',
    '11111111-0000-0000-0000-000000000006',
    '11111111-0000-0000-0000-000000000007',
    '11111111-0000-0000-0000-000000000008',
    '11111111-0000-0000-0000-000000000009',
    '11111111-0000-0000-0000-000000000010'
  ];
  emails text[] := array['lena@demo.app','max@demo.app','sofia@demo.app','jonas@demo.app','mia@demo.app','lukas@demo.app','anna@demo.app','felix@demo.app','sara@demo.app','tom@demo.app'];
begin
  for i in 1..10 loop
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token)
    values (ids[i], emails[i], crypt('Demo1234!', gen_salt('bf')), now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated', '')
    on conflict (id) do nothing;
  end loop;
end $$;

-- Profiles
insert into profiles (id, email, name, age, country, bio, travel_style, onboarding_complete) values
  ('11111111-0000-0000-0000-000000000001','lena@demo.app','Lena',24,'Deutschland','Backpackerin durch Südostasien 🌏','backpacker',true),
  ('11111111-0000-0000-0000-000000000002','max@demo.app','Max',27,'Österreich','Fotograf & Abenteurer ⛰️','adventure',true),
  ('11111111-0000-0000-0000-000000000003','sofia@demo.app','Sofia',22,'Schweiz','Yoga & Beach Life 🏖️','beach',true),
  ('11111111-0000-0000-0000-000000000004','jonas@demo.app','Jonas',30,'Deutschland','Digital Nomad & Kaffee-Fan ☕','city',true),
  ('11111111-0000-0000-0000-000000000005','mia@demo.app','Mia',25,'Niederlande','Roadtrip Queen 🚗','adventure',true),
  ('11111111-0000-0000-0000-000000000006','lukas@demo.app','Lukas',28,'Deutschland','Surfer & Taucher 🤿','beach',true),
  ('11111111-0000-0000-0000-000000000007','anna@demo.app','Anna',23,'Österreich','Stadtentdeckerin & Foodie 🍜','city',true),
  ('11111111-0000-0000-0000-000000000008','felix@demo.app','Felix',26,'Schweiz','Bergsteiger & Skifahrer ⛷️','adventure',true),
  ('11111111-0000-0000-0000-000000000009','sara@demo.app','Sara',29,'Deutschland','Solo Traveler & Buchautorin 📚','backpacker',true),
  ('11111111-0000-0000-0000-000000000010','tom@demo.app','Tom',31,'Österreich','Weltenbummler seit 10 Jahren ✈️','backpacker',true)
on conflict (id) do nothing;

-- Interests
insert into user_interests (user_id, interest) values
  ('11111111-0000-0000-0000-000000000001','🏄 Surfen'),
  ('11111111-0000-0000-0000-000000000001','📸 Fotografie'),
  ('11111111-0000-0000-0000-000000000001','🍜 Street Food'),
  ('11111111-0000-0000-0000-000000000002','⛰️ Wandern'),
  ('11111111-0000-0000-0000-000000000002','📸 Fotografie'),
  ('11111111-0000-0000-0000-000000000003','🧘 Yoga'),
  ('11111111-0000-0000-0000-000000000003','🏄 Surfen'),
  ('11111111-0000-0000-0000-000000000004','🎵 Musik'),
  ('11111111-0000-0000-0000-000000000004','🍜 Street Food'),
  ('11111111-0000-0000-0000-000000000005','🚴 Fahrrad'),
  ('11111111-0000-0000-0000-000000000005','🎨 Kunst')
on conflict do nothing;

-- Destinations
insert into travel_destinations (user_id, country, city) values
  ('11111111-0000-0000-0000-000000000001','Thailand','Bangkok'),
  ('11111111-0000-0000-0000-000000000001','Indonesien','Bali'),
  ('11111111-0000-0000-0000-000000000002','Japan','Tokio'),
  ('11111111-0000-0000-0000-000000000002','Neuseeland',null),
  ('11111111-0000-0000-0000-000000000003','Australien','Sydney'),
  ('11111111-0000-0000-0000-000000000004','Portugal','Lissabon'),
  ('11111111-0000-0000-0000-000000000005','Spanien','Barcelona'),
  ('11111111-0000-0000-0000-000000000006','Indonesien','Bali'),
  ('11111111-0000-0000-0000-000000000007','Frankreich','Paris'),
  ('11111111-0000-0000-0000-000000000008','Schweiz','Zermatt');

-- Demo group
insert into groups (id, name, description, destination, is_public, created_by) values
  ('aaaaaaaa-0000-0000-0000-000000000001','Backpacker Asien 2025','Gemeinsam durch Thailand, Vietnam & Bali','Südostasien',true,'11111111-0000-0000-0000-000000000001')
on conflict do nothing;

insert into group_members (group_id, user_id, role, status, joined_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','admin','active',now()),
  ('aaaaaaaa-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002','member','active',now()),
  ('aaaaaaaa-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000003','member','active',now()),
  ('aaaaaaaa-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000006','member','invited',null)
on conflict do nothing;
