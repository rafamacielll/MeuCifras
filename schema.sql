-- MeuCifras - banco compartilhado sem login
-- A aplicação usa a chave pública do Supabase e Row Level Security.

create extension if not exists pgcrypto;

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
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
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlist_songs (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (playlist_id, song_id)
);

alter table public.songs enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_songs enable row level security;

grant select, insert, update, delete on public.songs to anon, authenticated;
grant select, insert, update, delete on public.playlists to anon, authenticated;
grant select, insert, update, delete on public.playlist_songs to anon, authenticated;

create policy "songs_public_select" on public.songs for select to anon, authenticated using (true);
create policy "songs_public_insert" on public.songs for insert to anon, authenticated with check (true);
create policy "songs_public_update" on public.songs for update to anon, authenticated using (true) with check (true);
create policy "songs_public_delete" on public.songs for delete to anon, authenticated using (true);

create policy "playlists_public_select" on public.playlists for select to anon, authenticated using (true);
create policy "playlists_public_insert" on public.playlists for insert to anon, authenticated with check (true);
create policy "playlists_public_update" on public.playlists for update to anon, authenticated using (true) with check (true);
create policy "playlists_public_delete" on public.playlists for delete to anon, authenticated using (true);

create policy "playlist_songs_public_select" on public.playlist_songs for select to anon, authenticated using (true);
create policy "playlist_songs_public_insert" on public.playlist_songs for insert to anon, authenticated with check (true);
create policy "playlist_songs_public_delete" on public.playlist_songs for delete to anon, authenticated using (true);
