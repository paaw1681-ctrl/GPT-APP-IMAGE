import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import type { AiRole } from "@/lib/ai/types";
import type { ResolvedModel } from "@/lib/ai/router";
import { getUsdPlnRate } from "@/lib/currency/nbp";

type Client = SupabaseClient<Database>;

/**
 * Orientacyjna liczba tokenów per rola — punkt startowy estymatora (sekcja 42).
 * Nie jest to cena zaszyta na stałe: mnożymy przez ceny z model_catalog, które
 * admin może zmienić w każdej chwili.
 */
const TOKEN_HEURISTICS: Record<AiRole, { input: number; output: number; perReferenceInput?: number }> = {
  product_analysis: { input: 300, output: 500, perReferenceInput: 1100 },
  scenario: { input: 700, output: 350 },
  prompt_builder: { input: 200, output: 100 },
  prototype_image: { input: 0, output: 0 },
  final_image: { input: 0, output: 0 },
  quality_gate: { input: 2200, output: 350, perReferenceInput: 1100 },
  trend_research: { input: 1200, output: 700 },
  content: { input: 400, output: 300 },
};

export interface CostEstimate {
  minPln: number;
  maxPln: number;
  minUsd: number;
  maxUsd: number;
  basis: "catalog" | "historical";
  fxRate: number;
  fxStale: boolean;
}

/** Szacuje koszt PRZED wysłaniem płatnego requestu (sekcja 40) — pokazywane użytkownikowi jako "ok. X–Y zł". */
export async function estimateCost(
  supabase: Client,
  model: ResolvedModel,
  opts: { referenceCount?: number } = {},
): Promise<CostEstimate> {
  const { rate, stale } = await getUsdPlnRate(supabase);

  if (model.provider === "mock") {
    return { minPln: 0, maxPln: 0, minUsd: 0, maxUsd: 0, basis: "catalog", fxRate: rate, fxStale: stale };
  }

  // Kalibracja: jeśli mamy wystarczająco danych historycznych dla tego modelu/roli, użyj ich.
  const { data: history } = await supabase
    .from("cost_ledger")
    .select("amount_usd_cents, job_id, model")
    .eq("model", model.modelId)
    .eq("estimated", false)
    .order("created_at", { ascending: false })
    .limit(15);

  if (history && history.length >= 3) {
    const amounts = history.map((h) => Number(h.amount_usd_cents) / 100);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    return {
      minUsd: avg * 0.75,
      maxUsd: avg * 1.35,
      minPln: avg * 0.75 * rate,
      maxPln: avg * 1.35 * rate,
      basis: "historical",
      fxRate: rate,
      fxStale: stale,
    };
  }

  let usd: number;
  if (model.role === "prototype_image" || model.role === "final_image") {
    usd = Number(model.pricing.image_output_price ?? 0.05);
  } else {
    const h = TOKEN_HEURISTICS[model.role];
    const refInput = (h.perReferenceInput ?? 0) * (opts.referenceCount ?? 1);
    const inputTokens = h.input + refInput;
    usd =
      (inputTokens / 1000) * Number(model.pricing.input_token_price ?? 0) +
      (h.output / 1000) * Number(model.pricing.output_token_price ?? 0);
  }

  return {
    minUsd: usd * 0.7,
    maxUsd: usd * 1.4,
    minPln: usd * 0.7 * rate,
    maxPln: usd * 1.4 * rate,
    basis: "catalog",
    fxRate: rate,
    fxStale: stale,
  };
}
