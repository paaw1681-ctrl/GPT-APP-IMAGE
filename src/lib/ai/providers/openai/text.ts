import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAiClient } from "@/lib/ai/providers/openai/client";
import {
  conceptSchema,
  contentResultSchema,
  productProfileSchema,
  trendBriefSchema,
  type ConceptInput,
  type ContentInput,
  type ProductAnalysisInput,
  type ProviderUsage,
  type TextVisionProvider,
} from "@/lib/ai/types";

function usageFrom(response: { usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } } | null }): ProviderUsage {
  return {
    inputTokens: response.usage?.input_tokens,
    cachedInputTokens: response.usage?.input_tokens_details?.cached_tokens,
    outputTokens: response.usage?.output_tokens,
  };
}

/**
 * Prawdziwy provider tekstowo-wizyjny oparty o OpenAI Responses API ze
 * Structured Outputs (text.format = zodTextFormat). Modele przekazywane są
 * z zewnątrz (Model Router czyta je z model_catalog/routing_policies) —
 * żaden model ID nie jest tu zaszyty na stałe.
 */
export class OpenAiTextVisionProvider implements TextVisionProvider {
  constructor(
    private models: {
      productAnalysis: string;
      scenario: string;
      content: string;
      trendResearch: string;
    },
  ) {}

  async analyzeProduct(input: ProductAnalysisInput) {
    const client = getOpenAiClient();
    const typeList = input.productTypeOptions.map((o) => `${o.key} (${o.label})`).join(", ");
    const audienceList = input.audienceOptions.map((o) => `${o.key} (${o.label})`).join(", ");
    const response = await client.responses.parse({
      model: this.models.productAnalysis,
      input: [
        {
          role: "system",
          content:
            "Jesteś analitykiem produktowym polskiej manufaktury Oak & Oats. Analizujesz WYŁĄCZNIE to, co faktycznie widać na zdjęciach referencyjnych produktu. Nigdy nie zgaduj niewidocznych szczegółów — oznacz je jako niepewne (uncertain_fields). Nie wymyślaj danych.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Dostępne kategorie produktu: ${typeList}.\nDostępne konteksty odbiorcy: ${audienceList}.\nPrzeanalizuj załączone zdjęcia referencyjne i zwróć strukturalny profil produktu (Product Lock).`,
            },
            ...input.references.map((r) => ({
              type: "input_image" as const,
              image_url: `data:${r.mimeType};base64,${r.base64}`,
              detail: "high" as const,
            })),
          ],
        },
      ],
      text: { format: zodTextFormat(productProfileSchema, "product_profile") },
    });
    if (!response.output_parsed) throw new Error("Model nie zwrócił poprawnej strukturalnej odpowiedzi.");
    return { result: response.output_parsed, usage: usageFrom(response) };
  }

  async proposeConcept(input: ConceptInput) {
    const client = getOpenAiClient();
    const response = await client.responses.parse({
      model: this.models.scenario,
      input: [
        {
          role: "system",
          content:
            "Jesteś reżyserem fotografii produktowej marki Oak & Oats. Proponujesz JEDEN konkretny, wiarygodny pomysł na zdjęcie — fragment prawdziwego życia, nie reklamę AI. Unikasz sztampowej, jednej stałej palety (beż/len/suszone kwiaty) chyba że naprawdę pasuje. Unikasz powtarzania ostatnich scen.",
        },
        {
          role: "user",
          content: JSON.stringify({
            product: input.productSummary,
            rule_pack: input.rulePack,
            photo_type: input.photoType,
            purpose: input.purpose,
            featured_subject: input.featuredSubject,
            audience: input.audienceLabel,
            recent_scenarios_to_avoid_repeating: input.recentScenarios,
            trend_points: input.trendPoints,
            user_note: input.userNote ?? null,
            creative_mode: input.creative,
          }),
        },
      ],
      text: { format: zodTextFormat(conceptSchema, "concept") },
    });
    if (!response.output_parsed) throw new Error("Model nie zwrócił poprawnej koncepcji.");
    return { result: response.output_parsed, usage: usageFrom(response) };
  }

  async generateContent(input: ContentInput) {
    const client = getOpenAiClient();
    const response = await client.responses.parse({
      model: this.models.content,
      input: [
        {
          role: "system",
          content: `Piszesz copy dla marki Oak & Oats w jej głosie: ${input.brandVoice}. Używasz WYŁĄCZNIE podanych zweryfikowanych faktów — niczego nie dopowiadasz (certyfikaty, bezpieczeństwo, właściwości).`,
        },
        {
          role: "user",
          content: JSON.stringify({
            channel: input.channel,
            product: input.productSummary,
            photo_type: input.photoType,
            verified_facts: input.verifiedFacts,
          }),
        },
      ],
      text: { format: zodTextFormat(contentResultSchema, "content") },
    });
    if (!response.output_parsed) throw new Error("Model nie zwrócił poprawnego copy.");
    return { result: response.output_parsed, usage: usageFrom(response) };
  }

  async researchTrends(workspaceContext: string) {
    const client = getOpenAiClient();
    const response = await client.responses.parse({
      model: this.models.trendResearch,
      tools: [{ type: "web_search" }],
      input: [
        {
          role: "system",
          content:
            "Robisz cotygodniowy przegląd trendów w fotografii produktowej/lifestyle/social dla marki dziecięcej. Szukaj aktualnych, wiarygodnych publicznych źródeł. Nie kopiuj konkretnych kampanii konkurencji 1:1 — wyciągaj ogólne wnioski o stylu, świetle, kompozycji.",
        },
        { role: "user", content: workspaceContext },
      ],
      text: { format: zodTextFormat(trendBriefSchema, "trend_brief") },
    });
    if (!response.output_parsed) throw new Error("Model nie zwrócił poprawnego briefu trendów.");
    return {
      result: response.output_parsed,
      usage: {
        ...usageFrom(response),
        webSearchCalls: response.output.filter((o) => o.type === "web_search_call").length,
      },
    };
  }
}
