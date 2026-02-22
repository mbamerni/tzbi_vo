-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Groups Table
create table if not exists groups (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  slug text not null,
  name text not null,
  icon text not null,
  sort_order int not null default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Adhkar Table
create table if not exists adhkar (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
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
  user_id uuid not null,
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

-- Create Policies (Strict RLS for User Only)
create policy "Users can manage their own groups" 
on groups for all 
using (auth.uid() = user_id) 
with check (auth.uid() = user_id);

create policy "Users can manage their own adhkar" 
on adhkar for all 
using (auth.uid() = user_id) 
with check (auth.uid() = user_id);

create policy "Users can manage their own daily_logs" 
on daily_logs for all 
using (auth.uid() = user_id) 
with check (auth.uid() = user_id);

-- Functions to increment count
create or replace function increment_dhikr_log(row_dhikr_id uuid, row_date date, amount int)
returns void as $$
begin
  insert into daily_logs (user_id, dhikr_id, log_date, count)
  values (auth.uid(), row_dhikr_id, row_date, amount)
  on conflict (dhikr_id, log_date)
  do update set count = daily_logs.count + amount;
end;
$$ language plpgsql security invoker;

-- RPC for Reordering Adhkar (Bulk Update to resolve N+1 issue)
create or replace function update_adhkar_order(updates jsonb)
returns boolean as $$
declare
  item jsonb;
begin
  for item in select * from jsonb_array_elements(updates)
  loop
    update adhkar
    set sort_order = (item->>'sort_order')::int
    where id = (item->>'id')::uuid and user_id = auth.uid();
  end loop;
  return true;
exception
  when others then
    raise notice 'Error updating adhkar order: %', sqlerrm;
    return false;
end;
$$ language plpgsql security invoker;

-- Database Trigger for Auto-incrementing sort_order (Resolves Race Condition)
create or replace function set_adhkar_sort_order()
returns trigger as $$
declare
  max_sort int;
begin
  -- Get the current max sort_order for the user's group
  select coalesce(max(sort_order), 0) into max_sort
  from adhkar
  where group_id = new.group_id and user_id = new.user_id;
  
  -- Set the new sort_order
  new.sort_order := max_sort + 1;
  
  return new;
end;
$$ language plpgsql;

create trigger tr_set_adhkar_sort_order
before insert on adhkar
for each row
execute function set_adhkar_sort_order();
