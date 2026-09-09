import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";

const bodySchema = z.object({ action: z.enum(["applied", "rejected"]) });

/** [ ZASTOSUJ ] / [ ODRZUĆ ] — AI nigdy samo nie publikuje nowych reguł (sekcja 57). */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const { id } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane.");

  const { error } = await supabase
    .from("system_suggestions")
    .update({ status: parsed.data.action, resolved_by: user.id, resolved_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return handleApiError(error);
  return NextResponse.json({ ok: true });
}
