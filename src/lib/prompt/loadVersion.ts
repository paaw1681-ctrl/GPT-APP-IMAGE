import type { SupabaseClient } from "@supabase/supabase-js";
import { WORKSPACE_ID } from "@/lib/auth/session";
import type { Database } from "@/lib/db/types";
import type { PromptModuleRow } from "@/lib/prompt/build";

type Client = SupabaseClient<Database>;

export interface LoadedPromptVersion {
  id: string;
  name: string;
  modules: PromptModuleRow[];
}

/** Ładuje opublikowaną wersję promptu (albo konkretną po id) wraz z modułami A..J. */
export async function loadPublishedPromptVersion(
  supabase: Client,
  versionId?: string,
): Promise<LoadedPromptVersion> {
  const query = supabase
    .from("prompt_versions")
    .select("id, name, module_versions")
    .eq("workspace_id", WORKSPACE_ID);

  const { data: version, error } = versionId
    ? await query.eq("id", versionId).single()
    : await query.eq("status", "published").order("published_at", { ascending: false }).limit(1).single();

  if (error || !version) {
    throw new Error("Nie znaleziono opublikowanej wersji promptu. Skonfiguruj ją w panelu admina.");
  }

  const moduleVersions = version.module_versions as Record<string, number>;
  const keys = Object.keys(moduleVersions);

  const { data: modules, error: modErr } = await supabase
    .from("prompt_modules")
    .select("module_key, version, content")
    .eq("workspace_id", WORKSPACE_ID)
    .in("module_key", keys);

  if (modErr || !modules) {
    throw new Error("Nie udało się wczytać modułów promptu.");
  }

  const filtered = modules.filter((m) => m.version === moduleVersions[m.module_key]);

  return { id: version.id, name: version.name, modules: filtered };
}
