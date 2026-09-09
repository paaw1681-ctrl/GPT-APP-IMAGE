"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

interface RulePack {
  id: string;
  version: number;
  status: string;
  rules: Record<string, unknown>;
  product_types: { key: string; label_pl: string };
}

export default function RulePacksPage() {
  const [packs, setPacks] = useState<RulePack[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await apiFetch<{ rulePacks: RulePack[] }>("/api/admin/rule-packs");
    setPacks(res.rulePacks);
  }

  useEffect(() => {
    // Pobranie danych po zamontowaniu — funkcja load() jest też wywoływana ręcznie po akcjach (zapis/publikacja).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function saveDraft(pack: RulePack) {
    setBusy(true);
    try {
      let rules: Record<string, unknown>;
      try {
        rules = JSON.parse(draftText);
      } catch {
        alert("Nieprawidłowy JSON.");
        return;
      }
      await apiFetch(`/api/admin/rule-packs`, {
        method: "POST",
        body: JSON.stringify({ product_type_id: (pack as unknown as { product_type_id: string }).product_type_id, rules }),
      });
      setEditing(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function publish(id: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/rule-packs/${id}/publish`, { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const grouped = packs.reduce<Record<string, RulePack[]>>((acc, p) => {
    const key = p.product_types?.label_pl ?? "?";
    (acc[key] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-semibold">Rule Packs</h1>
      {Object.entries(grouped).map(([label, versions]) => (
        <Card key={label}>
          <p className="mb-2 text-sm font-medium">{label}</p>
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v.id} className="rounded-lg border border-border p-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>
                    v{v.version} <Badge tone={v.status === "published" ? "success" : "neutral"}>{v.status}</Badge>
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="text-primary"
                      onClick={() => {
                        setEditing(v.id);
                        setDraftText(JSON.stringify(v.rules, null, 2));
                      }}
                    >
                      Edytuj jako nowy draft
                    </button>
                    {v.status === "draft" && (
                      <button className="text-primary" onClick={() => publish(v.id)}>
                        Publikuj
                      </button>
                    )}
                  </div>
                </div>
                {editing === v.id && (
                  <div className="mt-2 space-y-2">
                    <Textarea rows={10} className="font-mono text-xs" value={draftText} onChange={(e) => setDraftText(e.target.value)} />
                    <Button size="sm" loading={busy} onClick={() => saveDraft(v)}>
                      Zapisz jako nowy draft
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
