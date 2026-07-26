-- Migración: pasar de una foto por artículo a una galería de fotos.
-- Correr una sola vez en el SQL Editor de Supabase (proyecto ya existente).

alter table items add column if not exists photo_urls text[] not null default '{}';
alter table items drop column if exists photo_url;
