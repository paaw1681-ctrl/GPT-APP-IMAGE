import type { SupabaseClient } from "@supabase/supabase-js";
import { WORKSPACE_ID } from "@/lib/auth/session";
import type { Database } from "@/lib/db/types";
import type { RulePackData } from "@/lib/prompt/build";

type Client = SupabaseClient<Database>;

/** Ładuje opublikowany Rule Pack dla kategorii produktu (sekcja 16). */
export async function loadRulePack(supabase: Client, productTypeId: string): Promise<RulePackData> {
  const { data, error } = await supabase
    .from("product_rule_packs")
    .select("rules")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("product_type_id", productTypeId)
    .eq("status", "published")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return {
      typical_usage: "brak skonfigurowanego rule packa — użyj ogólnych zasad zgodności produktu",
      relevant_subjects: [],
      critical_product_features: [],
      forbidden_transformations: [],
      forbidden_usage: [],
    };
  }
  return data.rules as RulePackData;
}
