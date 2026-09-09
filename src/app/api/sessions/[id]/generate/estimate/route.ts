import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { resolveModel } from "@/lib/ai/router";
import { estimateCost } from "@/lib/cost/estimator";

const bodySchema = z.object({
  mode: z.enum(["prototype", "final"]),
  count: z.number().int().min(1).max(5).default(1),
  referenceCount: z.number().int().min(1).default(1),
});

/** Kosztorys PRZED generacją (sekcja 40) — nie wykonuje żadnego płatnego wywołania. */
export async function POST(req: NextRequest) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane.");

  try {
    const role = parsed.data.mode === "prototype" ? "prototype_image" : "final_image";
    const model = await resolveModel(supabase, role);
    const perImage = await estimateCost(supabase, model, { referenceCount: parsed.data.referenceCount });

    let qualityGateEstimate = { minPln: 0, maxPln: 0 };
    if (parsed.data.mode === "final") {
      const qgModel = await resolveModel(supabase, "quality_gate");
      const qg = await estimateCost(supabase, qgModel, { referenceCount: parsed.data.referenceCount });
      qualityGateEstimate = { minPln: qg.minPln, maxPln: qg.maxPln };
    }

    const minPln = perImage.minPln * parsed.data.count + qualityGateEstimate.minPln;
    const maxPln = perImage.maxPln * parsed.data.count + qualityGateEstimate.maxPln;

    return NextResponse.json({
      minPln: Math.round(minPln * 100) / 100,
      maxPln: Math.round(maxPln * 100) / 100,
      basis: perImage.basis,
      mock: model.provider === "mock",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
