import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAiClient } from "@/lib/ai/providers/openai/client";
import { qualityReviewSchema, type CriticProvider, type QualityGateInput } from "@/lib/ai/types";

/**
 * Prawdziwy Quality Gate — vision review porównujący prawdziwe referencje
 * produktu z wygenerowanym finałem. Zwraca structured JSON ocen (sekcja 35).
 */
export class OpenAiCriticProvider implements CriticProvider {
  constructor(private model: string) {}

  async reviewQuality(input: QualityGateInput) {
    const client = getOpenAiClient();
    const response = await client.responses.parse({
      model: this.model,
      input: [
        {
          role: "system",
          content:
            "Jesteś rygorystycznym kontrolerem jakości zdjęć produktowych. Porównujesz PRAWDZIWE zdjęcia referencyjne produktu z wygenerowanym finałem. Priorytet: zgodność produktu (kolory, liczba i kolejność elementów, litery/grawer, zapięcie, proporcje) jest ważniejsza niż estetyka. Bądź konkretny i surowy — nie zawyżaj ocen.",
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Referencje prawdziwego produktu (ground truth):" },
            ...input.references.map((r) => ({
              type: "input_image" as const,
              image_url: `data:${r.mimeType};base64,${r.base64}`,
              detail: "high" as const,
            })),
            {
              type: "input_text",
              text: `Profil produktu (Product Lock): ${JSON.stringify(input.productProfile)}\n\nWygenerowany finał do oceny:`,
            },
            { type: "input_image", image_url: `data:image/png;base64,${input.finalImageBase64}`, detail: "high" },
          ],
        },
      ],
      text: { format: zodTextFormat(qualityReviewSchema, "quality_review") },
    });
    if (!response.output_parsed) throw new Error("Model nie zwrócił poprawnej oceny jakości.");
    return {
      result: response.output_parsed,
      usage: { inputTokens: response.usage?.input_tokens, outputTokens: response.usage?.output_tokens },
    };
  }
}
