import { NextResponse } from "next/server";
import { requireApiUser, handleApiError } from "@/lib/api/helpers";
import { BUCKET } from "@/lib/storage/paths";

/** Galeria per produkt: prototypy / finały / ulubione (sekcja 48). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  const { id: productId } = await ctx.params;

  const { data: assets, error } = await supabase
    .from("generated_assets")
    .select("*, quality_reviews(status, product_fidelity, realism, numerical_score), feedback(sentiment)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) return handleApiError(error);

  const withUrls = await Promise.all(
    (assets ?? []).map(async (a) => {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(a.storage_path, 3600);
      return { ...a, url: signed?.signedUrl ?? null };
    }),
  );

  return NextResponse.json({
    prototypes: withUrls.filter((a) => a.kind === "prototype"),
    finals: withUrls.filter((a) => a.kind === "final"),
    favorites: withUrls.filter((a) => a.is_favorite),
  });
}
