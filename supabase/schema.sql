-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Groups Table
create table if not exists groups (
  id uuid default uuid_generate_v4() primary key,
  slug text not null unique,
  name text not null,
  icon text not null,
  sort_order int not null default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Adhkar Table
create table if not exists adhkar (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups(id) on delete cascade,
  text text not null,
  virtue text,
  target_count int not null default 33,
  sort_order int not null default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Daily Logs Table
create table if not exists daily_logs (
  id uuid default uuid_generate_v4() primary key,
  dhikr_id uuid references adhkar(id) on delete cascade,
  count int not null default 0,
  log_date date not null default CURRENT_DATE,
  manual_entry boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(dhikr_id, log_date)
);

-- Enable RLS (Row Level Security)
alter table groups enable row level security;
alter table adhkar enable row level security;
alter table daily_logs enable row level security;

-- Create Policies (Public Read/Write for prototype - In production, restrict write)
create policy "Public Read Groups" on groups for select using (true);
create policy "Public Read Adhkar" on adhkar for select using (true);
create policy "Public Read Logs" on daily_logs for select using (true);
create policy "Public Insert Logs" on daily_logs for insert with check (true);
create policy "Public Update Logs" on daily_logs for update using (true);

-- Functions to increment count
create or replace function increment_dhikr_log(row_dhikr_id uuid, row_date date, amount int)
returns void as $$
begin
  insert into daily_logs (dhikr_id, log_date, count)
  values (row_dhikr_id, row_date, amount)
  on conflict (dhikr_id, log_date)
  do update set count = daily_logs.count + amount;
end;
$$ language plpgsql;

-- Initial Data Seeding (Clear existing first to avoid dupes if re-run on clean db)
-- Note: This is a devastating command for existing data, but okay for prototype init.
truncate table daily_logs cascade;
truncate table adhkar cascade;
truncate table groups cascade;

-- Insert Groups
insert into groups (id, slug, name, icon, sort_order) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'morning', 'أذكار الصباح', 'sun', 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'after-fajr', 'بعد صلاة الفجر', 'sunrise', 2),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'evening', 'أذكار المساء', 'moon', 3),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'after-prayer', 'بعد الصلاة', 'mosque', 4);

-- Insert Adhkar (Morning)
insert into adhkar (group_id, text, virtue, target_count, sort_order) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'سُبْحَانَ اللهِ وَبِحَمْدِهِ', 'قال رسول الله ﷺ: من قال سبحان الله وبحمده في يوم مائة مرة حُطّت خطاياه وإن كانت مثل زبد البحر.', 33, 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'الحَمْدُ لِلَّهِ', 'الحمد لله تملأ الميزان، وسبحان الله والحمد لله تملآن ما بين السماوات والأرض.', 33, 2),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'اللَّهُ أَكْبَرُ', 'التكبير من أحب الكلام إلى الله.', 33, 3),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'لَا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', 'من قالها عشر مرات كان كمن أعتق أربعة أنفس من ولد إسماعيل.', 10, 4);

-- Insert Adhkar (After Fajr)
insert into adhkar (group_id, text, virtue, target_count, sort_order) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'أَسْتَغْفِرُ اللهَ', 'الاستغفار سبب لمغفرة الذنوب وسعة الرزق.', 3, 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الجَلَالِ وَالإِكْرَامِ', 'كان النبي ﷺ إذا سلّم من الصلاة قال هذا الذكر.', 1, 2),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'سُبْحَانَ اللهِ', 'التسبيح من أحب الكلام إلى الله سبحانه وتعالى.', 33, 3);

-- Insert Adhkar (Evening)
insert into adhkar (group_id, text, virtue, target_count, sort_order) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', 'من قالها حين يمسي ثلاث مرات لم تضره حمة تلك الليلة.', 3, 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ العَلِيمُ', 'من قالها ثلاث مرات لم تصبه فجأة بلاء.', 3, 2),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ المَصِيرُ', 'ذكر المساء المأثور عن النبي ﷺ.', 1, 3);

-- Insert Adhkar (After Prayer)
insert into adhkar (group_id, text, virtue, target_count, sort_order) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'سُبْحَانَ اللهِ', 'التسبيح بعد كل صلاة ثلاثاً وثلاثين.', 33, 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'الحَمْدُ لِلَّهِ', 'التحميد بعد كل صلاة ثلاثاً وثلاثين.', 33, 2),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'اللَّهُ أَكْبَرُ', 'التكبير بعد كل صلاة أربعاً وثلاثين.', 34, 3);
