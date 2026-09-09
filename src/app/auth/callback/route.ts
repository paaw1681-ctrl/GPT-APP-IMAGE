import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/env";
import { ensureWorkspaceMembership } from "@/lib/auth/bootstrap";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const supabase = await createSupabaseServerClient();

  if (!code) {
    return NextResponse.redirect(new URL("/logowanie?blad=brak_kodu", req.url));
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user?.email) {
    return NextResponse.redirect(new URL("/logowanie?blad=nieprawidlowy_link", req.url));
  }

  if (!isEmailAllowed(data.user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/logowanie?blad=brak_dostepu", req.url));
  }

  await ensureWorkspaceMembership(data.user.id, data.user.email);

  return NextResponse.redirect(new URL("/", req.url));
}
