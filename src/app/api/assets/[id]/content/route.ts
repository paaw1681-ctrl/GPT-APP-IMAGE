import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { getTextVisionProvider } from "@/lib/ai/router";
import { recordCost } from "@/lib/cost/ledger";
import { WORKSPACE_ID } from "@/lib/auth/session";
import { PHOTO_TYPES } from "@/lib/prompt/photoTypes";

const bodySchema = z.object({ channel: z.enum(["instagram", "meta_ads", "sklep", "pinterest"]) });

/** Content Studio (sekcja 52-53) — WYŁĄCZNIE na podstawie verified_facts, jedna rekomendowana wersja. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const { id: assetId } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowy kanał.");

  const { data: asset } = await supabase
    .from("generated_assets")
    .select("id, product_id, generation_jobs(concept_id)")
    .eq("id", assetId)
    .maybeSingle();
  if (!asset) return apiError(404, "Nie znaleziono obrazu.");

  const conceptId = (asset.generation_jobs as { concept_id: string | null } | null)?.concept_id ?? null;
  const [{ data: concept }, { data: profile }, { data: product }, { data: brand }, { data: verifiedFacts }] =
    await Promise.all([
      conceptId
        ? supabase.from("concepts").select("photo_type").eq("id", conceptId).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("product_profiles")
        .select("product_name, materials")
        .eq("product_id", asset.product_id)
        .eq("status", "confirmed")
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("products").select("name").eq("id", asset.product_id).maybeSingle(),
      supabase.from("brand_profiles").select("content_voice").eq("workspace_id", WORKSPACE_ID).maybeSingle(),
      supabase
        .from("verified_facts")
        .select("value_pl")
        .or(`product_id.eq.${asset.product_id},scope.eq.brand`)
        .eq("workspace_id", WORKSPACE_ID),
    ]);

  try {
    const { provider, models } = await getTextVisionProvider(supabase);
    const photoTypeLabel = PHOTO_TYPES.find((p) => p.key === concept?.photo_type)?.label ?? "zdjęcie produktowe";
    const { result, usage } = await provider.generateContent({
      channel: parsed.data.channel,
      productSummary: `${product?.name ?? ""} — ${profile?.product_name ?? ""}. ${(profile?.materials as string[] | undefined)?.join(", ") ?? ""}`,
      photoType: photoTypeLabel,
      verifiedFacts: (verifiedFacts ?? []).map((f) => f.value_pl),
      brandVoice: brand?.content_voice ?? "ciepły, rzeczowy głos polskiej manufaktury",
    });

    await recordCost(supabase, { jobId: null, model: models.content, usage, userId: user.id, category: "text_output" });

    const { data: contentAsset, error } = await supabase
      .from("content_assets")
      .insert({ asset_id: assetId, channel: parsed.data.channel, payload: result as never, created_by: user.id })
      .select("*")
      .single();

    if (error) return handleApiError(error);
    return NextResponse.json({ content: contentAsset });
  } catch (err) {
    return handleApiError(err);
  }
}
