"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatPln } from "@/lib/format";

interface BudgetStatus {
  monthlyLimitPlnCents: number;
  spentMonthPlnCents: number;
  percent: number;
  hardLimitEnabled: boolean;
  blocked: boolean;
}

export function BudgetForm({ initial }: { initial: BudgetStatus }) {
  const [limit, setLimit] = useState((initial.monthlyLimitPlnCents / 100).toFixed(0));
  const [hardLimit, setHardLimit] = useState(initial.hardLimitEnabled);
  const [status, setStatus] = useState<BudgetStatus>(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await apiFetch("/api/admin/budget", {
        method: "PATCH",
        body: JSON.stringify({ monthlyLimitPlnCents: Math.round(Number(limit) * 100), hardLimitEnabled: hardLimit }),
      });
      const fresh = await apiFetch<BudgetStatus>("/api/admin/budget");
      setStatus(fresh);
    } finally {
      setSaving(false);
    }
  }

  async function override() {
    setSaving(true);
    try {
      await apiFetch("/api/admin/budget", { method: "PATCH", body: JSON.stringify({ override: true }) });
      const fresh = await apiFetch<BudgetStatus>("/api/admin/budget");
      setStatus(fresh);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {formatPln(status.spentMonthPlnCents / 100)} / {formatPln(status.monthlyLimitPlnCents / 100)} ({status.percent}%)
        {status.blocked && <Badge tone="danger" className="ml-2">zablokowano</Badge>}
      </p>
      <div>
        <Label htmlFor="limit">Limit miesięczny (zł)</Label>
        <Input id="limit" type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={hardLimit} onChange={(e) => setHardLimit(e.target.checked)} />
        Twardy limit (blokuj nowe generacje po przekroczeniu)
      </label>
      <Button size="sm" loading={saving} onClick={save}>
        Zapisz
      </Button>
      {status.blocked && (
        <Button size="sm" variant="secondary" loading={saving} onClick={override}>
          Odblokuj ręcznie (override)
        </Button>
      )}
    </div>
  );
}
