import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBudgetStatus } from "@/lib/cost/budget";
import { WORKSPACE_ID } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BUCKET } from "@/lib/storage/paths";

function pln(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " zł";
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: products }, { data: sessions }, budget, { data: suggestion }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, status, updated_at, product_references(storage_path_preview, role)")
      .eq("workspace_id", WORKSPACE_ID)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("sessions")
      .select("id, product_id, created_at, products(name)")
      .eq("workspace_id", WORKSPACE_ID)
      .order("created_at", { ascending: false })
      .limit(5),
    getBudgetStatus(supabase),
    supabase
      .from("system_suggestions")
      .select("id, title, body")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("status", "proposed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const productsWithUrls = await Promise.all(
    (products ?? []).map(async (p) => {
      const master = (p.product_references as { storage_path_preview: string; role: string }[]).find(
        (r) => r.role === "master",
      );
      const path = master?.storage_path_preview ?? (p.product_references as { storage_path_preview: string }[])[0]?.storage_path_preview;
      const url = path ? (await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)).data?.signedUrl : null;
      return { ...p, previewUrl: url ?? null };
    }),
  );

  return (
    <div className="mx-auto max-w-md px-4 py-6 space-y-6">
      <Link href="/produkty/nowy">
        <Button size="lg" className="w-full">
          + Nowy produkt
        </Button>
      </Link>

      {suggestion && (
        <Card className="border-primary/30 bg-primary/5">
          <p className="text-sm font-medium text-primary">Sugestia AI</p>
          <p className="mt-1 text-sm">{suggestion.title}</p>
        </Card>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">Ostatnie produkty</h2>
        </div>
        {productsWithUrls.length === 0 ? (
          <Card className="text-center text-sm text-muted">
            Nie masz jeszcze żadnego produktu. Dodaj pierwszy, żeby zacząć.
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {productsWithUrls.map((p) => (
              <Link
                key={p.id}
                href={`/produkty/${p.id}`}
                className="block overflow-hidden rounded-xl border border-border bg-surface"
              >
                <div className="aspect-square bg-background">
                  {p.previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.previewUrl} alt={p.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="truncate px-2 py-1.5 text-xs">{p.name}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Ostatnie sesje</h2>
        {(sessions ?? []).length === 0 ? (
          <Card className="text-center text-sm text-muted">Brak sesji generowania.</Card>
        ) : (
          <div className="space-y-2">
            {(sessions ?? []).map((s) => (
              <Link key={s.id} href={`/produkty/${s.product_id}/generuj?sesja=${s.id}`}>
                <Card className="flex items-center justify-between py-3">
                  <span className="text-sm">{(s.products as { name: string } | null)?.name ?? "Produkt"}</span>
                  <span className="text-xs text-muted">
                    {new Date(s.created_at).toLocaleDateString("pl-PL")}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Koszt</h2>
        <Card className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Dzisiaj</span>
            <span className="font-medium">{pln(budget.spentTodayPlnCents)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Ten miesiąc</span>
            <span className="font-medium">{pln(budget.spentMonthPlnCents)}</span>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>
                Budżet: {pln(budget.spentMonthPlnCents)} / {pln(budget.monthlyLimitPlnCents)}
              </span>
              <Badge tone={budget.percent >= 100 ? "danger" : budget.percent >= 80 ? "warning" : "success"}>
                {budget.percent}%
              </Badge>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-background">
              <div
                className={`h-full ${budget.percent >= 100 ? "bg-danger" : budget.percent >= 80 ? "bg-warning" : "bg-success"}`}
                style={{ width: `${Math.min(100, budget.percent)}%` }}
              />
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
