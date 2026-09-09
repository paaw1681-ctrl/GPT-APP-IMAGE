import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";
import { WORKSPACE_ID } from "@/lib/auth/session";

type Client = SupabaseClient<Database>;

export interface BudgetStatus {
  monthlyLimitPlnCents: number;
  spentTodayPlnCents: number;
  spentMonthPlnCents: number;
  percent: number;
  hardLimitEnabled: boolean;
  blocked: boolean;
}

function monthStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function todayStart(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Aktualny stan budżetu miesięcznego (sekcja 44) — dashboard i strażnik kosztów go używają. */
export async function getBudgetStatus(supabase: Client): Promise<BudgetStatus> {
  const month = monthStart();
  const { data: budget } = await supabase
    .from("budgets")
    .select("monthly_limit_pln_cents, hard_limit_enabled")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("month", month)
    .maybeSingle();

  const limit = budget?.monthly_limit_pln_cents ?? 10000;
  const hardLimitEnabled = budget?.hard_limit_enabled ?? false;

  const { data: monthRows } = await supabase
    .from("cost_ledger")
    .select("amount_pln_cents, created_at")
    .eq("workspace_id", WORKSPACE_ID)
    .gte("created_at", `${month}T00:00:00Z`);

  const spentMonth = (monthRows ?? []).reduce((sum, r) => sum + Number(r.amount_pln_cents), 0);
  const today = todayStart();
  const spentToday = (monthRows ?? [])
    .filter((r) => r.created_at.slice(0, 10) === today)
    .reduce((sum, r) => sum + Number(r.amount_pln_cents), 0);

  const percent = limit > 0 ? (spentMonth / 100 / (limit / 100)) * 100 : 0;

  return {
    monthlyLimitPlnCents: limit,
    spentTodayPlnCents: Math.round(spentToday),
    spentMonthPlnCents: Math.round(spentMonth),
    percent: Math.round(percent * 10) / 10,
    hardLimitEnabled,
    blocked: hardLimitEnabled && percent >= 100,
  };
}

/** Rzuca czytelny błąd PL, jeśli twardy limit budżetu jest przekroczony i nie było ręcznego override. */
export async function assertBudgetAllows(supabase: Client): Promise<void> {
  const status = await getBudgetStatus(supabase);
  if (status.blocked) {
    throw new BudgetExceededError(
      `Przekroczono miesięczny budżet AI (${(status.spentMonthPlnCents / 100).toFixed(2)} / ${(status.monthlyLimitPlnCents / 100).toFixed(2)} zł). Włączony jest twardy limit — nowe płatne generacje są zablokowane. Uprawniony użytkownik może zwiększyć budżet w Ustawieniach.`,
    );
  }
}

export class BudgetExceededError extends Error {}
