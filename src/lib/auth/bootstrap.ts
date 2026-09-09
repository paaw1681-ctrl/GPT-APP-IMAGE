import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { WORKSPACE_ID } from "@/lib/auth/session";

/**
 * Dopisuje nowego, allowlistowanego użytkownika do wspólnego workspace'u
 * Oak & Oats przy pierwszym logowaniu. Wymaga service_role, bo przed
 * istnieniem tego wiersza RLS słusznie odmawia insertu (sekcja 5 — jeden
 * wspólny workspace dla obu osób, bez publicznej rejestracji).
 */
export async function ensureWorkspaceMembership(userId: string, email: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return;

  await admin.from("workspace_members").insert({
    workspace_id: WORKSPACE_ID,
    user_id: userId,
    role: "member",
    display_name: email.split("@")[0],
  });
}
