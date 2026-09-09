"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { apiFetch, newIdempotencyKey } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { PHOTO_TYPES } from "@/lib/prompt/photoTypes";
import { GeneratedAssetView } from "@/components/GeneratedAssetView";

interface Concept {
  id: string;
  idea_text: string;
  photo_type: string;
  purpose: string;
  aspect_ratio: string;
}

interface JobAsset {
  id: string;
  url: string | null;
  kind: "prototype" | "final";
  quality_reviews?: {
    status: "ready" | "check" | "improve";
    product_fidelity: string;
    realism: string;
    issues: string[];
  }[];
}

type Phase = "wybor" | "koncepcja" | "generowanie" | "wynik";

export default function GeneratorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = usePromise(params);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("wybor");
  const [photoType, setPhotoType] = useState("lifestyle");
  const [creative, setCreative] = useState(false);
  const [count, setCount] = useState(1);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [concept, setConcept] = useState<Concept | null>(null);
  const [mode, setMode] = useState<"prototype" | "final">("prototype");
  const [estimate, setEstimate] = useState<{ minPln: number; maxPln: number; mock: boolean } | null>(null);
  const [job, setJob] = useState<{ id: string; status: string; error_message?: string | null } | null>(null);
  const [assets, setAssets] = useState<JobAsset[]>([]);
  const [costGuardTip, setCostGuardTip] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ session: { id: string } }>(`/api/products/${productId}/sessions`, { method: "POST" })
      .then((res) => setSessionId(res.session.id))
      .catch((e) => setError(e instanceof Error ? e.message : "Nie udało się rozpocząć sesji."));
  }, [productId]);

  async function proposeConcept(userNote?: string) {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    setCostGuardTip(null);
    setEstimate(null);
    try {
      const res = await apiFetch<{ concept: Concept }>(`/api/sessions/${sessionId}/concepts`, {
        method: "POST",
        body: JSON.stringify({ photoType, creative, userNote: userNote ?? (note || undefined) }),
      });
      setConcept(res.concept);
      setPhase("koncepcja");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się przygotować koncepcji.");
    } finally {
      setBusy(false);
    }
  }

  async function loadEstimate(nextMode: "prototype" | "final") {
    setMode(nextMode);
    setError(null);
    try {
      const res = await apiFetch<{ minPln: number; maxPln: number; mock: boolean }>(
        `/api/sessions/${sessionId}/generate/estimate`,
        { method: "POST", body: JSON.stringify({ mode: nextMode, count, referenceCount: 3 }) },
      );
      setEstimate(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się oszacować kosztu.");
    }
  }

  async function runGeneration() {
    if (!sessionId || !concept) return;
    setPhase("generowanie");
    setError(null);
    try {
      const res = await apiFetch<{
        job: { id: string; status: string };
        assets: JobAsset[];
        costGuardTip?: string | null;
      }>(`/api/sessions/${sessionId}/generate`, {
        method: "POST",
        body: JSON.stringify({
          conceptId: concept.id,
          mode,
          count,
          idempotencyKey: newIdempotencyKey(),
        }),
      });
      setJob(res.job);
      setCostGuardTip(res.costGuardTip ?? null);
      await pollJob(res.job.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generacja nie powiodła się. Nie naliczono kolejnej próby automatycznie.");
      setPhase("koncepcja");
    }
  }

  async function pollJob(jobId: string) {
    for (let i = 0; i < 60; i++) {
      const res = await apiFetch<{ job: { id: string; status: string; error_message?: string | null }; assets: JobAsset[] }>(
        `/api/jobs/${jobId}`,
      );
      setJob(res.job);
      if (res.job.status === "completed") {
        setAssets(res.assets);
        setPhase("wynik");
        return;
      }
      if (res.job.status === "failed") {
        setError(res.job.error_message ?? "Generacja nie powiodła się.");
        setPhase("koncepcja");
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setError("Generacja trwa dłużej niż zwykle. Wróć tu za chwilę.");
    setPhase("koncepcja");
  }

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Generator</h1>
        <Link href={`/produkty/${productId}`} className="text-sm text-primary">
          Wróć do produktu
        </Link>
      </div>

      {error && (
        <Card className="border-danger/30 bg-danger-bg text-sm text-danger">{error}</Card>
      )}

      {phase === "wybor" && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Co tworzymy?</p>
            <div className="grid grid-cols-2 gap-2">
              {PHOTO_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setPhotoType(t.key)}
                  className={`rounded-xl border px-3 py-3 text-sm ${
                    photoType === t.key ? "border-primary bg-primary/10 font-medium" : "border-border bg-surface"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={creative} onChange={(e) => setCreative(e.target.checked)} />
            Bardziej kreatywnie / Editorial
          </label>

          <button className="text-sm text-primary" onClick={() => setAdvancedOpen((v) => !v)}>
            {advancedOpen ? "Ukryj zaawansowane" : "Zaawansowane"}
          </button>

          {advancedOpen && (
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-sm text-muted">Dodatkowa uwaga (opcjonalnie)</p>
                <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="np. bez uśmiechu, chłodniejsze światło…" />
              </div>
              <div>
                <p className="mb-1 text-sm text-muted">Liczba obrazów</p>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`h-10 flex-1 rounded-xl border text-sm ${
                        count === n ? "border-primary bg-primary/10 font-medium" : "border-border"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setCount(5)}
                    className={`h-10 flex-1 rounded-xl border text-sm ${
                      count === 5 ? "border-danger bg-danger-bg font-medium text-danger" : "border-border"
                    }`}
                  >
                    5
                  </button>
                </div>
                {count > 1 && (
                  <p className="mt-1 text-xs text-warning">
                    Zwykle wystarczy 1 prototyp, żeby ocenić kierunek — {count}× to {count}× wyższy koszt.
                  </p>
                )}
              </div>
            </div>
          )}

          <Button className="w-full" size="lg" loading={busy} disabled={!sessionId} onClick={() => proposeConcept()}>
            Zaproponuj / generuj
          </Button>
        </div>
      )}

      {phase === "koncepcja" && concept && (
        <div className="space-y-4">
          <Card>
            <p className="mb-1 text-sm font-semibold text-primary">Pomysł AI</p>
            <p className="text-sm">{concept.idea_text}</p>
          </Card>

          {!estimate ? (
            <Button className="w-full" size="lg" onClick={() => loadEstimate("prototype")}>
              Generuj prototyp
            </Button>
          ) : (
            <Card className="space-y-3">
              <p className="text-sm">
                Szacowany koszt:{" "}
                <strong>
                  {estimate.mock ? "0 zł (tryb mock)" : `ok. ${estimate.minPln.toFixed(2)}–${estimate.maxPln.toFixed(2)} zł`}
                </strong>
              </p>
              <Button className="w-full" size="lg" onClick={runGeneration}>
                Potwierdź i generuj
              </Button>
            </Card>
          )}

          <Button variant="secondary" className="w-full" loading={busy} onClick={() => proposeConcept()}>
            Inny pomysł
          </Button>
        </div>
      )}

      {phase === "generowanie" && (
        <Card className="py-10 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted">
            {mode === "prototype" ? "Tworzę prototyp…" : "Tworzę wersję finalną…"} ({job?.status ?? "queued"})
          </p>
        </Card>
      )}

      {phase === "wynik" && assets.length > 0 && (
        <div className="space-y-4">
          {assets.map((a) => (
            <GeneratedAssetView key={a.id} asset={a} />
          ))}

          {mode === "prototype" ? (
            <div className="space-y-2">
              {costGuardTip && (
                <p className="rounded-xl bg-primary/5 px-3 py-2 text-sm text-primary">{costGuardTip}</p>
              )}
              <Button className="w-full" size="lg" onClick={() => { setEstimate(null); loadEstimate("final"); setPhase("koncepcja"); }}>
                Finalizuj
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => proposeConcept()}>
                Inny pomysł
              </Button>
              <QuickFix onPick={(text) => proposeConcept(text)} />
            </div>
          ) : (
            <Card className="text-center text-sm text-muted">
              Zdjęcie finalne gotowe. Sprawdź ocenę Quality Gate powyżej i pobierz plik.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function QuickFix({ onPick }: { onPick: (note: string) => void }) {
  const options = [
    "Zachowaj scenę, popraw produkt",
    "Więcej realizmu",
    "Inna osoba",
    "Inny kadr",
    "Inne miejsce",
  ];
  return (
    <div>
      <p className="mb-2 text-sm text-muted">Popraw:</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onPick(o)} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs">
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
