"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface ConfigOption {
  id: string;
  key: string;
  label_pl: string;
}

interface AnalysisResult {
  product_name: string;
  product_type_key: string;
  product_type_confidence: "low" | "medium" | "high";
  audience_context_key: string;
  letters: string | null;
  engraving: string | null;
  reference_quality_status: "sufficient" | "can_improve";
  reference_quality_notes: string[];
}

type Step = "upload" | "analyzing" | "confirm";

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [productTypes, setProductTypes] = useState<ConfigOption[]>([]);
  const [audienceContexts, setAudienceContexts] = useState<ConfigOption[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [form, setForm] = useState({
    name: "",
    product_type_id: "",
    audience_context_id: "",
    letters: "",
    engraving: "",
  });

  useEffect(() => {
    apiFetch<{ productTypes: ConfigOption[]; audienceContexts: ConfigOption[] }>("/api/config").then((res) => {
      setProductTypes(res.productTypes);
      setAudienceContexts(res.audienceContexts);
    });
  }, []);

  async function ensureProduct(): Promise<string> {
    if (productId) return productId;
    const res = await apiFetch<{ product: { id: string } }>("/api/products", {
      method: "POST",
      body: JSON.stringify({ name: "Nowy produkt" }),
    });
    setProductId(res.product.id);
    return res.product.id;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const id = await ensureProduct();
      // Jeden plik na request — kilka zdjęć z iPhone'a w jednym multipart body
      // łatwo przekracza limit rozmiaru żądania funkcji serverless (Vercel).
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("files", file);
        const res = await fetch(`/api/products/${id}/references`, { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Nie udało się przesłać zdjęć.");
        setPreviews((prev) => [
          ...prev,
          ...json.references.map((r: { previewUrl: string }) => r.previewUrl).filter(Boolean),
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się przesłać zdjęć.");
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze() {
    if (!productId) return;
    setStep("analyzing");
    setError(null);
    try {
      const res = await apiFetch<{ profileId: string; profile: AnalysisResult }>(`/api/products/${productId}/analyze`, {
        method: "POST",
      });
      setProfileId(res.profileId);
      setAnalysis(res.profile);
      const matchedType = productTypes.find((t) => t.key === res.profile.product_type_key);
      const matchedAudience = audienceContexts.find((t) => t.key === res.profile.audience_context_key);
      setForm({
        name: res.profile.product_name || "Nowy produkt",
        product_type_id: matchedType?.id ?? "",
        audience_context_id: matchedAudience?.id ?? "",
        letters: res.profile.letters ?? "",
        engraving: res.profile.engraving ?? "",
      });
      setStep("confirm");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analiza nie powiodła się.");
      setStep("upload");
    }
  }

  async function handleConfirm() {
    if (!productId || !profileId) return;
    setError(null);
    try {
      await apiFetch(`/api/products/${productId}/lock`, {
        method: "POST",
        body: JSON.stringify({
          profileId,
          product_type_id: form.product_type_id,
          audience_context_id: form.audience_context_id,
          name: form.name,
          letters: form.letters || null,
          engraving: form.engraving || null,
        }),
      });
      router.push(`/produkty/${productId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się zapisać.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 space-y-5">
      <h1 className="text-xl font-semibold">Nowy produkt</h1>

      {step === "upload" && (
        <>
          <Card>
            <p className="mb-3 text-sm text-muted">
              Wrzuć 1–5 zdjęć prawdziwego produktu. Możesz zrobić zdjęcie aparatem albo wybrać z biblioteki.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              capture="environment"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button className="w-full" onClick={() => fileInputRef.current?.click()} loading={uploading}>
              Dodaj zdjęcia ({previews.length}/5)
            </Button>
          </Card>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="aspect-square rounded-xl object-cover" />
              ))}
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button className="w-full" size="lg" disabled={previews.length === 0} onClick={handleAnalyze}>
            Analizuj produkt
          </Button>
        </>
      )}

      {step === "analyzing" && (
        <Card className="py-10 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted">Analizuję zdjęcia produktu…</p>
        </Card>
      )}

      {step === "confirm" && analysis && (
        <div className="space-y-4">
          <Card>
            <Badge tone={analysis.reference_quality_status === "sufficient" ? "success" : "warning"}>
              {analysis.reference_quality_status === "sufficient" ? "Referencje: wystarczające" : "Można ulepszyć"}
            </Badge>
            {analysis.reference_quality_notes.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {analysis.reference_quality_notes.map((n, i) => (
                  <li key={i}>• {n}</li>
                ))}
              </ul>
            )}
          </Card>

          <div>
            <Label htmlFor="name">Nazwa produktu</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <Label>Co to za produkt?</Label>
            {analysis.product_type_confidence === "low" && (
              <p className="mb-1 text-xs text-warning">Nie jestem pewien — sprawdź kategorię.</p>
            )}
            <select
              className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-[15px]"
              value={form.product_type_id}
              onChange={(e) => setForm({ ...form, product_type_id: e.target.value })}
            >
              <option value="">Wybierz…</option>
              {productTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label_pl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Dla kogo jest produkt?</Label>
            <select
              className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-[15px]"
              value={form.audience_context_id}
              onChange={(e) => setForm({ ...form, audience_context_id: e.target.value })}
            >
              <option value="">Wybierz…</option>
              {audienceContexts.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label_pl}
                </option>
              ))}
            </select>
          </div>

          {(analysis.letters || analysis.engraving) && (
            <Card>
              <p className="mb-2 text-sm font-medium">Rozpoznana personalizacja</p>
              {analysis.letters && (
                <div className="mb-2">
                  <Label htmlFor="letters">Litery</Label>
                  <Input id="letters" value={form.letters} onChange={(e) => setForm({ ...form, letters: e.target.value })} />
                </div>
              )}
              {analysis.engraving && (
                <div>
                  <Label htmlFor="engraving">Grawer</Label>
                  <Input id="engraving" value={form.engraving} onChange={(e) => setForm({ ...form, engraving: e.target.value })} />
                </div>
              )}
              <p className="mt-2 text-xs text-muted">Sprawdź, czy litery się zgadzają — to krytyczna cecha produktu.</p>
            </Card>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button
            className="w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={!form.product_type_id || !form.audience_context_id || !form.name}
          >
            Zapisz produkt
          </Button>
        </div>
      )}
    </div>
  );
}
