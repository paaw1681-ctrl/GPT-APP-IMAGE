import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv, getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/db/types";

/**
 * Klient z kluczem service_role — omija RLS. Używać WYŁĄCZNIE tam, gdzie to
 * konieczne i bezpieczne:
 *  - dopisanie nowego allowlistowanego użytkownika do workspace_members przy
 *    pierwszym logowaniu (przed tym momentem RLS słusznie blokuje insert),
 *  - generowanie signed URL do prywatnego storage,
 *  - zadania cron bez sesji użytkownika (kurs walut, sprzątanie prototypów).
 * Import "server-only" gwarantuje błąd builda, jeśli plik trafi do bundla klienta.
 */
export function createSupabaseAdminClient() {
  const env = getServerEnv();
  const { supabaseUrl } = getPublicEnv();
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Brak SUPABASE_SERVICE_ROLE_KEY — ta operacja wymaga klucza service_role ustawionego w zmiennych środowiskowych serwera.",
    );
  }
  return createClient<Database>(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
