-- Migración: permitir más monedas además de ARS/USD (EUR, GBP, BRL).
-- Correr una sola vez en el SQL Editor de Supabase (proyecto ya existente).

alter table items drop constraint if exists items_currency_check;
alter table items add constraint items_currency_check
  check (currency in ('ARS', 'USD', 'EUR', 'GBP', 'BRL'));
