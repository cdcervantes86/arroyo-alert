-- Run this in Supabase SQL Editor to add push notification support

-- Push subscriptions table
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  zone_id integer not null,
  subscription jsonb not null,
  created_at timestamptz default now()
);

-- Index for fast zone lookups when sending notifications
create index if not exists idx_push_zone on push_subscriptions (zone_id);

-- Unique constraint: one subscription per zone per endpoint
create unique index if not exists idx_push_unique 
  on push_subscriptions (zone_id, (subscription->>'endpoint'));

-- RLS policies
alter table push_subscriptions enable row level security;

create policy "Anyone can read subscriptions"
  on push_subscriptions for select using (true);

create policy "Anyone can insert subscriptions"
  on push_subscriptions for insert with check (true);

create policy "Anyone can delete own subscriptions"
  on push_subscriptions for delete using (true);
