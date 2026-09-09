import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import { WORKSPACE_ID } from "@/lib/auth/session";
import type { Database } from "@/lib/db/types";
import type { AiRole, CriticProvider, ImageProvider, TextVisionProvider } from "@/lib/ai/types";
import { MockTextVisionProvider } from "@/lib/ai/providers/mock/text";
import { MockImageProvider } from "@/lib/ai/providers/mock/image";
import { MockCriticProvider } from "@/lib/ai/providers/mock/critic";

type ModelCatalogRow = Database["public"]["Tables"]["model_catalog"]["Row"];
type Client = SupabaseClient<Database>;

export interface ResolvedModel {
  role: AiRole;
  provider: "mock" | "openai";
  modelId: string;
  modelCatalogId: string;
  routingPolicyId: string | null;
  escalated: boolean;
  pricing: Pick<
    ModelCatalogRow,
    "input_token_price" | "output_token_price" | "image_input_price" | "image_output_price" | "price_unit" | "currency"
  >;
}

/**
 * AI Model Router (sekcja 62). Dla danej roli czyta opublikowaną politykę
 * routingu z bazy: gdy USE_MOCK_AI/ENABLE_PAID_AI nie pozwalają na płatne
 * wywołania, zawsze zwraca model mock; w przeciwnym razie zwraca realny
 * model OpenAI wskazany jako "fallback" (czyli produkcyjny odpowiednik) tej
 * roli. Przy opts.escalate szuka mocniejszego aktywnego modelu tej samej roli.
 * Żaden model ID nie jest zaszyty w kodzie UI ani logice biznesowej.
 */
export async function resolveModel(
  supabase: Client,
  role: AiRole,
  opts: { escalate?: boolean } = {},
): Promise<ResolvedModel> {
  const env = getServerEnv();
  const usePaid = !env.USE_MOCK_AI && env.ENABLE_PAID_AI;

  const { data: policy, error } = await supabase
    .from("routing_policies")
    .select(
      "id, model_catalog_id, fallback_model_catalog_id, model_catalog!routing_policies_model_catalog_id_fkey(*), fallback:model_catalog!routing_policies_fallback_model_catalog_id_fkey(*)",
    )
    .eq("workspace_id", WORKSPACE_ID)
    .eq("role_key", role)
    .eq("status", "published")
    .maybeSingle();

  if (error || !policy) {
    throw new Error(`Brak opublikowanej polityki routingu dla roli "${role}".`);
  }

  const primary = policy.model_catalog as unknown as ModelCatalogRow | null;
  const fallback = policy.fallback as unknown as ModelCatalogRow | null;

  let chosen = usePaid && fallback ? fallback : primary;
  let escalated = false;

  if (!chosen) {
    throw new Error(`Model Router: brak skonfigurowanego modelu dla roli "${role}".`);
  }

  if (usePaid && opts.escalate && chosen.provider === "openai") {
    const { data: candidates } = await supabase
      .from("model_catalog")
      .select("*")
      .eq("purpose", role)
      .eq("provider", "openai")
      .eq("active", true);
    const stronger = (candidates ?? [])
      .filter((c) => c.model_id !== chosen!.model_id)
      .sort((a, b) => (b.output_token_price ?? 0) - (a.output_token_price ?? 0))[0];
    if (stronger) {
      chosen = stronger;
      escalated = true;
    }
  }

  return {
    role,
    provider: chosen.provider as "mock" | "openai",
    modelId: chosen.model_id,
    modelCatalogId: chosen.id,
    routingPolicyId: policy.id,
    escalated,
    pricing: {
      input_token_price: chosen.input_token_price,
      output_token_price: chosen.output_token_price,
      image_input_price: chosen.image_input_price,
      image_output_price: chosen.image_output_price,
      price_unit: chosen.price_unit,
      currency: chosen.currency,
    },
  };
}

export async function getTextVisionProvider(
  supabase: Client,
): Promise<{ provider: TextVisionProvider; models: Record<string, ResolvedModel> }> {
  const [productAnalysis, scenario, content, trendResearch] = await Promise.all([
    resolveModel(supabase, "product_analysis"),
    resolveModel(supabase, "scenario"),
    resolveModel(supabase, "content"),
    resolveModel(supabase, "trend_research"),
  ]);

  if (productAnalysis.provider === "mock") {
    return {
      provider: new MockTextVisionProvider(),
      models: { productAnalysis, scenario, content, trendResearch },
    };
  }

  const { OpenAiTextVisionProvider } = await import("@/lib/ai/providers/openai/text");
  return {
    provider: new OpenAiTextVisionProvider({
      productAnalysis: productAnalysis.modelId,
      scenario: scenario.modelId,
      content: content.modelId,
      trendResearch: trendResearch.modelId,
    }),
    models: { productAnalysis, scenario, content, trendResearch },
  };
}

export async function getImageProvider(
  supabase: Client,
  role: "prototype_image" | "final_image",
  opts: { escalate?: boolean } = {},
): Promise<{ provider: ImageProvider; model: ResolvedModel }> {
  const model = await resolveModel(supabase, role, opts);
  if (model.provider === "mock") {
    return { provider: new MockImageProvider(), model };
  }
  const { OpenAiImageProvider } = await import("@/lib/ai/providers/openai/image");
  return { provider: new OpenAiImageProvider(), model };
}

export async function getCriticProvider(
  supabase: Client,
  opts: { escalate?: boolean } = {},
): Promise<{ provider: CriticProvider; model: ResolvedModel }> {
  const model = await resolveModel(supabase, "quality_gate", opts);
  if (model.provider === "mock") {
    return { provider: new MockCriticProvider(), model };
  }
  const { OpenAiCriticProvider } = await import("@/lib/ai/providers/openai/critic");
  return { provider: new OpenAiCriticProvider(model.modelId), model };
}
