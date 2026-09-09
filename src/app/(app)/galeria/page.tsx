import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WORKSPACE_ID } from "@/lib/auth/session";
import { BUCKET } from "@/lib/storage/paths";
import { Card } from "@/components/ui/Card";

export default async function GalleryIndexPage() {
  const supabase = await createSupabaseServerClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, product_references(storage_path_preview, role)")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  const withUrls = await Promise.all(
    (products ?? []).map(async (p) => {
      const refs = p.product_references as { storage_path_preview: string; role: string }[];
      const path = refs.find((r) => r.role === "master")?.storage_path_preview ?? refs[0]?.storage_path_preview;
      const url = path ? (await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)).data?.signedUrl : null;
      return { ...p, url: url ?? null };
    }),
  );

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
      <h1 className="text-xl font-semibold">Galeria</h1>
      {withUrls.length === 0 ? (
        <Card className="text-center text-sm text-muted">Brak produktów z galerią.</Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {withUrls.map((p) => (
            <Link key={p.id} href={`/produkty/${p.id}/galeria`} className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="aspect-square bg-background">
                {p.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                )}
              </div>
              <p className="truncate px-2 py-1.5 text-sm">{p.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
