-- Run this in Supabase SQL Editor to create your tables

-- Reports table
create table reports (
  id uuid default gen_random_uuid() primary key,
  zone_id integer not null,
  severity text not null check (severity in ('danger', 'caution', 'safe')),
  text text default 'Sin comentario',
  upvotes integer default 0,
  created_at timestamptz default now()
);

-- Index for fast zone lookups
create index idx_reports_zone on reports (zone_id, created_at desc);

-- Index for expiry queries (only show last 4 hours)
create index idx_reports_recent on reports (created_at desc);

-- Enable real-time for reports table
alter publication supabase_realtime add table reports;

-- Row Level Security: anyone can read, anyone can insert
-- (no auth required for MVP — add auth later)
alter table reports enable row level security;

create policy "Anyone can read reports"
  on reports for select
  using (true);

create policy "Anyone can insert reports"
  on reports for insert
  with check (true);

create policy "Anyone can update upvotes"
  on reports for update
  using (true)
  with check (true);

-- Optional: auto-delete old reports (run as a cron job or pg_cron)
-- delete from reports where created_at < now() - interval '24 hours';
