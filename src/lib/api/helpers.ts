import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/env";
import { WORKSPACE_ID } from "@/lib/auth/session";
import { BudgetExceededError } from "@/lib/cost/budget";

export function apiError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/** Wspólna autoryzacja dla tras API: zwraca klienta Supabase + zalogowanego, allowlistowanego użytkownika. */
export async function requireApiUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isEmailAllowed(user.email)) {
    return { error: apiError(401, "Musisz być zalogowany, aby wykonać tę operację.") } as const;
  }

  return { supabase, user, workspaceId: WORKSPACE_ID } as const;
}

/** Ujednolica błędy w handlerach API — nigdy nie ujawnia surowej odpowiedzi providera ani stack trace'a. */
export function handleApiError(err: unknown) {
  if (err instanceof BudgetExceededError) {
    return apiError(402, err.message);
  }
  console.error(err);
  const message = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.";
  const safe = message.length < 300 && !message.includes("at ") ? message : "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
  return apiError(500, safe);
}
