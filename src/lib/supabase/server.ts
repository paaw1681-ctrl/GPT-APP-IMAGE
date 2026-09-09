import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/db/types";

/**
 * Klient Supabase związany z sesją zalogowanego użytkownika (cookies).
 * Wszystkie operacje przez ten klient przechodzą przez RLS — to jest
 * rzeczywista granica bezpieczeństwa aplikacji, nie tylko warstwa UI.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Wywołane z Server Component bez możliwości zapisu cookie — sesję
          // odświeży proxy.ts przy kolejnym żądaniu.
        }
      },
    },
  });
}
