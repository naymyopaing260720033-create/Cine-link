-- Run once in the Supabase SQL Editor. No public policies are added; only the server-side service role writes these logs.
create table if not exists public.telegram_audit_events (
  id bigint generated always as identity primary key,
  event_key text not null unique,
  event_status text not null check (event_status in ('published', 'rejected', 'retryable_failure')),
  source_channel_id bigint,
  source_message_id bigint,
  content_type text check (content_type in ('movie', 'episode')),
  tmdb_id integer,
  season_number integer,
  episode_number integer,
  reason_code text,
  created_at timestamptz not null default now()
);

alter table public.telegram_audit_events enable row level security;
