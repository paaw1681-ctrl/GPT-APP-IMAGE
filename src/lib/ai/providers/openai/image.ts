import { toFile } from "openai";
import { getOpenAiClient } from "@/lib/ai/providers/openai/client";
import type { ImageGenerationInput, ImageGenerationResult, ImageProvider } from "@/lib/ai/types";

const ASPECT_TO_SIZE: Record<string, string> = {
  "1:1": "1024x1024",
  "4:5": "832x1040",
  "3:4": "896x1200",
  "9:16": "768x1344",
  poziomy: "1536x1024",
  auto: "auto",
};

/**
 * Prawdziwy provider obrazu (OpenAI Images API — rodzina GPT Image).
 * Zawsze używa images.edit z referencjami produktu jako obrazami wejściowymi
 * (input_fidelity: "high"), bo prawdziwe zdjęcie produktu ma pierwszeństwo
 * przed samym opisem tekstowym — to realizuje priorytet #1 (Product Fidelity).
 */
export class OpenAiImageProvider implements ImageProvider {
  async generate(input: ImageGenerationInput, modelId: string): Promise<ImageGenerationResult> {
    const client = getOpenAiClient();
    const size = ASPECT_TO_SIZE[input.aspectRatio] ?? "auto";

    if (input.references.length === 0) {
      const response = await client.images.generate({
        model: modelId,
        prompt: input.prompt,
        size: size as never,
        quality: input.quality,
        output_format: "png",
      });
      const first = response.data?.[0];
      if (!first?.b64_json) throw new Error("Brak wygenerowanego obrazu w odpowiedzi API.");
      return {
        base64: first.b64_json,
        format: "png",
        usage: {
          inputTokens: response.usage?.input_tokens,
          outputTokens: response.usage?.output_tokens,
          imagesGenerated: 1,
        },
      };
    }

    const files = await Promise.all(
      input.references.map((r, i) =>
        toFile(Buffer.from(r.base64, "base64"), `ref-${i}.${r.mimeType.split("/")[1] ?? "jpg"}`, {
          type: r.mimeType,
        }),
      ),
    );

    const response = await client.images.edit({
      model: modelId,
      image: files,
      prompt: input.prompt,
      size: size as never,
      quality: input.quality,
      input_fidelity: "high",
      output_format: "png",
    });
    const first = response.data?.[0];
    if (!first?.b64_json) throw new Error("Brak wygenerowanego obrazu w odpowiedzi API.");
    return {
      base64: first.b64_json,
      format: "png",
      usage: {
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        imageInputTokens: response.usage?.input_tokens_details?.image_tokens,
        imagesGenerated: 1,
      },
    };
  }
}
