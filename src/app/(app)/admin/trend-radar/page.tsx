"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Source {
  title: string;
  url: string | null;
  confidence: string;
}
interface Point {
  summary_pl: string;
  relevance: string;
  confidence: string;
  sources: Source[];
}
interface Brief {
  id: string;
  week_of: string;
  summary_points: Point[];
  created_at: string;
}

export default function TrendRadarPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [running, setRunning] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await apiFetch<{ briefs: Brief[] }>("/api/admin/trend-radar");
    setBriefs(res.briefs);
  }

  useEffect(() => {
    // Pobranie danych po zamontowaniu — funkcja load() jest też wywoływana ręcznie po akcjach (zapis/publikacja).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      await apiFetch("/api/admin/trend-radar/run", { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się uruchomić przeglądu trendów.");
    } finally {
      setRunning(false);
    }
  }

  const latest = briefs[0];

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trend Radar</h1>
        <Button size="sm" loading={running} onClick={run}>
          Uruchom teraz
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}

      {latest ? (
        <Card>
          <p className="mb-2 text-sm font-medium">Trendy w tygodniu {latest.week_of}</p>
          <ol className="space-y-2 text-sm">
            {latest.summary_points.map((p, i) => (
              <li key={i}>
                <span className="font-medium">{i + 1}. </span>
                {p.summary_pl} <Badge>{p.confidence}</Badge>
              </li>
            ))}
          </ol>
          <button className="mt-2 text-sm text-primary" onClick={() => setShowSources((v) => !v)}>
            Zobacz źródła
          </button>
          {showSources && (
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {latest.summary_points.flatMap((p) => p.sources).map((s, i) => (
                <li key={i}>{s.title}{s.url ? ` — ${s.url}` : ""}</li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <Card className="text-center text-sm text-muted">Brak jeszcze żadnego przeglądu. Uruchom pierwszy.</Card>
      )}
    </div>
  );
}
