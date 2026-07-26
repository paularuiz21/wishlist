-- Wishlist — esquema inicial
-- Ejecutar en el SQL Editor de Supabase (proyecto nuevo o existente).

create extension if not exists "pgcrypto";

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  -- owner_id: no se usa aún (v1 = un solo usuario implícito), pero se modela
  -- desde el principio para no tener que migrar el esquema cuando se sume
  -- soporte multi-usuario. Nullable por ahora.
  owner_id uuid,
  link text,
  photo_urls text[] not null default '{}',
  title text,
  description text,
  notes text,
  price numeric,
  currency text check (currency in ('ARS', 'USD', 'EUR', 'GBP', 'BRL')),
  category text not null default 'Otros',
  purchased boolean not null default false,
  purchased_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists items_purchased_idx on items (purchased);
create index if not exists items_category_idx on items (category);
create index if not exists items_created_at_idx on items (created_at desc);

-- RLS: deshabilitado en v1 (single-user, anon key). Al sumar multi-usuario,
-- habilitar RLS y agregar políticas por owner_id / auth.uid().
alter table items disable row level security;

-- Storage bucket para las fotos de producto (subidas por el usuario o
-- descargadas durante el auto-completado).
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

-- CREATE POLICY no soporta IF NOT EXISTS en Postgres; se usa drop-then-create
-- para que el script sea seguro de correr más de una vez.
drop policy if exists "item-photos public read" on storage.objects;
create policy "item-photos public read"
  on storage.objects for select
  using (bucket_id = 'item-photos');

drop policy if exists "item-photos anon insert" on storage.objects;
create policy "item-photos anon insert"
  on storage.objects for insert
  with check (bucket_id = 'item-photos');
