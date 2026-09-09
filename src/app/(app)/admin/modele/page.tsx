"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ModelRow {
  id: string;
  provider: string;
  model_id: string;
  purpose: string;
  quality: string | null;
  input_token_price: number | null;
  output_token_price: number | null;
  image_output_price: number | null;
  active: boolean;
  last_verified_at: string | null;
  source_url: string | null;
}

export default function ModelCatalogPage() {
  const [models, setModels] = useState<ModelRow[]>([]);

  useEffect(() => {
    apiFetch<{ models: ModelRow[] }>("/api/admin/model-catalog").then((r) => setModels(r.models));
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-3 overflow-x-auto px-4 py-6">
      <h1 className="text-xl font-semibold">Katalog modeli i cen</h1>
      <p className="text-sm text-muted">
        Ceny są orientacyjne — dla nowo wydanych modeli obrazu zweryfikuj je w oficjalnej dokumentacji dostawcy przed
        produkcyjnym użyciem. Ten panel nie pozwala AI na samodzielną zmianę stawek.
      </p>
      <div className="space-y-2">
        {models.map((m) => (
          <Card key={m.id} className="text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {m.purpose} — {m.provider}/{m.model_id}
              </span>
              <Badge tone={m.active ? "success" : "neutral"}>{m.active ? "aktywny" : "wyłączony"}</Badge>
            </div>
            <p className="mt-1 text-muted">{m.quality}</p>
            <p className="mt-1 text-xs text-muted">
              input: {m.input_token_price ?? "—"} / output: {m.output_token_price ?? "—"} / obraz:{" "}
              {m.image_output_price ?? "—"} USD
            </p>
            <p className="text-xs text-muted">
              zweryfikowano: {m.last_verified_at ? new Date(m.last_verified_at).toLocaleDateString("pl-PL") : "—"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
