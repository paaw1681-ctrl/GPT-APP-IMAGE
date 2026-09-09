import "server-only";
import sharp from "sharp";

const MAX_DIMENSION = 3600;
const PREVIEW_DIMENSION = 800;

export interface ProcessedReference {
  workingBuffer: Buffer;
  previewBuffer: Buffer;
  originalBuffer: Buffer;
  width: number;
  height: number;
  mimeType: "image/jpeg";
}

const HEIC_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);

function isHeic(mimeType: string, filename?: string): boolean {
  if (HEIC_TYPES.has(mimeType.toLowerCase())) return true;
  const ext = filename?.toLowerCase().split(".").pop();
  return ext === "heic" || ext === "heif";
}

/**
 * Pipeline referencji produktu (sekcja 7): naprawia orientację EXIF, konwertuje
 * HEIC/HEIF z iPhone'a, normalizuje do sRGB, usuwa prywatne EXIF/GPS (nigdy nie
 * dołączamy .withMetadata() — sharp domyślnie nie przepisuje metadanych do
 * wyjścia), i zwraca trzy warstwy: pełnowymiarową kopię roboczą (do analizy i
 * generacji), lekki podgląd (UI) oraz kopię "original" (ta sama jakość
 * pikseli — zachowana dla audytu, ale też pozbawiona lokalizacji z tego
 * samego powodu prywatności).
 */
export async function processReferenceImage(
  input: Buffer,
  mimeType: string,
  filename?: string,
): Promise<ProcessedReference> {
  let source: Buffer | Uint8Array = input;

  if (isHeic(mimeType, filename)) {
    const heicConvert = (await import("heic-convert")).default;
    const converted = await heicConvert({ buffer: input, format: "JPEG", quality: 0.95 });
    source = Buffer.from(converted);
  }

  const base = sharp(source, { failOn: "none" }).rotate();
  const meta = await base.clone().metadata();

  const originalBuffer = await base
    .clone()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .toColorspace("srgb")
    .jpeg({ quality: 96, mozjpeg: true })
    .toBuffer();

  const workingBuffer = originalBuffer;

  const previewBuffer = await base
    .clone()
    .resize({ width: PREVIEW_DIMENSION, height: PREVIEW_DIMENSION, fit: "inside", withoutEnlargement: true })
    .toColorspace("srgb")
    .jpeg({ quality: 78 })
    .toBuffer();

  return {
    workingBuffer,
    previewBuffer,
    originalBuffer,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    mimeType: "image/jpeg",
  };
}

export const SUPPORTED_REFERENCE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
