"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ModuleRow {
  id: string;
  module_key: string;
  version: number;
  title: string;
  content: string;
  status: string;
}

interface VersionRow {
  id: string;
  name: string;
  status: string;
  module_versions: Record<string, number>;
  created_at: string;
}

export default function PromptAdminPage() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [m, v] = await Promise.all([
      apiFetch<{ modules: ModuleRow[] }>("/api/admin/prompt-modules"),
      apiFetch<{ versions: VersionRow[] }>("/api/admin/prompt-versions"),
    ]);
    setModules(m.modules);
    setVersions(v.versions);
  }

  useEffect(() => {
    // Pobranie danych po zamontowaniu — funkcja load() jest też wywoływana ręcznie po akcjach (zapis/publikacja).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function publish(id: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/prompt-versions/${id}/publish`, { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const byKey = modules.reduce<Record<string, ModuleRow[]>>((acc, m) => {
    (acc[m.module_key] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-semibold">Prompt Engine — moduły i wersje</h1>

      <Card>
        <p className="mb-2 text-sm font-medium">Wersje promptu</p>
        <div className="space-y-2">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
              <span>
                {v.name} <Badge tone={v.status === "published" ? "success" : "neutral"}>{v.status}</Badge>
              </span>
              {v.status === "draft" && (
                <Button size="sm" loading={busy} onClick={() => publish(v.id)}>
                  Publikuj
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="mb-2 text-sm font-medium">Moduły A–J (najnowsze wersje)</p>
        <div className="space-y-3">
          {Object.entries(byKey)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, list]) => {
              const latest = list.sort((a, b) => b.version - a.version)[0];
              return (
                <div key={key} className="rounded-lg border border-border p-2 text-sm">
                  <p className="font-medium">
                    {key}. {latest.title} <span className="text-muted">v{latest.version}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{latest.content.slice(0, 220)}…</p>
                </div>
              );
            })}
        </div>
      </Card>
    </div>
  );
}
