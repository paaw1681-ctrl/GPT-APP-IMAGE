import { NextResponse } from "next/server";
import { requireApiUser, handleApiError } from "@/lib/api/helpers";
import { getTextVisionProvider } from "@/lib/ai/router";
import { recordCost } from "@/lib/cost/ledger";
import { assertBudgetAllows } from "@/lib/cost/budget";
import { WORKSPACE_ID } from "@/lib/auth/session";

export const maxDuration = 120;

/**
 * Ręczne (lub cotygodniowe cron) uruchomienie Trend Radaru (sekcja 55-56).
 * Nie odbywa się to przy każdej generacji — tylko na żądanie / harmonogram.
 */
export async function POST() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  try {
    await assertBudgetAllows(supabase);

    const { provider, models } = await getTextVisionProvider(supabase);
    const { result, usage } = await provider.researchTrends(
      "Marka Oak & Oats: polska manufaktura akcesoriów dla niemowląt (gryzaki drewniano-silikonowe, zawieszki do smoczka, biżuteria sensoryczna dla mam). Zbadaj aktualne trendy w fotografii produktowej, lifestyle, e-commerce visuals i social creative istotne dla tej kategorii.",
    );

    await recordCost(supabase, {
      jobId: null,
      model: models.trendResearch,
      usage,
      userId: user.id,
      category: "web_search",
    });

    const weekOf = new Date();
    weekOf.setUTCDate(weekOf.getUTCDate() - weekOf.getUTCDay());

    const { data: brief, error } = await supabase
      .from("trend_briefs")
      .insert({
        workspace_id: WORKSPACE_ID,
        week_of: weekOf.toISOString().slice(0, 10),
        summary_points: result.points as never,
        status: "completed",
        model: models.trendResearch.modelId,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) return handleApiError(error);

    const sourceRows = result.points.flatMap((p) =>
      p.sources.map((s) => ({
        trend_brief_id: brief.id,
        title: s.title,
        url: s.url,
        relevance: p.relevance,
        confidence: p.confidence,
        note: p.summary_pl,
      })),
    );
    if (sourceRows.length > 0) {
      await supabase.from("trend_sources").insert(sourceRows);
    }

    return NextResponse.json({ briefId: brief.id, points: result.points });
  } catch (err) {
    return handleApiError(err);
  }
}
