import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";
import { processReferenceImage, SUPPORTED_REFERENCE_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/images/pipeline";
import { BUCKET, referencePath } from "@/lib/storage/paths";

export const runtime = "nodejs";
export const maxDuration = 60;

function guessMimeFromName(name: string): string | null {
  const ext = name.toLowerCase().split(".").pop();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      return null;
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const { id: productId } = await ctx.params;

  const { data: product } = await supabase.from("products").select("id").eq("id", productId).maybeSingle();
  if (!product) return apiError(404, "Nie znaleziono produktu.");

  const { count: existingCount } = await supabase
    .from("product_references")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const formData = await req.formData().catch(() => null);
  if (!formData) return apiError(400, "Nieprawidłowe dane formularza.");

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return apiError(400, "Nie przesłano żadnego zdjęcia.");

  const already = existingCount ?? 0;
  if (already + files.length > 5) {
    return apiError(400, `Można dodać maksymalnie 5 zdjęć na produkt (masz już ${already}).`);
  }

  const created: { id: string; previewUrl: string | null }[] = [];

  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return apiError(400, `Plik "${file.name}" jest za duży (limit 25 MB).`);
    }
    const mimeType = SUPPORTED_REFERENCE_MIME_TYPES.includes(file.type)
      ? file.type
      : guessMimeFromName(file.name);
    if (!mimeType) {
      return apiError(400, `Nieobsługiwany format pliku: "${file.name}". Dozwolone: JPEG, PNG, WebP, HEIC/HEIF.`);
    }

    const arrayBuffer = await file.arrayBuffer();
    const processed = await processReferenceImage(Buffer.from(arrayBuffer), mimeType, file.name);

    const { data: refRow, error: refError } = await supabase
      .from("product_references")
      .insert({
        product_id: productId,
        storage_path_original: "",
        storage_path_working: "",
        storage_path_preview: "",
        role: already === 0 && created.length === 0 ? "master" : "supporting",
        mime_type: "image/jpeg",
        width: processed.width,
        height: processed.height,
        exif_stripped: true,
        sort_order: already + created.length,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (refError || !refRow) return handleApiError(refError);

    const originalPath = referencePath(productId, refRow.id, "original");
    const workingPath = referencePath(productId, refRow.id, "working");
    const previewPath = referencePath(productId, refRow.id, "preview");

    const [up1, up2, up3] = await Promise.all([
      supabase.storage.from(BUCKET).upload(originalPath, processed.originalBuffer, { contentType: "image/jpeg", upsert: true }),
      supabase.storage.from(BUCKET).upload(workingPath, processed.workingBuffer, { contentType: "image/jpeg", upsert: true }),
      supabase.storage.from(BUCKET).upload(previewPath, processed.previewBuffer, { contentType: "image/jpeg", upsert: true }),
    ]);

    if (up1.error || up2.error || up3.error) {
      await supabase.from("product_references").delete().eq("id", refRow.id);
      return handleApiError(up1.error ?? up2.error ?? up3.error);
    }

    await supabase
      .from("product_references")
      .update({
        storage_path_original: originalPath,
        storage_path_working: workingPath,
        storage_path_preview: previewPath,
      })
      .eq("id", refRow.id);

    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(previewPath, 3600);
    created.push({ id: refRow.id, previewUrl: signed?.signedUrl ?? null });
  }

  await supabase.from("products").update({ updated_by: user.id, status: "draft" }).eq("id", productId);

  return NextResponse.json({ references: created }, { status: 201 });
}
