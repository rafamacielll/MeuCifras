-- MeuCifras - Supabase schema seguro
-- Execute no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artist text not null,
  genre text not null,
  song_key text,
  bpm text,
  notes text,
  chords text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlist_songs (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (playlist_id, song_id)
);

create index if not exists songs_user_title_idx on public.songs(user_id, title);
create index if not exists playlists_user_name_idx on public.playlists(user_id, name);
create index if not exists playlist_songs_user_idx on public.playlist_songs(user_id);

alter table public.songs enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_songs enable row level security;

drop policy if exists "songs_select_own" on public.songs;
drop policy if exists "songs_insert_own" on public.songs;
drop policy if exists "songs_update_own" on public.songs;
drop policy if exists "songs_delete_own" on public.songs;

create policy "songs_select_own"
on public.songs for select
to authenticated
using (auth.uid() = user_id);

create policy "songs_insert_own"
on public.songs for insert
to authenticated
with check (auth.uid() = user_id);

create policy "songs_update_own"
on public.songs for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "songs_delete_own"
on public.songs for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "playlists_select_own" on public.playlists;
drop policy if exists "playlists_insert_own" on public.playlists;
drop policy if exists "playlists_update_own" on public.playlists;
drop policy if exists "playlists_delete_own" on public.playlists;

create policy "playlists_select_own"
on public.playlists for select
to authenticated
using (auth.uid() = user_id);

create policy "playlists_insert_own"
on public.playlists for insert
to authenticated
with check (auth.uid() = user_id);

create policy "playlists_update_own"
on public.playlists for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "playlists_delete_own"
on public.playlists for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "playlist_songs_select_own" on public.playlist_songs;
drop policy if exists "playlist_songs_insert_own" on public.playlist_songs;
drop policy if exists "playlist_songs_delete_own" on public.playlist_songs;

create policy "playlist_songs_select_own"
on public.playlist_songs for select
to authenticated
using (auth.uid() = user_id);

create policy "playlist_songs_insert_own"
on public.playlist_songs for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  )
  and exists (
    select 1 from public.songs s
    where s.id = song_id and s.user_id = auth.uid()
  )
);

create policy "playlist_songs_delete_own"
on public.playlist_songs for delete
to authenticated
using (auth.uid() = user_id);
