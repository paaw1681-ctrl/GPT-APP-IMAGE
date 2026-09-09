"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ContentStudioPanel } from "@/components/ContentStudioPanel";

interface QualityReview {
  status: "ready" | "check" | "improve";
  product_fidelity: string;
  realism: string;
  issues: string[];
}

interface Asset {
  id: string;
  url: string | null;
  kind: "prototype" | "final";
  quality_reviews?: QualityReview[];
}

const FIDELITY_LABEL: Record<string, string> = { high: "WYSOKA", medium: "ŚREDNIA", low: "NISKA" };
const REALISM_LABEL: Record<string, string> = { high: "WYSOKI", medium: "ŚREDNI", low: "NISKI" };
const STATUS_LABEL: Record<string, { text: string; tone: "success" | "warning" | "danger" }> = {
  ready: { text: "✅ Gotowe do publikacji", tone: "success" },
  check: { text: "⚠️ Sprawdź", tone: "warning" },
  improve: { text: "❌ Zalecam poprawę", tone: "danger" },
};

export function GeneratedAssetView({ asset }: { asset: Asset }) {
  const [feedbackSent, setFeedbackSent] = useState<"liked" | "disliked" | null>(null);
  const [showReasons, setShowReasons] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const review = asset.quality_reviews?.[asset.quality_reviews.length - 1];

  async function sendFeedback(sentiment: "liked" | "disliked", reasons: string[] = []) {
    setFeedbackSent(sentiment);
    setShowReasons(false);
    try {
      await apiFetch(`/api/assets/${asset.id}/feedback`, {
        method: "POST",
        body: JSON.stringify({ sentiment, reasons }),
      });
    } catch {
      // Feedback nie jest krytyczny dla flow — cicho ignorujemy błąd sieci.
    }
  }

  async function share() {
    if (!asset.url) return;
    try {
      const res = await fetch(asset.url);
      const blob = await res.blob();
      const file = new File([blob], `oakoats-${asset.id}.png`, { type: blob.type });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Oak & Oats" });
      } else {
        const a = document.createElement("a");
        a.href = asset.url;
        a.download = `oakoats-${asset.id}.png`;
        a.click();
      }
    } catch {
      // Użytkownik anulował udostępnianie — nic nie robimy.
    }
  }

  return (
    <Card className="space-y-3">
      {asset.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.url} alt="Wygenerowane zdjęcie" className="w-full rounded-xl object-cover" />
      )}

      {asset.kind === "final" && review && (
        <div className="space-y-1.5 rounded-xl bg-background p-3 text-sm">
          <Badge tone={STATUS_LABEL[review.status].tone}>{STATUS_LABEL[review.status].text}</Badge>
          <p>ZGODNOŚĆ PRODUKTU: {FIDELITY_LABEL[review.product_fidelity] ?? review.product_fidelity}</p>
          <p>REALIZM: {REALISM_LABEL[review.realism] ?? review.realism}</p>
          {review.issues.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-muted">
              {review.issues.slice(0, 3).map((issue, i) => (
                <li key={i}>• {issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => sendFeedback("liked")}
          className={`text-2xl ${feedbackSent === "liked" ? "opacity-100" : "opacity-50"}`}
          aria-label="Trafione"
        >
          ❤️
        </button>
        <button
          onClick={() => setShowReasons((v) => !v)}
          className={`text-2xl ${feedbackSent === "disliked" ? "opacity-100" : "opacity-50"}`}
          aria-label="Nie ten kierunek"
        >
          👎
        </button>
        {asset.url && (
          <Button size="sm" variant="secondary" onClick={share} className="ml-auto">
            Pobierz / udostępnij
          </Button>
        )}
      </div>

      {showReasons && (
        <div className="flex flex-wrap gap-2">
          {["produkt się nie zgadza", "wygląda jak AI", "scena", "osoba", "ubranie", "kadr", "kolorystyka", "inny"].map(
            (reason) => (
              <button
                key={reason}
                onClick={() => sendFeedback("disliked", [reason])}
                className="rounded-full border border-border px-2.5 py-1 text-xs"
              >
                {reason}
              </button>
            ),
          )}
        </div>
      )}

      {asset.kind === "final" && (
        <Button size="sm" variant="secondary" className="w-full" onClick={() => setShowContent((v) => !v)}>
          Przygotować również opis?
        </Button>
      )}
      {showContent && <ContentStudioPanel assetId={asset.id} />}
    </Card>
  );
}
