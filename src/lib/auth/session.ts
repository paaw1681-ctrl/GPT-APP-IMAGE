import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/env";

export const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string | null;
}

/**
 * Zwraca zalogowanego, allowlistowanego użytkownika albo null.
 * Nie przekierowuje — do użycia tam, gdzie strona ma własną logikę dla gościa.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email || !isEmailAllowed(user.email)) {
    return null;
  }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("display_name")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    displayName: member?.display_name ?? null,
  };
}

/** Wymaga zalogowanego, allowlistowanego użytkownika — inaczej przekierowuje do logowania. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/logowanie");
  }
  return user;
}
