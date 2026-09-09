"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Suggestion {
  id: string;
  title: string;
  body: string;
  status: "proposed" | "applied" | "rejected";
}

export default function SuggestionsPage() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await apiFetch<{ suggestions: Suggestion[] }>("/api/admin/system-suggestions");
    setItems(res.suggestions);
  }

  useEffect(() => {
    // Pobranie danych po zamontowaniu — funkcja load() jest też wywoływana ręcznie po akcjach (zapis/publikacja).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function generate() {
    setBusy(true);
    try {
      await apiFetch("/api/admin/system-suggestions/generate", { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function resolve(id: string, action: "applied" | "rejected") {
    await apiFetch(`/api/admin/system-suggestions/${id}/resolve`, { method: "POST", body: JSON.stringify({ action }) });
    await load();
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sugestie systemu</h1>
        <Button size="sm" loading={busy} onClick={generate}>
          Przeanalizuj
        </Button>
      </div>
      {items.length === 0 ? (
        <Card className="text-center text-sm text-muted">Brak sugestii.</Card>
      ) : (
        items.map((s) => (
          <Card key={s.id}>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium">{s.title}</p>
              <Badge tone={s.status === "applied" ? "success" : s.status === "rejected" ? "danger" : "neutral"}>
                {s.status}
              </Badge>
            </div>
            <p className="text-sm text-muted">{s.body}</p>
            {s.status === "proposed" && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => resolve(s.id, "applied")}>
                  Zastosuj
                </Button>
                <Button size="sm" variant="secondary" onClick={() => resolve(s.id, "rejected")}>
                  Odrzuć
                </Button>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
