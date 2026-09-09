import sharp from "sharp";
import type { ImageGenerationInput, ImageGenerationResult, ImageProvider } from "@/lib/ai/types";

const ASPECT_TO_SIZE: Record<string, [number, number]> = {
  "1:1": [1024, 1024],
  "4:5": [1024, 1280],
  "3:4": [1024, 1365],
  "9:16": [1024, 1820],
  poziomy: [1365, 1024],
};

function sizeFor(aspectRatio: string): [number, number] {
  return ASPECT_TO_SIZE[aspectRatio] ?? ASPECT_TO_SIZE["1:1"];
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]!));
}

/**
 * Mock generator obrazu — renderuje placeholder PNG (SVG -> raster przez sharp),
 * żeby cały flow galerii/pobierania działał bez klucza OpenAI. Kolor i etykieta
 * zależą od promptu, więc kolejne generacje w danej sesji wizualnie się różnią.
 */
export class MockImageProvider implements ImageProvider {
  async generate(input: ImageGenerationInput, modelId: string): Promise<ImageGenerationResult> {
    const [w, h] = sizeFor(input.aspectRatio);
    let hash = 0;
    for (const ch of input.prompt) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0;
    const hue = hash % 360;
    const bg = `hsl(${hue}, 35%, 88%)`;
    const fg = `hsl(${hue}, 45%, 32%)`;
    const label = modelId.includes("flare") || modelId === "mock-image-proto" ? "PROTOTYP (MOCK)" : "FINAL (MOCK)";
    const promptPreview = escapeXml(input.prompt.slice(0, 140));

    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bg}" />
        <rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="${fg}" stroke-width="3" stroke-dasharray="10 8" rx="16" />
        <text x="50%" y="42%" font-family="sans-serif" font-size="${Math.round(w / 16)}" fill="${fg}" text-anchor="middle" font-weight="bold">OAK &amp; OATS</text>
        <text x="50%" y="52%" font-family="sans-serif" font-size="${Math.round(w / 26)}" fill="${fg}" text-anchor="middle">${label}</text>
        <foreignObject x="8%" y="60%" width="84%" height="30%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: sans-serif; font-size: ${Math.round(w / 42)}px; color: ${fg}; text-align:center; opacity:0.75;">
            ${promptPreview}…
          </div>
        </foreignObject>
      </svg>
    `;

    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    return {
      base64: buffer.toString("base64"),
      format: "png",
      usage: { imagesGenerated: 1, imageOutputTokens: 0 },
    };
  }
}
