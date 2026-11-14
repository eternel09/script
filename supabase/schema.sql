-- =====================================================================
-- Vitrine des Talents — schéma Supabase
-- À exécuter une seule fois dans Supabase > SQL Editor > New query > Run.
-- Le script est ré-exécutable (idempotent) sans perte de données.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Types ----------
do $$ begin
  create type talent_category as enum (
    'professionnels', 'entrepreneurs', 'tech', 'arts', 'etudiants'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type talent_status as enum ('published', 'pending', 'hidden');
exception when duplicate_object then null; end $$;

-- ---------- Table principale ----------
create table if not exists talents (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,          -- ex. grace-mbuyi-7f3a
  full_name      text not null check (char_length(full_name) between 2 and 80),
  specialty      text not null check (char_length(specialty) between 2 and 80),
  category       talent_category not null,
  offer          text not null check (char_length(offer) <= 240),
  seeking        text check (char_length(seeking) <= 160),
  location       text,                           -- quartier / commune, facultatif
  whatsapp       text not null,                  -- format E.164, ex. +243812345678
  email          text,
  link           text,                           -- LinkedIn ou portfolio
  photo_url      text,
  consent        boolean not null default false,
  status         talent_status not null default 'published',
  edit_code_hash text not null,
  is_demo        boolean not null default false, -- profils de démonstration (SEED_DEMO)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table talents add column if not exists is_demo boolean not null default false;

create unique index if not exists talents_whatsapp_idx on talents (whatsapp);
create index if not exists talents_status_created_idx on talents (status, created_at desc);

-- updated_at automatique
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists talents_updated_at on talents;
create trigger talents_updated_at before update on talents
  for each row execute function set_updated_at();

-- ---------- Tentatives (anti-spam et blocage des codes) ----------
-- Une ligne par création de carte (clé "create:<ip>") ou par code faux
-- (clé "fail:<numéro>"). Utilisée uniquement côté serveur (service_role).
create table if not exists attempts (
  id         bigint generated always as identity primary key,
  key        text not null,
  created_at timestamptz not null default now()
);
create index if not exists attempts_key_created_idx on attempts (key, created_at desc);

-- ---------- Sécurité : RLS ----------
alter table talents  enable row level security;
alter table attempts enable row level security;

-- Lecture publique : seulement les cartes publiées.
drop policy if exists "Lecture publique des cartes publiées" on talents;
create policy "Lecture publique des cartes publiées" on talents
  for select to anon, authenticated
  using (status = 'published');

-- Le hash du code n'est jamais lisible par les rôles publics :
-- on retire le droit SELECT sur la table et on le rend colonne par colonne.
revoke all on talents from anon, authenticated;
grant select (
  id, slug, full_name, specialty, category, offer, seeking, location,
  whatsapp, email, link, photo_url, status, created_at, updated_at
) on talents to anon, authenticated;

-- Aucune politique sur "attempts" : invisible pour anon/authenticated.
revoke all on attempts from anon, authenticated;

-- Toutes les écritures passent par les routes serveur avec la clé
-- service_role (qui contourne RLS). Aucune politique d'écriture publique.

-- ---------- Stockage : bucket public "photos" ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lecture publique des photos (les URL publiques fonctionnent sans politique,
-- mais on l'explicite). Les envois/suppressions se font avec service_role.
drop policy if exists "Photos lisibles publiquement" on storage.objects;
create policy "Photos lisibles publiquement" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'photos');
