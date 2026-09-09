import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { BUCKET } from "@/lib/storage/paths";

const patchSchema = z.object({
  is_favorite: z.boolean().optional(),
  is_kept: z.boolean().optional(),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { id } = await ctx.params;

  const { data: asset, error } = await supabase
    .from("generated_assets")
    .select("*, quality_reviews(*), generation_jobs(kind, request_params, model_catalog_id)")
    .eq("id", id)
    .maybeSingle();
  if (error) return handleApiError(error);
  if (!asset) return apiError(404, "Nie znaleziono obrazu.");

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(asset.storage_path, 3600);
  return NextResponse.json({ asset: { ...asset, url: signed?.signedUrl ?? null } });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { id } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane.");

  const { error } = await supabase.from("generated_assets").update(parsed.data).eq("id", id);
  if (error) return handleApiError(error);
  return NextResponse.json({ ok: true });
}
