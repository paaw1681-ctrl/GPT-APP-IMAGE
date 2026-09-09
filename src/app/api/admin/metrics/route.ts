import { NextResponse } from "next/server";
import { requireApiUser, handleApiError } from "@/lib/api/helpers";
import { WORKSPACE_ID } from "@/lib/auth/session";

/** Najważniejsza metryka kosztowa (sekcja 39): koszt per ZAAKCEPTOWANY final, nie per generacja. */
export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;

  const { data: finals, error } = await supabase
    .from("generated_assets")
    .select("id, job_id, is_favorite, is_kept, feedback(sentiment)")
    .eq("kind", "final");
  if (error) return handleApiError(error);

  const accepted = (finals ?? []).filter(
    (a) => a.is_favorite || a.is_kept || (a.feedback as { sentiment: string }[]).some((f) => f.sentiment === "liked"),
  );

  const jobIds = accepted.map((a) => a.job_id).filter(Boolean);
  let costPerAcceptedFinalPln: number | null = null;
  if (jobIds.length > 0) {
    const { data: costs } = await supabase.from("cost_ledger").select("amount_pln_cents, job_id").in("job_id", jobIds);
    const totalCents = (costs ?? []).reduce((sum, c) => sum + Number(c.amount_pln_cents), 0);
    costPerAcceptedFinalPln = totalCents / 100 / accepted.length;
  }

  const totalFinals = (finals ?? []).length;
  const acceptanceRate = totalFinals > 0 ? accepted.length / totalFinals : null;

  return NextResponse.json({
    workspaceId: WORKSPACE_ID,
    totalFinals,
    acceptedFinals: accepted.length,
    acceptanceRate,
    costPerAcceptedFinalPln,
  });
}
