import { NextResponse } from "next/server";
import { requireApiUser, handleApiError } from "@/lib/api/helpers";
import { WORKSPACE_ID } from "@/lib/auth/session";

const REASON_LABELS: Record<string, string> = {
  produkt_sie_nie_zgadza: "produkt się nie zgadza",
  wyglada_jak_ai: "wygląda jak AI",
  scena: "scena",
  osoba: "osoba",
  ubranie: "ubranie",
  kadr: "kadr",
  kolorystyka: "kolorystyka",
  inny: "inny powód",
};

/**
 * Prosta, przejrzysta heurystyka (sekcja 57) — NIE fine-tuning, NIE automatyczna
 * publikacja reguł. Tylko sugestia, którą uprawniony użytkownik może zastosować
 * lub odrzucić.
 */
export async function POST() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;

  const since = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();

  const { data: feedbackRows, error } = await supabase
    .from("feedback")
    .select("sentiment, reasons, created_at")
    .gte("created_at", since);
  if (error) return handleApiError(error);

  const counts: Record<string, number> = {};
  let disliked = 0;
  let liked = 0;
  for (const row of feedbackRows ?? []) {
    if (row.sentiment === "disliked") {
      disliked++;
      for (const r of row.reasons as string[]) counts[r] = (counts[r] ?? 0) + 1;
    } else {
      liked++;
    }
  }

  const suggestions: { title: string; body: string; evidence: Record<string, unknown> }[] = [];

  for (const [reason, count] of Object.entries(counts)) {
    if (count >= 3) {
      const label = REASON_LABELS[reason] ?? reason;
      suggestions.push({
        title: `Powtarzający się problem: ${label}`,
        body: `W ostatnich 60 dniach ${count} razy odrzucono wynik z powodu "${label}" (na ${disliked} odrzuceń, ${liked} akceptacji). Rozważ korektę odpowiedniego Rule Packa lub modułu scenariusza.`,
        evidence: { reason, count, disliked, liked, windowDays: 60 },
      });
    }
  }

  if (suggestions.length === 0) {
    return NextResponse.json({ created: 0, message: "Brak wystarczających danych do sensownej sugestii." });
  }

  const { error: insertErr } = await supabase.from("system_suggestions").insert(
    suggestions.map((s) => ({
      workspace_id: WORKSPACE_ID,
      title: s.title,
      body: s.body,
      kind: "rule_pack",
      evidence: s.evidence as never,
      status: "proposed" as const,
    })),
  );
  if (insertErr) return handleApiError(insertErr);

  return NextResponse.json({ created: suggestions.length });
}
