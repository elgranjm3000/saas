import { createClient } from '@supabase/supabase-js'

// Cliente con service role: SOLO para lógica de servidor (route handlers / server
// actions / edge functions). By-pasea RLS; jamás se expone al navegador.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
