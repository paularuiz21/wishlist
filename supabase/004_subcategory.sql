-- Migración: agregar subcategoría opcional (texto libre, ej. "Zapatillas" para Ropa).
-- Correr una sola vez en el SQL Editor de Supabase (proyecto ya existente).

alter table items add column if not exists subcategory text;
