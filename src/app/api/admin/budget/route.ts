import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { getBudgetStatus } from "@/lib/cost/budget";
import { WORKSPACE_ID } from "@/lib/auth/session";

function monthStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const status = await getBudgetStatus(supabase);
  return NextResponse.json(status);
}

const patchSchema = z.object({
  monthlyLimitPlnCents: z.number().int().min(0).optional(),
  hardLimitEnabled: z.boolean().optional(),
  override: z.boolean().optional(),
});

/** Ustawienia budżetu (sekcja 44) + ręczny override twardego limitu przez uprawnionego użytkownika. */
export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane.");

  const month = monthStart();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.monthlyLimitPlnCents !== undefined) update.monthly_limit_pln_cents = parsed.data.monthlyLimitPlnCents;
  if (parsed.data.hardLimitEnabled !== undefined) update.hard_limit_enabled = parsed.data.hardLimitEnabled;
  if (parsed.data.override) {
    update.hard_limit_enabled = false;
    update.overridden_by = user.id;
    update.overridden_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("budgets")
    .upsert({ workspace_id: WORKSPACE_ID, month, created_by: user.id, ...update }, { onConflict: "workspace_id,month" });

  if (error) return handleApiError(error);
  return NextResponse.json({ ok: true });
}
