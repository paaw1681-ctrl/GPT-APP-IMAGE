import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";

const lockSchema = z.object({
  profileId: z.string().uuid(),
  product_type_id: z.string().uuid(),
  audience_context_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  variant_name: z.string().max(120).nullable().optional(),
  letters: z.string().max(200).nullable().optional(),
  engraving: z.string().max(200).nullable().optional(),
});

/** Potwierdzenie Product Lock przez użytkownika (sekcje 10, 15) — od tej chwili profil jest "prawdą" dla generatora. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const { id: productId } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = lockSchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane potwierdzenia.");

  const { data: profile, error: profileErr } = await supabase
    .from("product_profiles")
    .update({
      status: "confirmed",
      letters: parsed.data.letters,
      engraving: parsed.data.engraving,
      variant_name: parsed.data.variant_name,
      updated_by: user.id,
    })
    .eq("id", parsed.data.profileId)
    .eq("product_id", productId)
    .select("id")
    .maybeSingle();

  if (profileErr) return handleApiError(profileErr);
  if (!profile) return apiError(404, "Nie znaleziono profilu produktu do potwierdzenia.");

  const { error: productErr } = await supabase
    .from("products")
    .update({
      product_type_id: parsed.data.product_type_id,
      audience_context_id: parsed.data.audience_context_id,
      name: parsed.data.name,
      variant_name: parsed.data.variant_name,
      status: "active",
      updated_by: user.id,
    })
    .eq("id", productId);

  if (productErr) return handleApiError(productErr);

  return NextResponse.json({ ok: true });
}
