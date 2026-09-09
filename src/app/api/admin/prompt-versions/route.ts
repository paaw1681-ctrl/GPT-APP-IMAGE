import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { WORKSPACE_ID } from "@/lib/auth/session";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { data, error } = await supabase
    .from("prompt_versions")
    .select("*")
    .eq("workspace_id", WORKSPACE_ID)
    .order("created_at", { ascending: false });
  if (error) return handleApiError(error);
  return NextResponse.json({ versions: data });
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  module_versions: z.record(z.string(), z.number().int()),
});

export async function POST(req: NextRequest) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane.");

  const { data, error } = await supabase
    .from("prompt_versions")
    .insert({
      workspace_id: WORKSPACE_ID,
      name: parsed.data.name,
      module_versions: parsed.data.module_versions as never,
      status: "draft",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return handleApiError(error);
  return NextResponse.json({ version: data }, { status: 201 });
}
