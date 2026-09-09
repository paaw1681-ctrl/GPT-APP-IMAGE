import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  product_type_id: z.string().uuid().optional(),
  product_type_label: z.string().max(120).optional(),
  audience_context_id: z.string().uuid().nullable().optional(),
  variant_name: z.string().max(120).nullable().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { id } = await ctx.params;

  const { data: product, error } = await supabase
    .from("products")
    .select(
      "*, product_types(id, key, label_pl), audience_contexts(id, key, label_pl), product_references(*), product_profiles(*)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return handleApiError(error);
  if (!product) return apiError(404, "Nie znaleziono produktu.");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, status, created_at")
    .eq("product_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ product, sessions: sessions ?? [] });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const { id } = await ctx.params;

  const json = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane.");

  const { data, error } = await supabase
    .from("products")
    .update({ ...parsed.data, updated_by: user.id })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return handleApiError(error);
  if (!data) return apiError(404, "Nie znaleziono produktu.");
  return NextResponse.json({ ok: true });
}
