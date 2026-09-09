import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import { loadRulePack } from "@/lib/prompt/loadRulePack";
import { loadPublishedPromptVersion } from "@/lib/prompt/loadVersion";
import { BUCKET } from "@/lib/storage/paths";
import type { ReferenceImageInput } from "@/lib/ai/types";

type Client = SupabaseClient<Database>;

export interface GenerationContext {
  sessionId: string;
  productId: string;
  workspaceId: string;
  productName: string;
  audienceLabel: string;
  concept: Database["public"]["Tables"]["concepts"]["Row"];
  profile: Database["public"]["Tables"]["product_profiles"]["Row"];
  rulePack: ReturnType<typeof loadRulePack> extends Promise<infer T> ? T : never;
  promptVersion: Awaited<ReturnType<typeof loadPublishedPromptVersion>>;
  references: ReferenceImageInput[];
  photoTypeLabel: string;
}

export async function loadGenerationContext(
  supabase: Client,
  sessionId: string,
  conceptId: string,
  promptVersionOverrideId?: string,
): Promise<GenerationContext> {
  const { data: session, error: sessionErr } = await supabase
    .from("sessions")
    .select("id, workspace_id, product_id")
    .eq("id", sessionId)
    .single();
  if (sessionErr || !session) throw new Error("Nie znaleziono sesji.");

  const { data: concept, error: conceptErr } = await supabase
    .from("concepts")
    .select("*")
    .eq("id", conceptId)
    .eq("session_id", sessionId)
    .single();
  if (conceptErr || !concept) throw new Error("Nie znaleziono koncepcji.");

  const { data: product, error: productErr } = await supabase
    .from("products")
    .select("id, name, product_type_id, audience_contexts(label_pl)")
    .eq("id", session.product_id)
    .single();
  if (productErr || !product) throw new Error("Nie znaleziono produktu.");

  const { data: profile, error: profileErr } = await supabase
    .from("product_profiles")
    .select("*")
    .eq("product_id", session.product_id)
    .eq("status", "confirmed")
    .order("version", { ascending: false })
    .limit(1)
    .single();
  if (profileErr || !profile) throw new Error("Produkt nie ma potwierdzonego Product Locka.");

  const { data: referenceRows, error: refErr } = await supabase
    .from("product_references")
    .select("id, storage_path_working, role, mime_type")
    .eq("product_id", session.product_id)
    .order("sort_order");
  if (refErr || !referenceRows || referenceRows.length === 0) {
    throw new Error("Produkt nie ma zdjęć referencyjnych.");
  }

  const references: ReferenceImageInput[] = await Promise.all(
    referenceRows.map(async (r) => {
      const { data, error } = await supabase.storage.from(BUCKET).download(r.storage_path_working);
      if (error || !data) throw new Error("Nie udało się wczytać referencji produktu.");
      const buffer = Buffer.from(await data.arrayBuffer());
      return { id: r.id, base64: buffer.toString("base64"), mimeType: r.mime_type, role: r.role as "master" | "supporting" };
    }),
  );

  const rulePack = product.product_type_id ? await loadRulePack(supabase, product.product_type_id) : {};
  const promptVersion = await loadPublishedPromptVersion(supabase, promptVersionOverrideId);

  const { PHOTO_TYPES } = await import("@/lib/prompt/photoTypes");
  const photoTypeLabel = PHOTO_TYPES.find((p) => p.key === concept.photo_type)?.label ?? concept.photo_type;

  return {
    sessionId,
    productId: session.product_id,
    workspaceId: session.workspace_id,
    productName: product.name,
    audienceLabel: (product.audience_contexts as { label_pl: string } | null)?.label_pl ?? "uniwersalny",
    concept,
    profile,
    rulePack,
    promptVersion,
    references,
    photoTypeLabel,
  };
}

export function productLockSummary(profile: GenerationContext["profile"]): string {
  return JSON.stringify({
    nazwa: profile.product_name,
    materialy: profile.materials,
    kolory_glowne: profile.main_colors,
    kolory_dodatkowe: profile.secondary_colors,
    liczba_elementow: profile.element_count,
    kolejnosc_elementow: profile.element_sequence,
    ksztalty: profile.shapes,
    sznurek: profile.cord,
    zapiecie: profile.clasp,
    okucia: profile.hardware,
    litery: profile.letters,
    grawer: profile.engraving,
    personalizacja: profile.personalization,
    cechy_krytyczne: profile.critical_features,
    zabronione_zmiany: profile.forbidden_transformations,
  });
}
