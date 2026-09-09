import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";

const patchSchema = z.object({
  asset_a_id: z.string().uuid().optional(),
  asset_b_id: z.string().uuid().optional(),
  result: z.enum(["a_better", "b_better", "tie"]).optional(),
  status: z.enum(["pending", "running", "completed"]).optional(),
});

/** Zapisuje wynik rundy Test Lab (który wariant lepszy) — dopiero to może posłużyć do publikacji nowej konfiguracji. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { id } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane.");

  const { error } = await supabase.from("test_lab_runs").update(parsed.data).eq("id", id);
  if (error) return handleApiError(error);
  return NextResponse.json({ ok: true });
}
