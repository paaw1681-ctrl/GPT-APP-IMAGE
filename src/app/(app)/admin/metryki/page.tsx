"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { formatPln } from "@/lib/format";

interface Metrics {
  totalFinals: number;
  acceptedFinals: number;
  acceptanceRate: number | null;
  costPerAcceptedFinalPln: number | null;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    apiFetch<Metrics>("/api/admin/metrics").then(setMetrics);
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
      <h1 className="text-xl font-semibold">Metryki</h1>
      {metrics && (
        <Card className="space-y-2 text-sm">
          <Row label="Finały łącznie" value={String(metrics.totalFinals)} />
          <Row label="Zaakceptowane finały" value={String(metrics.acceptedFinals)} />
          <Row
            label="Wskaźnik akceptacji"
            value={metrics.acceptanceRate !== null ? `${Math.round(metrics.acceptanceRate * 100)}%` : "—"}
          />
          <Row
            label="Koszt / zaakceptowany final"
            value={metrics.costPerAcceptedFinalPln !== null ? formatPln(metrics.costPerAcceptedFinalPln) : "—"}
          />
        </Card>
      )}
      <p className="text-xs text-muted">
        To najważniejsza metryka kosztowa (sekcja 39 specyfikacji) — tańszy model, który potrzebuje wielu prób, może być
        droższy w praktyce niż droższy model trafiający za pierwszym razem.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
