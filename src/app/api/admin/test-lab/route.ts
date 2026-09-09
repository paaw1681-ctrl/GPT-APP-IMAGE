import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { resolveModel } from "@/lib/ai/router";
import { estimateCost } from "@/lib/cost/estimator";
import { WORKSPACE_ID } from "@/lib/auth/session";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { data, error } = await supabase
    .from("test_lab_runs")
    .select("*, asset_a:generated_assets!test_lab_runs_asset_a_id_fkey(storage_path), asset_b:generated_assets!test_lab_runs_asset_b_id_fkey(storage_path)")
    .eq("workspace_id", WORKSPACE_ID)
    .order("created_at", { ascending: false });
  if (error) return handleApiError(error);
  return NextResponse.json({ runs: data });
}

const createSchema = z.object({
  product_id: z.string().uuid(),
  photo_type: z.string(),
  prompt_version_a_id: z.string().uuid(),
  prompt_version_b_id: z.string().uuid(),
  model_a: z.string(),
  model_b: z.string(),
});

/** Test Lab (sekcja 59): tworzy PLAN testu A/B z kosztorysem — nie uruchamia jeszcze żadnej płatnej generacji. */
export async function POST(req: NextRequest) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane.");

  const model = await resolveModel(supabase, "final_image");
  const estimate = await estimateCost(supabase, model, { referenceCount: 3 });

  const { data, error } = await supabase
    .from("test_lab_runs")
    .insert({
      workspace_id: WORKSPACE_ID,
      product_id: parsed.data.product_id,
      photo_type: parsed.data.photo_type,
      prompt_version_a_id: parsed.data.prompt_version_a_id,
      prompt_version_b_id: parsed.data.prompt_version_b_id,
      model_a: parsed.data.model_a,
      model_b: parsed.data.model_b,
      estimated_cost_cents: Math.round(estimate.maxPln * 2 * 100),
      status: "pending",
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) return handleApiError(error);
  return NextResponse.json({ run: data }, { status: 201 });
}
