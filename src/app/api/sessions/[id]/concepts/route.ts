import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { getTextVisionProvider } from "@/lib/ai/router";
import { recordCost } from "@/lib/cost/ledger";
import { assertBudgetAllows } from "@/lib/cost/budget";
import { loadRulePack } from "@/lib/prompt/loadRulePack";
import { getRecentScenarios, scenariosToNotes } from "@/lib/generation/scenarioHistory";
import { WORKSPACE_ID } from "@/lib/auth/session";
import { PHOTO_TYPES, defaultAspectFor, defaultPurposeFor } from "@/lib/prompt/photoTypes";

const bodySchema = z.object({
  photoType: z.enum(PHOTO_TYPES.map((p) => p.key) as [string, ...string[]]),
  purpose: z.string().optional(),
  aspectRatio: z.string().optional(),
  featuredSubject: z.string().default("auto"),
  creative: z.boolean().default(false),
  userNote: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const { id: sessionId } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane koncepcji.");

  const { data: session } = await supabase
    .from("sessions")
    .select("id, product_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return apiError(404, "Nie znaleziono sesji.");

  const { data: product } = await supabase
    .from("products")
    .select("id, name, product_type_id, audience_context_id, audience_contexts(label_pl)")
    .eq("id", session.product_id)
    .maybeSingle();
  if (!product) return apiError(404, "Nie znaleziono produktu.");

  const { data: profile } = await supabase
    .from("product_profiles")
    .select("*")
    .eq("product_id", session.product_id)
    .eq("status", "confirmed")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!profile) {
    return apiError(400, "Produkt nie ma jeszcze potwierdzonego Product Locka.");
  }

  try {
    await assertBudgetAllows(supabase);

    const rulePack = product.product_type_id ? await loadRulePack(supabase, product.product_type_id) : {};
    const recentScenarios = await getRecentScenarios(supabase, session.product_id);
    const antiRepetitionNotes = scenariosToNotes(recentScenarios);

    const { data: trendBrief } = await supabase
      .from("trend_briefs")
      .select("summary_points")
      .eq("workspace_id", WORKSPACE_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const trendPoints = ((trendBrief?.summary_points as { summary_pl: string }[]) ?? [])
      .slice(0, 3)
      .map((p) => p.summary_pl);

    const purposeOverride = parsed.data.purpose && parsed.data.purpose !== "auto" ? parsed.data.purpose : undefined;
    const aspectOverride = parsed.data.aspectRatio && parsed.data.aspectRatio !== "auto" ? parsed.data.aspectRatio : undefined;
    const purpose = purposeOverride ?? defaultPurposeFor(parsed.data.photoType);
    const aspectRatio = aspectOverride ?? defaultAspectFor(purpose, parsed.data.photoType);

    const productSummary = `${product.name} — ${profile.product_name ?? ""}. Materiały: ${(profile.materials as string[]).join(", ")}. Elementy: ${profile.element_count ?? "?"}.`;

    const { provider, models } = await getTextVisionProvider(supabase);
    const { result, usage } = await provider.proposeConcept({
      productSummary,
      rulePack,
      photoType: parsed.data.photoType,
      purpose,
      featuredSubject: parsed.data.featuredSubject,
      audienceLabel: (product.audience_contexts as { label_pl: string } | null)?.label_pl ?? "uniwersalny",
      recentScenarios,
      trendPoints,
      userNote: parsed.data.userNote,
      creative: parsed.data.creative,
    });

    await recordCost(supabase, {
      jobId: null,
      model: models.scenario,
      usage,
      userId: user.id,
      category: "text_output",
    });

    const { data: concept, error } = await supabase
      .from("concepts")
      .insert({
        session_id: sessionId,
        product_id: session.product_id,
        photo_type: parsed.data.photoType,
        purpose,
        aspect_ratio: aspectRatio,
        featured_subject: parsed.data.featuredSubject,
        idea_text: result.idea_pl,
        scenario_metadata: result.scenario,
        model: models.scenario.modelId,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error) return handleApiError(error);

    return NextResponse.json({ concept, antiRepetitionNotes });
  } catch (err) {
    return handleApiError(err);
  }
}
