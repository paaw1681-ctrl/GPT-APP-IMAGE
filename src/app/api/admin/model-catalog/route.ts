import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;

  const { data, error } = await supabase.from("model_catalog").select("*").order("purpose").order("provider");
  if (error) return handleApiError(error);
  return NextResponse.json({ models: data });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  input_token_price: z.number().nullable().optional(),
  output_token_price: z.number().nullable().optional(),
  cached_input_price: z.number().nullable().optional(),
  image_input_price: z.number().nullable().optional(),
  image_output_price: z.number().nullable().optional(),
  active: z.boolean().optional(),
  source_url: z.string().url().nullable().optional(),
});

/** Panel admina do ręcznej aktualizacji cen (sekcja 41) — AI nigdy nie edytuje tych stawek automatycznie. */
export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane.");
  const { id, ...rest } = parsed.data;

  const { error } = await supabase
    .from("model_catalog")
    .update({ ...rest, last_verified_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return handleApiError(error);
  return NextResponse.json({ ok: true });
}
