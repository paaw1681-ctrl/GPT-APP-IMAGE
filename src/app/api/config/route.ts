import { NextResponse } from "next/server";
import { requireApiUser, handleApiError } from "@/lib/api/helpers";

/** Konfiguracja UI: kategorie produktu i konteksty odbiorcy — z bazy, nie z kodu (sekcja 11/16). */
export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, workspaceId } = auth;

  const [{ data: productTypes, error: e1 }, { data: audienceContexts, error: e2 }] = await Promise.all([
    supabase
      .from("product_types")
      .select("id, key, label_pl, is_default")
      .eq("workspace_id", workspaceId)
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("audience_contexts")
      .select("id, key, label_pl")
      .eq("workspace_id", workspaceId)
      .eq("active", true)
      .order("sort_order"),
  ]);

  if (e1 || e2) return handleApiError(e1 ?? e2);
  return NextResponse.json({ productTypes, audienceContexts });
}
