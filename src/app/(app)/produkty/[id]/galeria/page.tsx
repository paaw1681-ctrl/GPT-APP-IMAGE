"use client";

import { useEffect, useState, use as usePromise } from "react";
import { apiFetch } from "@/lib/api/client";
import { GeneratedAssetView } from "@/components/GeneratedAssetView";
import { Card } from "@/components/ui/Card";

interface Asset {
  id: string;
  url: string | null;
  kind: "prototype" | "final";
  is_favorite: boolean;
  quality_reviews?: { status: "ready" | "check" | "improve"; product_fidelity: string; realism: string; issues: string[] }[];
}

type Tab = "prototypes" | "finals" | "favorites";

export default function ProductGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = usePromise(params);
  const [tab, setTab] = useState<Tab>("finals");
  const [data, setData] = useState<{ prototypes: Asset[]; finals: Asset[]; favorites: Asset[] } | null>(null);

  useEffect(() => {
    apiFetch<{ prototypes: Asset[]; finals: Asset[]; favorites: Asset[] }>(`/api/products/${productId}/gallery`).then(setData);
  }, [productId]);

  const items = data ? data[tab === "prototypes" ? "prototypes" : tab === "finals" ? "finals" : "favorites"] : [];

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
      <h1 className="text-xl font-semibold">Galeria produktu</h1>
      <div className="flex gap-2">
        {(["finals", "prototypes", "favorites"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl border py-2 text-sm ${
              tab === t ? "border-primary bg-primary/10 font-medium" : "border-border"
            }`}
          >
            {t === "finals" ? "FINALE" : t === "prototypes" ? "PROTOTYPY" : "ULUBIONE"}
          </button>
        ))}
      </div>

      {!data ? (
        <Card className="text-center text-sm text-muted">Ładowanie…</Card>
      ) : items.length === 0 ? (
        <Card className="text-center text-sm text-muted">Brak zdjęć w tej kategorii.</Card>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <GeneratedAssetView key={a.id} asset={a} />
          ))}
        </div>
      )}
    </div>
  );
}
