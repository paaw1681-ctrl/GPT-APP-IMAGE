import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

type Client = SupabaseClient<Database>;

interface ScenarioMeta {
  subject_type?: string;
  hair?: string;
  location_type?: string;
  palette?: string;
  lighting?: string;
  camera_language?: string;
}

/** Ostatnie sceny tego produktu — wejście do anti-repetition (sekcja 23). */
export async function getRecentScenarios(supabase: Client, productId: string, limit = 5) {
  const { data } = await supabase
    .from("generated_assets")
    .select("scenario_metadata, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((d) => d.scenario_metadata as ScenarioMeta);
}

export function scenariosToNotes(scenarios: ScenarioMeta[]): string[] {
  return scenarios
    .filter((s) => s && Object.keys(s).length > 0)
    .map((s) =>
      [s.subject_type, s.hair, s.location_type, s.palette, s.lighting].filter(Boolean).join(", "),
    )
    .filter(Boolean);
}
