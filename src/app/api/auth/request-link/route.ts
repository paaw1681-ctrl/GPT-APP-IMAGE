import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isEmailAllowed, getServerEnv } from "@/lib/env";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Podaj poprawny adres e-mail." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();

  if (!isEmailAllowed(email)) {
    return NextResponse.json(
      { error: "Ten adres e-mail nie ma dostępu do tej aplikacji. Skontaktuj się z administratorem Oak & Oats." },
      { status: 403 },
    );
  }

  const env = getServerEnv();
  const origin = env.APP_BASE_URL ?? req.nextUrl.origin;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    console.error("[auth/request-link] Supabase signInWithOtp failed", {
      name: error.name,
      message: error.message,
      status: error.status,
    });
    return NextResponse.json(
      { error: "Nie udało się wysłać linku logowania. Spróbuj ponownie za chwilę." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
