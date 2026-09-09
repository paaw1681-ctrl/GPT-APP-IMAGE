import { z } from "zod";

const SUPABASE_URL = "https://tutuzaxlovtthiqubkgi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_50uN_8Y6wGM257dnh9TMnA_loCsQs2h";

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  USE_MOCK_AI: z
    .string()
    .optional()
    .transform((v) => v !== "false"),
  ENABLE_PAID_AI: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  ALLOWED_USER_EMAILS: z.string().min(1),
  APP_BASE_URL: z.string().url().optional(),
  CRON_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

/** Waliduje env raz, przy pierwszym użyciu na serwerze. Rzuca czytelny błąd po polsku. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Brakuje wymaganych zmiennych środowiskowych: ${missing}. Sprawdź .env.example.`,
    );
  }
  if (parsed.data.ENABLE_PAID_AI && !parsed.data.OPENAI_API_KEY) {
    throw new Error(
      "ENABLE_PAID_AI=true wymaga ustawienia OPENAI_API_KEY. Ustaw klucz albo wyłącz płatne AI.",
    );
  }

  cached = parsed.data;
  return cached;
}

export function getAllowedEmails(): string[] {
  return getServerEnv()
    .ALLOWED_USER_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAllowedEmails().includes(email.trim().toLowerCase());
}

/**
 * Publiczna konfiguracja projektu Supabase. Klucz publishable jest przeznaczony
 * do użycia w aplikacji przeglądarkowej; bezpieczeństwo zapewniają Auth i RLS.
 */
export function getPublicEnv() {
  return {
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_PUBLISHABLE_KEY,
  };
}
