import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BUCKET } from "@/lib/storage/paths";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductLockDetails } from "@/components/ProductLockDetails";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "*, product_types(label_pl), audience_contexts(label_pl), product_references(*), product_profiles(*)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  const references = (product.product_references as { id: string; storage_path_preview: string; role: string }[]) ?? [];
  const referencesWithUrls = await Promise.all(
    references.map(async (r) => ({
      ...r,
      url: (await supabase.storage.from(BUCKET).createSignedUrl(r.storage_path_preview, 3600)).data?.signedUrl ?? null,
    })),
  );

  const profiles = (product.product_profiles as { status: string; version: number }[]) ?? [];
  const confirmedProfile = profiles
    .filter((p) => p.status === "confirmed")
    .sort((a, b) => b.version - a.version)[0] as Record<string, unknown> | undefined;

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, created_at, status")
    .eq("product_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">{product.name}</h1>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {(product.product_types as { label_pl: string } | null)?.label_pl && (
            <Badge tone="primary">{(product.product_types as { label_pl: string }).label_pl}</Badge>
          )}
          {(product.audience_contexts as { label_pl: string } | null)?.label_pl && (
            <Badge>{(product.audience_contexts as { label_pl: string }).label_pl}</Badge>
          )}
          {product.variant_name && <Badge>{product.variant_name}</Badge>}
        </div>
      </div>

      {product.status !== "active" ? (
        <Card className="text-sm text-warning">
          Produkt nie ma jeszcze potwierdzonego Product Locka. Dokończ dodawanie produktu.
          <Link href="/produkty/nowy" className="mt-2 block">
            <Button size="sm" className="w-full">Dokończ konfigurację</Button>
          </Link>
        </Card>
      ) : (
        <Link href={`/produkty/${id}/generuj`}>
          <Button size="lg" className="w-full">
            Generuj zdjęcie
          </Button>
        </Link>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Referencje</h2>
        <div className="grid grid-cols-3 gap-2">
          {referencesWithUrls.map((r) => (
            <div key={r.id} className="relative aspect-square overflow-hidden rounded-xl border border-border">
              {r.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.url} alt="" className="h-full w-full object-cover" />
              )}
              {r.role === "master" && (
                <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  MASTER
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {confirmedProfile && <ProductLockDetails profile={confirmedProfile} />}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">Galeria</h2>
          <Link href={`/produkty/${id}/galeria`} className="text-sm text-primary">
            Zobacz wszystko
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">Sesje</h2>
        {(sessions ?? []).length === 0 ? (
          <p className="text-sm text-muted">Brak sesji.</p>
        ) : (
          <div className="space-y-2">
            {(sessions ?? []).map((s) => (
              <Link key={s.id} href={`/produkty/${id}/generuj?sesja=${s.id}`}>
                <Card className="flex items-center justify-between py-3 text-sm">
                  <span>{new Date(s.created_at).toLocaleString("pl-PL")}</span>
                  <Badge>{s.status === "active" ? "aktywna" : "zamknięta"}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
