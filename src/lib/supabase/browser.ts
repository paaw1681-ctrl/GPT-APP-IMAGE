"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db/types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Klient Supabase w przeglądarce — używa publicznego anon key, RLS obowiązuje. */
export function createSupabaseBrowserClient() {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}
