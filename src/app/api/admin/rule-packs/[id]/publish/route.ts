import { NextResponse } from "next/server";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { WORKSPACE_ID } from "@/lib/auth/session";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { id } = await ctx.params;

  const { data: pack } = await supabase
    .from("product_rule_packs")
    .select("id, product_type_id")
    .eq("id", id)
    .maybeSingle();
  if (!pack) return apiError(404, "Nie znaleziono Rule Packa.");

  await supabase
    .from("product_rule_packs")
    .update({ status: "archived" })
    .eq("workspace_id", WORKSPACE_ID)
    .eq("product_type_id", pack.product_type_id)
    .eq("status", "published");

  const { error } = await supabase
    .from("product_rule_packs")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return handleApiError(error);
  return NextResponse.json({ ok: true });
}
