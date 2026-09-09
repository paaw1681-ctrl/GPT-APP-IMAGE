"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Run {
  id: string;
  photo_type: string;
  model_a: string;
  model_b: string;
  status: string;
  result: string | null;
  estimated_cost_cents: number | null;
}

export default function TestLabPage() {
  const [runs, setRuns] = useState<Run[]>([]);

  async function load() {
    const res = await apiFetch<{ runs: Run[] }>("/api/admin/test-lab");
    setRuns(res.runs);
  }

  useEffect(() => {
    // Pobranie danych po zamontowaniu — funkcja load() jest też wywoływana ręcznie po akcjach (zapis/publikacja).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function markResult(id: string, result: "a_better" | "b_better" | "tie") {
    await apiFetch(`/api/admin/test-lab/${id}`, { method: "PATCH", body: JSON.stringify({ result, status: "completed" }) });
    await load();
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
      <h1 className="text-xl font-semibold">Test Lab</h1>
      <p className="text-sm text-muted">
        Porównania A/B prompt/model — plan testu ma zawsze widoczny kosztorys PRZED uruchomieniem. System nigdy sam nie
        odpala płatnego testu — każdą stronę uruchamiasz świadomie w generatorze, a wynik zapisujesz tutaj.
      </p>
      {runs.length === 0 ? (
        <Card className="text-center text-sm text-muted">Brak jeszcze żadnych testów.</Card>
      ) : (
        runs.map((r) => (
          <Card key={r.id}>
            <p className="text-sm font-medium">{r.photo_type}</p>
            <p className="text-xs text-muted">
              A: {r.model_a} vs B: {r.model_b} — szac. koszt {((r.estimated_cost_cents ?? 0) / 100).toFixed(2)} zł
            </p>
            {r.result ? (
              <Badge tone="success" className="mt-2">
                wynik: {r.result}
              </Badge>
            ) : (
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => markResult(r.id, "a_better")}>A lepsze</Button>
                <Button size="sm" onClick={() => markResult(r.id, "b_better")}>B lepsze</Button>
                <Button size="sm" variant="secondary" onClick={() => markResult(r.id, "tie")}>Remis</Button>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
