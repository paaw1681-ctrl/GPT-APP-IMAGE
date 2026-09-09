import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/env";
import { ensureWorkspaceMembership } from "@/lib/auth/bootstrap";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Podaj poprawny adres e-mail i hasło." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  if (!isEmailAllowed(email)) {
    return NextResponse.json(
      { error: "Nieprawidłowy adres e-mail lub hasło." },
      { status: 401 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.user?.email) {
    return NextResponse.json(
      { error: "Nieprawidłowy adres e-mail lub hasło." },
      { status: 401 },
    );
  }

  await ensureWorkspaceMembership(data.user.id, data.user.email);

  return NextResponse.json({ ok: true });
}
