import { NextResponse } from "next/server";
import { requireApiUser, handleApiError } from "@/lib/api/helpers";
import { WORKSPACE_ID } from "@/lib/auth/session";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;

  const { data: briefs, error } = await supabase
    .from("trend_briefs")
    .select("*, trend_sources(*)")
    .eq("workspace_id", WORKSPACE_ID)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return handleApiError(error);
  return NextResponse.json({ briefs });
}
