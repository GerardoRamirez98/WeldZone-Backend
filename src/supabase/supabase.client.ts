// src/supabase/supabase.client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Database = any; // Puedes definir tu esquema de base si usas supabase gen types

export function createSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      '⚠️ Faltan variables de entorno: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  // ✅ Cast explícito para evitar advertencias de tipo
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false },
  });

  return client;
}
