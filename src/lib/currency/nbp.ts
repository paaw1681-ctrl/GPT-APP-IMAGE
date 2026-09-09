import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

type Client = SupabaseClient<Database>;

const FALLBACK_USD_PLN = 4.0;

/**
 * Kurs USD/PLN z NBP (tabela A), cache'owany w tabeli currency_rates (1x/dzień).
 * Niedostępność NBP NIGDY nie blokuje generacji — używamy ostatniej znanej
 * wartości, a w ostateczności twardego fallbacku (sekcja 43).
 */
export async function getUsdPlnRate(supabase: Client): Promise<{ rate: number; date: string; stale: boolean }> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("currency_rates")
    .select("rate_date, usd_pln")
    .eq("rate_date", today)
    .maybeSingle();

  if (existing) {
    return { rate: Number(existing.usd_pln), date: existing.rate_date, stale: false };
  }

  try {
    const res = await fetch("https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json", {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = (await res.json()) as { rates: { effectiveDate: string; mid: number }[] };
      const rate = json.rates[0];
      if (rate) {
        await supabase.from("currency_rates").upsert(
          { rate_date: rate.effectiveDate, usd_pln: rate.mid, source: "nbp" },
          { onConflict: "rate_date" },
        );
        return { rate: rate.mid, date: rate.effectiveDate, stale: rate.effectiveDate !== today };
      }
    }
  } catch {
    // Brak internetu / NBP nie odpowiada — spadamy do ostatniej znanej wartości.
  }

  const { data: last } = await supabase
    .from("currency_rates")
    .select("rate_date, usd_pln")
    .order("rate_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last) {
    return { rate: Number(last.usd_pln), date: last.rate_date, stale: true };
  }

  return { rate: FALLBACK_USD_PLN, date: today, stale: true };
}
