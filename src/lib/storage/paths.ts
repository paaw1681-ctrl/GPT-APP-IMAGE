export const BUCKET = "oakoats";

export function referencePath(productId: string, referenceId: string, kind: "original" | "working" | "preview") {
  return `products/${productId}/references/${referenceId}/${kind}.jpg`;
}

export function assetPath(productId: string, jobId: string, assetId: string, kind: "full" | "preview") {
  return `products/${productId}/assets/${jobId}/${assetId}-${kind}.png`;
}

export async function createSignedUrl(
  supabase: { storage: { from: (b: string) => { createSignedUrl: (p: string, e: number) => Promise<{ data: { signedUrl: string } | null; error: unknown }> } } },
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}
