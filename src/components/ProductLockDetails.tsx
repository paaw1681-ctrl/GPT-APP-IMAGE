"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";

/** Skrócone podsumowanie Product Locka — domyślnie zwinięte (sekcja 74). */
export function ProductLockDetails({ profile }: { profile: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);

  const materials = Array.isArray(profile.materials) ? (profile.materials as string[]).join(", ") : "";
  const colors = Array.isArray(profile.main_colors) ? (profile.main_colors as string[]).join(", ") : "";

  return (
    <Card>
      <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen((v) => !v)}>
        <span className="text-sm font-medium">Product Lock</span>
        <span className="text-sm text-muted">{open ? "Zwiń" : "Pokaż szczegóły"}</span>
      </button>
      {open && (
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Materiały" value={materials} />
          <Row label="Kolory" value={colors} />
          <Row label="Liczba elementów" value={String(profile.element_count ?? "—")} />
          {typeof profile.letters === "string" && profile.letters && <Row label="Litery" value={profile.letters as string} />}
          {typeof profile.engraving === "string" && profile.engraving && <Row label="Grawer" value={profile.engraving as string} />}
        </dl>
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value || "—"}</dd>
    </div>
  );
}
