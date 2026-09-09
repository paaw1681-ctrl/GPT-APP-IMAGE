import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBudgetStatus } from "@/lib/cost/budget";
import { WORKSPACE_ID } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { BudgetForm } from "@/components/BudgetForm";
import { InstallPwaHint } from "@/components/InstallPwaHint";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const [budget, { data: members }] = await Promise.all([
    getBudgetStatus(supabase),
    supabase.from("workspace_members").select("display_name, user_id").eq("workspace_id", WORKSPACE_ID),
  ]);

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-6">
      <h1 className="text-xl font-semibold">Ustawienia</h1>

      <InstallPwaHint />

      <Card>
        <p className="mb-3 text-sm font-medium">Budżet miesięczny AI</p>
        <BudgetForm initial={budget} />
      </Card>

      <Card>
        <p className="mb-2 text-sm font-medium">Zespół Oak &amp; Oats</p>
        <ul className="space-y-1 text-sm text-muted">
          {(members ?? []).map((m) => (
            <li key={m.user_id}>{m.display_name ?? m.user_id}</li>
          ))}
        </ul>
      </Card>

      <Link href="/admin" className="block text-center text-sm text-primary">
        Panel administracyjny →
      </Link>
    </div>
  );
}
