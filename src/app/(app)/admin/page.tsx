import Link from "next/link";
import { Card } from "@/components/ui/Card";

const LINKS = [
  { href: "/admin/modele", label: "Katalog modeli i cen", desc: "Ceny, aktywność, źródła" },
  { href: "/admin/rule-packs", label: "Rule Packs", desc: "Reguły kategorii produktów" },
  { href: "/admin/prompt", label: "Prompt Engine", desc: "Moduły A–J i wersje" },
  { href: "/admin/trend-radar", label: "Trend Radar", desc: "Cotygodniowy przegląd trendów" },
  { href: "/admin/test-lab", label: "Test Lab", desc: "Porównania A/B" },
  { href: "/admin/sugestie", label: "Sugestie systemu", desc: "Wnioski z feedbacku" },
  { href: "/admin/metryki", label: "Metryki", desc: "Koszt per zaakceptowany final" },
];

export default function AdminHome() {
  return (
    <div className="mx-auto max-w-md space-y-3 px-4 py-6">
      <h1 className="text-xl font-semibold">Panel administracyjny</h1>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href}>
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{l.label}</p>
              <p className="text-xs text-muted">{l.desc}</p>
            </div>
            <span className="text-muted">→</span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
