import { NextResponse } from "next/server";
import { handleApiError, requireApiUser } from "@/lib/api/helpers";
import { WORKSPACE_ID } from "@/lib/auth/session";

/** Publikuje wersję promptu; poprzednia opublikowana wraca do statusu archived — rollback zawsze możliwy (sekcja 58). */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { id } = await ctx.params;

  await supabase
    .from("prompt_versions")
    .update({ status: "archived" })
    .eq("workspace_id", WORKSPACE_ID)
    .eq("status", "published");

  const { error } = await supabase
    .from("prompt_versions")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return handleApiError(error);
  return NextResponse.json({ ok: true });
}
