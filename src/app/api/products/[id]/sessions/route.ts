import { NextResponse } from "next/server";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";

/** Zwraca aktywną sesję produktu (tworzy nową, jeśli brak) — start flow generatora. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user, workspaceId } = auth;
  const { id: productId } = await ctx.params;

  const { data: product } = await supabase
    .from("products")
    .select("id, status")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return apiError(404, "Nie znaleziono produktu.");
  if (product.status !== "active") {
    return apiError(400, "Najpierw potwierdź Product Lock (co to za produkt / dla kogo), zanim zaczniesz generować zdjęcia.");
  }

  const { data: existing } = await supabase
    .from("sessions")
    .select("id")
    .eq("product_id", productId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return NextResponse.json({ session: existing });

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({ workspace_id: workspaceId, product_id: productId, status: "active", created_by: user.id, updated_by: user.id })
    .select("id")
    .single();

  if (error) return handleApiError(error);
  return NextResponse.json({ session }, { status: 201 });
}
