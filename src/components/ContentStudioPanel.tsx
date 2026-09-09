"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const CHANNELS = [
  { key: "sklep", label: "Sklep" },
  { key: "instagram", label: "Instagram" },
  { key: "meta_ads", label: "Meta Ads" },
  { key: "pinterest", label: "Pinterest" },
] as const;

type Channel = (typeof CHANNELS)[number]["key"];

interface ContentPayload {
  instagram?: { caption: string; alt: string; hashtags: string[] };
  meta_ads?: { primary_text: string; headline: string; description: string };
  sklep?: { alt: string; seo_filename: string; short_description: string };
  pinterest?: { title: string; description: string };
}

export function ContentStudioPanel({ assetId }: { assetId: string }) {
  const [channel, setChannel] = useState<Channel>("sklep");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<ContentPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ content: { payload: ContentPayload } }>(`/api/assets/${assetId}/content`, {
        method: "POST",
        body: JSON.stringify({ channel }),
      });
      setContent(res.content.payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się przygotować opisu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-3 bg-background">
      <div className="flex flex-wrap gap-2">
        {CHANNELS.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setChannel(c.key);
              setContent(null);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              channel === c.key ? "border-primary bg-primary/10 font-medium" : "border-border"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {!content ? (
        <Button size="sm" className="w-full" loading={loading} onClick={generate}>
          Wygeneruj opis
        </Button>
      ) : (
        <div className="space-y-2 text-sm">
          {channel === "sklep" && content.sklep && (
            <>
              <p><strong>ALT:</strong> {content.sklep.alt}</p>
              <p><strong>Nazwa pliku:</strong> {content.sklep.seo_filename}</p>
              <p>{content.sklep.short_description}</p>
            </>
          )}
          {channel === "instagram" && content.instagram && (
            <>
              <p>{content.instagram.caption}</p>
              <p className="text-muted">{content.instagram.hashtags.join(" ")}</p>
            </>
          )}
          {channel === "meta_ads" && content.meta_ads && (
            <>
              <p><strong>{content.meta_ads.headline}</strong></p>
              <p>{content.meta_ads.primary_text}</p>
              <p className="text-muted">{content.meta_ads.description}</p>
            </>
          )}
          {channel === "pinterest" && content.pinterest && (
            <>
              <p><strong>{content.pinterest.title}</strong></p>
              <p>{content.pinterest.description}</p>
            </>
          )}
          <Button size="sm" variant="secondary" className="w-full" loading={loading} onClick={generate}>
            Inna wersja
          </Button>
        </div>
      )}
      {error && <p className="text-danger text-sm">{error}</p>}
    </Card>
  );
}
