import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser, apiError, handleApiError } from "@/lib/api/helpers";

const createSchema = z.object({
  name: z.string().min(1).max(120).default("Nowy produkt"),
});

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, workspaceId } = auth;

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, status, product_type_id, product_type_label, updated_at, product_types(label_pl), product_references(id, storage_path_preview, role)",
    )
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return handleApiError(error);
  return NextResponse.json({ products: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user, workspaceId } = auth;

  const json = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return apiError(400, "Nieprawidłowe dane produktu.");

  const { data, error } = await supabase
    .from("products")
    .insert({
      workspace_id: workspaceId,
      name: parsed.data.name,
      status: "draft",
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) return handleApiError(error);
  return NextResponse.json({ product: data }, { status: 201 });
}
