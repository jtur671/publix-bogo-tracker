-- Publix BOGO Tracker: Initial Schema

-- watchlist table
create table if not exists watchlist (
  id uuid default gen_random_uuid() primary key,
  keyword text not null unique,
  added_at timestamptz default now(),
  last_matched_deal_id int,
  last_notified_at timestamptz
);

-- settings table (single row for household)
create table if not exists settings (
  id int default 1 primary key check (id = 1),
  zip_code text not null default '34695',
  store_name text,
  updated_at timestamptz default now()
);

-- push subscriptions table
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz default now()
);

-- Insert default settings row
insert into settings (id, zip_code) values (1, '34695')
on conflict (id) do nothing;

-- Enable realtime for watchlist and settings
alter publication supabase_realtime add table watchlist;
alter publication supabase_realtime add table settings;

-- Row Level Security (permissive for MVP — no auth)
alter table watchlist enable row level security;
alter table settings enable row level security;
alter table push_subscriptions enable row level security;

create policy "Allow all access to watchlist" on watchlist for all using (true) with check (true);
create policy "Allow all access to settings" on settings for all using (true) with check (true);
create policy "Allow all access to push_subscriptions" on push_subscriptions for all using (true) with check (true);
