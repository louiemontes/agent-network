-- Run this in your Supabase SQL Editor to set up the test schema.
-- The mcp-gateway uses the service role key so it bypasses RLS,
-- but RLS is still good practice if you ever expose this table other ways.

-- ─── Table ───────────────────────────────────────────────────────────────────
create table if not exists notes (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid not null,
  content     text not null,
  created_at  timestamptz default now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table notes enable row level security;

-- Users can only see and modify their own notes
-- (service role bypasses this, but good to have)
create policy "Users manage own notes"
  on notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Seed a test user + note (optional) ──────────────────────────────────────
-- Go to Authentication > Users in the Supabase dashboard and create a user,
-- then grab their UUID and run:
--
-- insert into notes (user_id, content)
-- values ('your-user-uuid-here', 'First note from seed');
