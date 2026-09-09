import { NextResponse } from "next/server";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { BUCKET } from "@/lib/storage/paths";

const STALE_MS = 4 * 60 * 1000;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { id } = await ctx.params;

  const { data: job, error } = await supabase.from("generation_jobs").select("*").eq("id", id).maybeSingle();
  if (error) return handleApiError(error);
  if (!job) return apiError(404, "Nie znaleziono zadania generacji.");

  // Zadanie utknęło w "processing" (np. funkcja serwerowa padła w trakcie) — oznacz jako nieudane,
  // żeby UI nie kręciło spinnerem w nieskończoność (sekcja 47/81).
  if (job.status === "processing" && job.started_at && Date.now() - new Date(job.started_at).getTime() > STALE_MS) {
    await supabase
      .from("generation_jobs")
      .update({ status: "failed", error_message: "Generacja przerwana — spróbuj ponownie." })
      .eq("id", id);
    job.status = "failed";
    job.error_message = "Generacja przerwana — spróbuj ponownie.";
  }

  const { data: assets } = await supabase
    .from("generated_assets")
    .select("*, quality_reviews(*)")
    .eq("job_id", id)
    .order("created_at");

  const assetsWithUrls = await Promise.all(
    (assets ?? []).map(async (a) => {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(a.storage_path, 3600);
      return { ...a, url: signed?.signedUrl ?? null };
    }),
  );

  return NextResponse.json({ job, assets: assetsWithUrls });
}
