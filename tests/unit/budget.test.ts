import { describe, it, expect } from "vitest";
import { getBudgetStatus } from "@/lib/cost/budget";
import { mockSupabase } from "./helpers/mockSupabase";

describe("getBudgetStatus", () => {
  it("oblicza procent wykorzystania budżetu", async () => {
    const supabase = mockSupabase({
      budgets: { data: { monthly_limit_pln_cents: 10000, hard_limit_enabled: false }, error: null },
      cost_ledger: {
        data: [
          { amount_pln_cents: 3000, created_at: new Date().toISOString() },
          { amount_pln_cents: 2000, created_at: new Date().toISOString() },
        ],
        error: null,
      },
    });
    const status = await getBudgetStatus(supabase as never);
    expect(status.spentMonthPlnCents).toBe(5000);
    expect(status.percent).toBe(50);
    expect(status.blocked).toBe(false);
  });

  it("blokuje generacje dopiero gdy twardy limit jest włączony i przekroczony", async () => {
    const supabase = mockSupabase({
      budgets: { data: { monthly_limit_pln_cents: 1000, hard_limit_enabled: true }, error: null },
      cost_ledger: { data: [{ amount_pln_cents: 1500, created_at: new Date().toISOString() }], error: null },
    });
    const status = await getBudgetStatus(supabase as never);
    expect(status.percent).toBeGreaterThanOrEqual(100);
    expect(status.blocked).toBe(true);
  });

  it("nie blokuje, gdy twardy limit jest wyłączony, nawet po przekroczeniu", async () => {
    const supabase = mockSupabase({
      budgets: { data: { monthly_limit_pln_cents: 1000, hard_limit_enabled: false }, error: null },
      cost_ledger: { data: [{ amount_pln_cents: 5000, created_at: new Date().toISOString() }], error: null },
    });
    const status = await getBudgetStatus(supabase as never);
    expect(status.blocked).toBe(false);
  });
});
