# Wishlist

App personal para guardar artículos que quiero comprar o que me sirven de inspiración.

## Stack

- React + Vite
- Supabase (Postgres + Storage) para persistencia
- Vercel (hosting + serverless function de auto-completado)
- Claude API (Anthropic) para auto-completar datos desde un link o una foto
- PWA instalable (manifest + service worker)

## Setup local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear un proyecto en [supabase.com](https://supabase.com) (plan free alcanza).

3. En el SQL Editor de Supabase, correr el contenido de `supabase/schema.sql` — crea la tabla `items` y el bucket de Storage `item-photos`.

4. Copiar `.env.example` a `.env.local` y completar:

   ```
   VITE_SUPABASE_URL=...       # Project Settings → API → Project URL
   VITE_SUPABASE_ANON_KEY=...  # Project Settings → API → anon public key
   ANTHROPIC_API_KEY=...       # console.anthropic.com → API Keys
   ```

5. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Nota: `npm run dev` (Vite) sirve el frontend pero no ejecuta `api/extract.js` (esa función corre en Vercel). Para probar el auto-completado en local hace falta `vercel dev` (requiere `npm i -g vercel` y `vercel link`), o simplemente probarlo una vez deployado.

## Deploy en Vercel

1. Subir el repo a GitHub (ya hecho si seguiste el flujo con Claude Code).
2. En [vercel.com](https://vercel.com) → Add New Project → importar el repo.
3. Vercel detecta Vite automáticamente. Antes de deployar, agregar las variables de entorno (Settings → Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
4. Deploy. La app queda accesible en `https://<proyecto>.vercel.app`.
5. Desde el celular: abrir esa URL en el navegador → menú → "Agregar a pantalla de inicio" (o el navegador ofrece instalarla como PWA automáticamente).

## Estructura

```
src/
  components/   # ItemCard, ItemForm, Tabs, Toolbar, CategoryChip, ConfirmDialog
  lib/           # supabase client, categories, items (CRUD)
  App.jsx        # estado y wiring principal
api/
  extract.js     # función serverless: auto-completa desde link (web fetch) o foto (vision)
supabase/
  schema.sql     # tabla items + bucket de storage
```

## Notas de diseño

- `owner_id` está modelado en la tabla `items` desde el día uno (nullable, sin usar todavía) para no tener que migrar el esquema cuando se agregue soporte multi-usuario.
- Las categorías están centralizadas en `src/lib/categories.js` — agregar una nueva es una sola entrada ahí.
