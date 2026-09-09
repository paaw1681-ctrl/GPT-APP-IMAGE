import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";

const patchSchema = z.object({ role: z.enum(["master", "supporting"]) });

/** Jednym tapnięciem zmień MASTER REFERENCE (sekcja 9). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; refId: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { id: productId, refId } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane.");

  if (parsed.data.role === "master") {
    await supabase.from("product_references").update({ role: "supporting" }).eq("product_id", productId);
  }

  const { error } = await supabase
    .from("product_references")
    .update({ role: parsed.data.role })
    .eq("id", refId)
    .eq("product_id", productId);

  if (error) return handleApiError(error);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; refId: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { id: productId, refId } = await ctx.params;

  const { error } = await supabase.from("product_references").delete().eq("id", refId).eq("product_id", productId);
  if (error) return handleApiError(error);
  return NextResponse.json({ ok: true });
}
