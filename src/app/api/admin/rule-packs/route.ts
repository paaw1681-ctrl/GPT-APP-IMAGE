import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { WORKSPACE_ID } from "@/lib/auth/session";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("product_rule_packs")
    .select("*, product_types(key, label_pl)")
    .eq("workspace_id", WORKSPACE_ID)
    .order("product_type_id")
    .order("version", { ascending: false });

  if (error) return handleApiError(error);
  return NextResponse.json({ rulePacks: data });
}

const createSchema = z.object({
  product_type_id: z.string().uuid(),
  rules: z.record(z.string(), z.unknown()),
  notes: z.string().max(500).optional(),
});

/** Nowa wersja draft Rule Packa (wersjonowanie — sekcja 16/58). */
export async function POST(req: NextRequest) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane.");

  const { data: latest } = await supabase
    .from("product_rule_packs")
    .select("version")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("product_type_id", parsed.data.product_type_id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("product_rule_packs")
    .insert({
      workspace_id: WORKSPACE_ID,
      product_type_id: parsed.data.product_type_id,
      version: (latest?.version ?? 0) + 1,
      status: "draft",
      rules: parsed.data.rules as never,
      notes: parsed.data.notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return handleApiError(error);
  return NextResponse.json({ rulePack: data }, { status: 201 });
}
