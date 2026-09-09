import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";

const bodySchema = z.object({
  sentiment: z.enum(["liked", "disliked"]),
  reasons: z.array(z.string()).max(6).default([]),
  note: z.string().max(500).optional(),
});

/** Feedback pod obrazem (sekcja 37) — powód jest opcjonalny, nie wymuszamy go. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const { id: assetId } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane.");

  const { error } = await supabase.from("feedback").insert({
    asset_id: assetId,
    user_id: user.id,
    sentiment: parsed.data.sentiment,
    reasons: parsed.data.reasons,
    note: parsed.data.note,
  });

  if (error) return handleApiError(error);
  return NextResponse.json({ ok: true }, { status: 201 });
}
