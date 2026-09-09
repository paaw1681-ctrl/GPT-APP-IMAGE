import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

type Client = SupabaseClient<Database>;
type JobRow = Database["public"]["Tables"]["generation_jobs"]["Row"];
type JobInsert = Database["public"]["Tables"]["generation_jobs"]["Insert"];

/**
 * Ochrona przed podwójnym rachunkiem (sekcja 46): próbujemy założyć job z
 * unikalnym (workspace_id, idempotency_key). Jeśli wiersz już istnieje
 * (podwójne tapnięcie, retry po timeoucie sieci), zwracamy ISTNIEJĄCY job
 * zamiast tworzyć nowy płatny request.
 */
export async function createIdempotentJob(
  supabase: Client,
  insert: JobInsert,
): Promise<{ job: JobRow; alreadyExisted: boolean }> {
  const { data, error } = await supabase.from("generation_jobs").insert(insert).select("*").single();

  if (!error && data) {
    return { job: data, alreadyExisted: false };
  }

  const isUniqueViolation = (error as { code?: string } | null)?.code === "23505";
  if (isUniqueViolation) {
    const { data: existing, error: fetchErr } = await supabase
      .from("generation_jobs")
      .select("*")
      .eq("workspace_id", insert.workspace_id)
      .eq("idempotency_key", insert.idempotency_key)
      .single();
    if (fetchErr || !existing) throw error;
    return { job: existing, alreadyExisted: true };
  }

  throw error;
}
