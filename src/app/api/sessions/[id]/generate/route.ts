import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { getImageProvider, getCriticProvider } from "@/lib/ai/router";
import { recordCost } from "@/lib/cost/ledger";
import { assertBudgetAllows } from "@/lib/cost/budget";
import { createIdempotentJob } from "@/lib/generation/idempotency";
import { loadGenerationContext, productLockSummary } from "@/lib/generation/context";
import { getRecentScenarios, scenariosToNotes } from "@/lib/generation/scenarioHistory";
import { buildPrompt } from "@/lib/prompt/build";
import { BUCKET, assetPath } from "@/lib/storage/paths";

export const maxDuration = 300;

const bodySchema = z.object({
  conceptId: z.string().uuid(),
  mode: z.enum(["prototype", "final"]),
  count: z.number().int().min(1).max(5).default(1),
  idempotencyKey: z.string().min(8),
  userNote: z.string().max(500).optional(),
  promptVersionOverride: z.string().uuid().optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user, workspaceId } = auth;
  const { id: sessionId } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane generacji.");

  try {
    await assertBudgetAllows(supabase);

    const context = await loadGenerationContext(
      supabase,
      sessionId,
      parsed.data.conceptId,
      parsed.data.promptVersionOverride,
    );
    const role = parsed.data.mode === "prototype" ? "prototype_image" : "final_image";
    const { provider: imageProvider, model } = await getImageProvider(supabase, role);

    const { job, alreadyExisted } = await createIdempotentJob(supabase, {
      workspace_id: workspaceId,
      session_id: sessionId,
      product_id: context.productId,
      concept_id: parsed.data.conceptId,
      kind: parsed.data.mode,
      status: "queued",
      idempotency_key: parsed.data.idempotencyKey,
      request_params: { count: parsed.data.count, mode: parsed.data.mode, userNote: parsed.data.userNote ?? null },
      model_catalog_id: model.modelCatalogId,
      prompt_version_id: context.promptVersion.id,
      created_by: user.id,
    });

    if (alreadyExisted) {
      const { data: assets } = await supabase.from("generated_assets").select("*").eq("job_id", job.id);
      return NextResponse.json({ job, assets: assets ?? [], reused: true });
    }

    await supabase.from("generation_jobs").update({ status: "processing", started_at: new Date().toISOString() }).eq("id", job.id);

    const recentScenarios = await getRecentScenarios(supabase, context.productId);
    const antiRepetitionNotes = scenariosToNotes(recentScenarios);

    const built = buildPrompt({
      modules: context.promptVersion.modules,
      productLockSummary: productLockSummary(context.profile),
      rulePack: context.rulePack,
      photoType: context.concept.photo_type,
      photoTypeLabel: context.photoTypeLabel,
      purpose: context.concept.purpose ?? "auto",
      aspectRatio: context.concept.aspect_ratio ?? "1:1",
      audienceLabel: context.audienceLabel,
      featuredSubjectLabel: context.concept.featured_subject ?? "auto",
      scenario: context.concept.scenario_metadata as never,
      ideaText: context.concept.idea_text,
      antiRepetitionNotes,
      userNote: parsed.data.userNote,
      mode: parsed.data.mode,
    });

    await supabase
      .from("generation_jobs")
      .update({ prompt_snapshot: built.moduleSnapshot as never })
      .eq("id", job.id);

    const createdAssets: Record<string, unknown>[] = [];
    const aspectRatio = context.concept.aspect_ratio ?? "1:1";

    try {
      for (let i = 0; i < parsed.data.count; i++) {
        const result = await imageProvider.generate(
          {
            prompt: built.text,
            references: context.references,
            aspectRatio,
            quality: parsed.data.mode === "prototype" ? "low" : "high",
          },
          model.modelId,
        );

        await recordCost(supabase, {
          jobId: job.id,
          model,
          usage: result.usage,
          userId: user.id,
          category: "image_output",
        });

        const buffer = Buffer.from(result.base64, "base64");
        const { data: assetRow, error: assetErr } = await supabase
          .from("generated_assets")
          .insert({
            job_id: job.id,
            product_id: context.productId,
            session_id: sessionId,
            kind: parsed.data.mode,
            storage_path: "",
            format: result.format,
            aspect_ratio: aspectRatio,
            scenario_metadata: context.concept.scenario_metadata as never,
            created_by: user.id,
          })
          .select("*")
          .single();
        if (assetErr || !assetRow) throw assetErr ?? new Error("Nie udało się zapisać wygenerowanego obrazu.");

        const path = assetPath(context.productId, job.id, assetRow.id, "full");
        const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, buffer, {
          contentType: `image/${result.format}`,
          upsert: true,
        });
        if (uploadErr) throw uploadErr;

        await supabase.from("generated_assets").update({ storage_path: path }).eq("id", assetRow.id);
        createdAssets.push({ ...assetRow, storage_path: path });

        await supabase.from("generation_metadata").insert({
          job_id: job.id,
          asset_id: assetRow.id,
          model: model.modelId,
          model_params: { quality: parsed.data.mode === "prototype" ? "low" : "high" },
          provider_usage: result.usage as never,
        });

        if (parsed.data.mode === "final") {
          // Błąd Quality Gate nie może odrzucić poprawnie wygenerowanego finału —
          // użytkownik i tak dostaje zdjęcie, tylko bez automatycznej oceny.
          try {
            await runQualityGate(supabase, assetRow.id, job.id, context, buffer.toString("base64"), user.id);
          } catch (qgErr) {
            console.error("Quality Gate nie powiodło się:", qgErr);
          }
        }
      }

      await supabase
        .from("generation_jobs")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", job.id);
    } catch (genErr) {
      await supabase
        .from("generation_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: genErr instanceof Error ? genErr.message : "Nieznany błąd generacji.",
        })
        .eq("id", job.id);
      throw genErr;
    }

    const costGuardTip = await buildCostGuardTip(supabase, sessionId, parsed.data.mode);

    return NextResponse.json({ job: { ...job, status: "completed" }, assets: createdAssets, costGuardTip });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * Strażnik kosztów (sekcja 45) — krótkie, konkretne podpowiedzi, tylko gdy
 * rzeczywiście pomagają. Nigdy nie blokuje akcji, tylko sugeruje.
 */
async function buildCostGuardTip(
  supabase: Parameters<typeof getCriticProvider>[0],
  sessionId: string,
  mode: "prototype" | "final",
): Promise<string | null> {
  if (mode !== "prototype") return null;
  const { count } = await supabase
    .from("generation_jobs")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("kind", "prototype")
    .eq("status", "completed");

  if ((count ?? 0) >= 3) {
    return "To już trzecia podobna generacja w tej sesji. Zamiast kolejnego prototypu, rozważ zmianę koncepcji.";
  }
  if ((count ?? 0) === 2) {
    return "Masz już dobry prototyp. Bardziej opłaca się go finalizować niż generować kolejny podobny.";
  }
  return null;
}

async function runQualityGate(
  supabase: Parameters<typeof getCriticProvider>[0],
  assetId: string,
  jobId: string,
  context: Awaited<ReturnType<typeof loadGenerationContext>>,
  finalBase64: string,
  userId: string,
) {
  const { provider, model } = await getCriticProvider(supabase);
  const { result, usage } = await provider.reviewQuality({
    references: context.references,
    finalImageBase64: finalBase64,
    productProfile: JSON.parse(productLockSummary(context.profile)),
  });

  await recordCost(supabase, { jobId, model, usage, userId, category: "vision" });

  const status = result.numerical_score >= 75 ? "ready" : result.numerical_score >= 50 ? "check" : "improve";
  await supabase.from("quality_reviews").insert({
    asset_id: assetId,
    job_id: jobId,
    product_fidelity: result.product_fidelity,
    realism: result.realism,
    status,
    issues: result.issues_pl,
    numerical_score: result.numerical_score,
    confidence: result.confidence,
    second_pass: false,
    model: model.modelId,
    raw: result as never,
  });

  const nearThreshold = result.numerical_score >= 45 && result.numerical_score <= 80;
  if (result.confidence === "low" || nearThreshold) {
    const { provider: provider2, model: model2 } = await getCriticProvider(supabase, { escalate: true });
    const { result: result2, usage: usage2 } = await provider2.reviewQuality({
      references: context.references,
      finalImageBase64: finalBase64,
      productProfile: JSON.parse(productLockSummary(context.profile)),
    });
    await recordCost(supabase, { jobId, model: model2, usage: usage2, userId, category: "vision" });
    const status2 = result2.numerical_score >= 75 ? "ready" : result2.numerical_score >= 50 ? "check" : "improve";
    await supabase.from("quality_reviews").insert({
      asset_id: assetId,
      job_id: jobId,
      product_fidelity: result2.product_fidelity,
      realism: result2.realism,
      status: status2,
      issues: result2.issues_pl,
      numerical_score: result2.numerical_score,
      confidence: result2.confidence,
      second_pass: true,
      model: model2.modelId,
      raw: result2 as never,
    });
  }
}
