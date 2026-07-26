# Wishlist — Documentación del proyecto

Estado: **en producción**, uso personal (sin login todavía).

## Enlaces

| Qué | Dónde |
|---|---|
| App en vivo | https://wishlist-lyart-seven.vercel.app |
| Repositorio | https://github.com/paularuiz21/wishlist |
| Proyecto Vercel | Paula's projects → wishlist |
| Proyecto Supabase | `jengtlsiqwmzmokvmseq` (Project Settings → API para las claves) |

## Stack

- **Frontend:** React + Vite, sin librería de UI (CSS propio en `src/styles.css`)
- **Base de datos:** Supabase (Postgres) — tabla `items`
- **Almacenamiento de fotos:** Supabase Storage, bucket `item-photos` (público)
- **Hosting:** Vercel, con auto-deploy en cada push a `main`
- **Reconocimiento de fotos:** función serverless (`api/extract.js`) que llama a la API de Claude (modelo `claude-sonnet-5`, elegido por costo — es una tarea de extracción simple, no necesita Opus)
- **PWA:** instalable en el celu (`public/manifest.webmanifest` + `public/sw.js`)

## Configuración (variables de entorno)

Configuradas en Vercel → Settings → Environment Variables, y en `.env.local` para desarrollo local (ver `.env.example`):

| Variable | Para qué | Dónde conseguirla |
|---|---|---|
| `VITE_SUPABASE_URL` | Conexión a la base de datos | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Clave pública de acceso | Supabase → Project Settings → API |
| `ANTHROPIC_API_KEY` | Reconocimiento de fotos | console.anthropic.com → API Keys |

*(No se documentan los valores reales acá a propósito — están cargados en Vercel/`.env.local`.)*

## Migraciones de base de datos aplicadas

Corridas en orden en el SQL Editor de Supabase:

1. `supabase/schema.sql` — esquema inicial: tabla `items`, bucket de fotos, políticas de storage
2. `supabase/002_photo_gallery.sql` — de una foto (`photo_url`) a galería (`photo_urls text[]`)
3. `supabase/003_more_currencies.sql` — de ARS/USD a ARS/USD/EUR/GBP/BRL
4. `supabase/004_subcategory.sql` — columna `subcategory` opcional

Para un proyecto Supabase nuevo desde cero, `schema.sql` ya incluye todo lo anterior — no hace falta correr las migraciones 002-004 aparte.

## Funcionalidades (v1)

- Alta/edición/borrado de artículos (con confirmación antes de borrar)
- Galería de fotos por artículo (subida múltiple), guardadas en Storage
- Reconocimiento automático de título/descripción/precio/moneda a partir de las fotos subidas (vía Claude, vision)
- Link del producto como referencia (botón "Ver artículo") — **no** dispara autocompletado, solo las fotos lo hacen
- Categorías con color propio + subcategoría de texto libre opcional
- Filtro de categorías como chips de colores (no dropdown)
- Buscador de texto (título, descripción, subcategoría)
- Orden por precio o fecha
- Estado "comprado" (sale de la lista activa, queda en pestaña "Comprados")
- 5 monedas: ARS, USD, EUR, GBP, BRL
- PWA instalable

## Historial de desarrollo (resumen cronológico)

1. **Scaffold inicial** — Vite + React + Supabase + Vercel + función de auto-completado, deploy funcionando de punta a punta.
2. **Fix:** `CREATE POLICY IF NOT EXISTS` no es sintaxis válida en Postgres → drop-then-create.
3. **Fix:** `vercel.json` con `runtime: "nodejs20.x"` rompía el build → se sacó (Vercel detecta el runtime solo).
4. **Bug largo — auto-completado no llenaba campos.** Varias causas combinadas, resueltas de a una con diagnóstico visible en pantalla:
   - `max_tokens` insuficiente para el modelo (piensa por defecto + tool use).
   - El parseo tomaba el primer bloque de texto de la respuesta en vez del último.
   - La `ANTHROPIC_API_KEY` en Vercel tenía el placeholder de ejemplo sin reemplazar por la key real.
5. **Cambio de modelo:** de `claude-opus-5` a `claude-sonnet-5` para el reconocimiento (mismo resultado esperado, mucho más barato para esta tarea).
6. **Descubrimiento:** sitios pesados en JavaScript (ej. Zara) no siempre devuelven precio/foto vía fetch simple de la página (el contenido se carga dinámicamente). Se probó apuntar al JSON-LD estructurado como mejora, pero finalmente se decidió:
7. **Decisión de producto:** el reconocimiento pasa a depender **solo de las fotos subidas** (más rápido y confiable que ir a buscar la página), y se rediseña de una foto por artículo a una **galería de varias fotos** guardadas en Storage.
8. **Fix:** color del ícono de la PWA muteado (`#57547E`) pero el `theme_color` del manifest había quedado con el índigo original → corregido (afectaba el color de la barra al abrir links externos desde la app instalada).
9. **Categorías como chips de colores** (reemplaza el dropdown) + **subcategoría opcional** (texto libre).
10. **Fix:** scrollbar horizontal visible en la fila de chips de categoría en mobile → ocultado por CSS.

## Pendiente / a definir más adelante

- **Privacidad:** hoy la app es pública sin login — cualquiera con el link ve y puede editar/borrar todo. Si se comparte el link, hace falta agregar autenticación y permisos (no implementado, `owner_id` está modelado en la tabla pero sin usar).
- **Nombre final + dominio:** "Wishlist" es un nombre provisorio. Al definirlo, actualizar `manifest.webmanifest`, `index.html` (title) y considerar un ícono definitivo (el actual es un placeholder generado, cuadrado con una "W").
- **Multi-usuario real:** sumar gente a la misma lista de forma controlada (mencionado en la idea original, no en el alcance de v1).
