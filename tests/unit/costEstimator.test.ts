import { describe, it, expect } from "vitest";
import { estimateCost } from "@/lib/cost/estimator";
import { mockSupabase } from "./helpers/mockSupabase";
import type { ResolvedModel } from "@/lib/ai/router";

const today = new Date().toISOString().slice(0, 10);

function baseSupabase(historyRows: unknown[] = []) {
  return mockSupabase({
    currency_rates: { data: { rate_date: today, usd_pln: 4.0 }, error: null },
    cost_ledger: { data: historyRows, error: null },
  });
}

const mockModel: ResolvedModel = {
  role: "prototype_image",
  provider: "mock",
  modelId: "mock-image",
  modelCatalogId: "id",
  routingPolicyId: null,
  escalated: false,
  pricing: {
    input_token_price: null,
    output_token_price: null,
    image_input_price: null,
    image_output_price: null,
    price_unit: "per_image_usd",
    currency: "USD",
  },
};

const openAiTextModel: ResolvedModel = {
  role: "product_analysis",
  provider: "openai",
  modelId: "gpt-5.4-mini",
  modelCatalogId: "id2",
  routingPolicyId: "rp",
  escalated: false,
  pricing: {
    input_token_price: 0.00025,
    output_token_price: 0.002,
    image_input_price: null,
    image_output_price: null,
    price_unit: "per_1k_tokens",
    currency: "USD",
  },
};

describe("estimateCost", () => {
  it("model mock zawsze kosztuje 0", async () => {
    const supabase = baseSupabase();
    const estimate = await estimateCost(supabase as never, mockModel);
    expect(estimate.minPln).toBe(0);
    expect(estimate.maxPln).toBe(0);
  });

  it("model tekstowy openai skaluje koszt wraz z liczbą referencji", async () => {
    const supabase = baseSupabase();
    const oneRef = await estimateCost(supabase as never, openAiTextModel, { referenceCount: 1 });
    const fiveRefs = await estimateCost(supabase as never, openAiTextModel, { referenceCount: 5 });
    expect(fiveRefs.minPln).toBeGreaterThan(oneRef.minPln);
    expect(oneRef.basis).toBe("catalog");
  });

  it("zwraca zakres min-max, nigdy fałszywie dokładnej pojedynczej liczby", async () => {
    const supabase = baseSupabase();
    const estimate = await estimateCost(supabase as never, openAiTextModel, { referenceCount: 1 });
    expect(estimate.maxPln).toBeGreaterThan(estimate.minPln);
  });

  it("przy wystarczających danych historycznych używa kalibracji zamiast statycznej heurystyki", async () => {
    const history = Array.from({ length: 5 }, () => ({ amount_usd_cents: 10, job_id: "j", model: "gpt-5.4-mini" }));
    const supabase = baseSupabase(history);
    const estimate = await estimateCost(supabase as never, openAiTextModel, { referenceCount: 1 });
    expect(estimate.basis).toBe("historical");
  });
});
