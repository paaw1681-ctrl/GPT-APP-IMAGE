import type { CriticProvider, QualityGateInput, QualityReviewResult } from "@/lib/ai/types";

/**
 * Mock krytyk jakości — zwraca optymistyczny, ale nie idealny wynik, żeby UI
 * Quality Gate dało się przetestować (w tym ścieżkę "sprawdź szczegóły").
 */
export class MockCriticProvider implements CriticProvider {
  async reviewQuality(input: QualityGateInput) {
    const hasRefs = input.references.length > 0;
    const result: QualityReviewResult = {
      product_fidelity: hasRefs ? "high" : "medium",
      realism: "high",
      numerical_score: hasRefs ? 88 : 74,
      confidence: hasRefs ? "high" : "medium",
      issues_pl: hasRefs
        ? []
        : ["Brak referencji do porównania — ocena tylko na podstawie ogólnego realizmu."],
      checks: {
        colors_match: true,
        element_count_match: true,
        order_match: true,
        lettering_match: true,
        clasp_hardware_match: true,
        proportions_match: true,
        physical_realism: true,
        anatomy_ok: true,
        no_artifacts: true,
        lighting_realistic: true,
      },
    };
    return { result, usage: { inputTokens: 500, outputTokens: 150 } };
  }
}
