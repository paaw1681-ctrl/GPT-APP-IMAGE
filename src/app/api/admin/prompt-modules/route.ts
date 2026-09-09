import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { WORKSPACE_ID } from "@/lib/auth/session";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { data, error } = await supabase
    .from("prompt_modules")
    .select("*")
    .eq("workspace_id", WORKSPACE_ID)
    .order("module_key")
    .order("version", { ascending: false });
  if (error) return handleApiError(error);
  return NextResponse.json({ modules: data });
}

const createSchema = z.object({
  module_key: z.enum(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]),
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(4000),
});

/** Nowy draft modułu promptu (sekcja 24/58) — nie publikuje automatycznie. */
export async function POST(req: NextRequest) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane.");

  const { data: latest } = await supabase
    .from("prompt_modules")
    .select("version")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("module_key", parsed.data.module_key)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("prompt_modules")
    .insert({
      workspace_id: WORKSPACE_ID,
      module_key: parsed.data.module_key,
      version: (latest?.version ?? 0) + 1,
      title: parsed.data.title,
      content: parsed.data.content,
      status: "draft",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return handleApiError(error);
  return NextResponse.json({ module: data }, { status: 201 });
}
