import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey)

if (!supabaseConfigured) {
  console.warn(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Configuralas en .env.local (ver .env.example).'
  )
}

// Con placeholders válidos si faltan las env vars, para que createClient no
// tire un error sincrónico y rompa el render de toda la app — el error real
// se muestra en pantalla cuando falla la primera query (ver App.jsx).
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key'
)
