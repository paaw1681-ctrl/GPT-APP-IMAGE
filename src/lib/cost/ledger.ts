import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import type { ProviderUsage } from "@/lib/ai/types";
import type { ResolvedModel } from "@/lib/ai/router";
import { getUsdPlnRate } from "@/lib/currency/nbp";
import { WORKSPACE_ID } from "@/lib/auth/session";

type Client = SupabaseClient<Database>;

function usdFromUsage(model: ResolvedModel, usage: ProviderUsage): number {
  if (model.provider === "mock") return 0;
  if (model.role === "prototype_image" || model.role === "final_image") {
    return Number(model.pricing.image_output_price ?? 0) * (usage.imagesGenerated ?? 1);
  }
  const inputPrice = Number(model.pricing.input_token_price ?? 0);
  const outputPrice = Number(model.pricing.output_token_price ?? 0);
  const cachedPrice = Number(model.pricing.input_token_price ?? 0) * 0.5;
  const input = ((usage.inputTokens ?? 0) - (usage.cachedInputTokens ?? 0)) / 1000;
  const cached = (usage.cachedInputTokens ?? 0) / 1000;
  const output = (usage.outputTokens ?? 0) / 1000;
  return Math.max(0, input) * inputPrice + cached * cachedPrice + output * outputPrice;
}

/** Zapisuje faktyczny (albo estymowany, gdy provider nie zwrócił usage) koszt operacji do cost_ledger. */
export async function recordCost(
  supabase: Client,
  args: {
    jobId: string | null;
    model: ResolvedModel;
    usage: ProviderUsage;
    userId: string | null;
    category: Database["public"]["Tables"]["cost_ledger"]["Row"]["category"];
    estimated?: boolean;
  },
): Promise<{ amountUsd: number; amountPln: number }> {
  const { rate } = await getUsdPlnRate(supabase);
  const amountUsd = usdFromUsage(args.model, args.usage);
  const amountPln = amountUsd * rate;

  await supabase.from("cost_ledger").insert({
    workspace_id: WORKSPACE_ID,
    job_id: args.jobId,
    category: args.category,
    provider: args.model.provider,
    model: args.model.modelId,
    usage: args.usage as unknown as Database["public"]["Tables"]["cost_ledger"]["Row"]["usage"],
    amount_usd_cents: amountUsd * 100,
    amount_pln_cents: amountPln * 100,
    fx_rate: rate,
    estimated:
      args.estimated !== undefined
        ? args.estimated
        : args.model.provider === "mock" || !usage_has_real_numbers(args.usage),
    created_by: args.userId,
  });

  return { amountUsd, amountPln };
}

function usage_has_real_numbers(usage: ProviderUsage): boolean {
  return Boolean(usage.inputTokens || usage.outputTokens || usage.imagesGenerated);
}
