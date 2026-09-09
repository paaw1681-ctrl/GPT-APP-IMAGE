import { NextResponse } from "next/server";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { getTextVisionProvider } from "@/lib/ai/router";
import { recordCost } from "@/lib/cost/ledger";
import { assertBudgetAllows } from "@/lib/cost/budget";
import { BUCKET } from "@/lib/storage/paths";
import { WORKSPACE_ID } from "@/lib/auth/session";

export const maxDuration = 60;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const { id: productId } = await ctx.params;

  const [{ data: references, error: refErr }, { data: productTypes }, { data: audienceContexts }] = await Promise.all([
    supabase
      .from("product_references")
      .select("id, storage_path_working, role, mime_type")
      .eq("product_id", productId)
      .order("sort_order"),
    supabase.from("product_types").select("id, key, label_pl").eq("workspace_id", WORKSPACE_ID).eq("active", true),
    supabase.from("audience_contexts").select("id, key, label_pl").eq("workspace_id", WORKSPACE_ID).eq("active", true),
  ]);

  if (refErr) return handleApiError(refErr);
  if (!references || references.length === 0) {
    return apiError(400, "Dodaj co najmniej jedno zdjęcie referencyjne przed analizą.");
  }

  try {
    await assertBudgetAllows(supabase);

    const referenceInputs = await Promise.all(
      references.map(async (r) => {
        const { data, error } = await supabase.storage.from(BUCKET).download(r.storage_path_working);
        if (error || !data) throw new Error("Nie udało się wczytać zdjęcia referencyjnego.");
        const buffer = Buffer.from(await data.arrayBuffer());
        return {
          id: r.id,
          base64: buffer.toString("base64"),
          mimeType: r.mime_type,
          role: r.role as "master" | "supporting",
        };
      }),
    );

    const { provider, models } = await getTextVisionProvider(supabase);
    const { result, usage } = await provider.analyzeProduct({
      references: referenceInputs,
      productTypeOptions: (productTypes ?? []).map((t) => ({ key: t.key, label: t.label_pl })),
      audienceOptions: (audienceContexts ?? []).map((t) => ({ key: t.key, label: t.label_pl })),
    });

    await recordCost(supabase, {
      jobId: null,
      model: models.productAnalysis,
      usage,
      userId: user.id,
      category: "vision",
    });

    const matchedType = (productTypes ?? []).find((t) => t.key === result.product_type_key);
    const matchedAudience = (audienceContexts ?? []).find((t) => t.key === result.audience_context_key);
    const masterRef = referenceInputs[Math.min(result.suggested_master_reference_index, referenceInputs.length - 1)];

    const { data: existingProfile } = await supabase
      .from("product_profiles")
      .select("id, version")
      .eq("product_id", productId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (existingProfile?.version ?? 0) + 1;

    const { data: profile, error: profileErr } = await supabase
      .from("product_profiles")
      .insert({
        product_id: productId,
        version: nextVersion,
        status: "draft",
        product_name: result.product_name,
        product_family: null,
        variant_name: result.variant_name,
        materials: result.materials,
        main_colors: result.main_colors,
        secondary_colors: result.secondary_colors,
        element_count: result.element_count,
        element_sequence: result.element_sequence,
        shapes: result.shapes,
        relative_sizes: { text: result.relative_sizes },
        wooden_elements: result.wooden_elements,
        silicone_elements: result.silicone_elements,
        cord: { text: result.cord },
        clasp: { text: result.clasp },
        hardware: result.hardware,
        text_elements: result.text_elements,
        letters: result.letters,
        engraving: result.engraving,
        personalization: { detected: result.personalization_detected },
        critical_features: result.critical_features,
        usage: result.usage,
        forbidden_transformations: result.forbidden_transformations,
        safety_context: result.safety_context,
        notes: result.notes,
        uncertain_fields: result.uncertain_fields,
        analysis_confidence: result.analysis_confidence,
        analyzer_model: models.productAnalysis.modelId,
        raw: result,
        reference_quality_status: result.reference_quality_status,
        reference_quality_notes: result.reference_quality_notes,
        master_reference_id: masterRef?.id ?? null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();

    if (profileErr) return handleApiError(profileErr);

    await supabase
      .from("products")
      .update({
        product_type_id: matchedType?.id ?? null,
        product_type_label: matchedType?.label_pl ?? result.product_type_key,
        product_type_confidence: result.product_type_confidence,
        audience_context_id: matchedAudience?.id ?? null,
        name: result.product_name,
        updated_by: user.id,
      })
      .eq("id", productId);

    if (masterRef) {
      await supabase
        .from("product_references")
        .update({ role: "supporting" })
        .eq("product_id", productId)
        .neq("id", masterRef.id);
      await supabase.from("product_references").update({ role: "master" }).eq("id", masterRef.id);
    }

    return NextResponse.json({ profileId: profile.id, profile: result });
  } catch (err) {
    return handleApiError(err);
  }
}
