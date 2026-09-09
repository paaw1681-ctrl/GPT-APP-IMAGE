import { describe, it, expect } from "vitest";
import { buildPrompt, type PromptModuleRow } from "@/lib/prompt/build";

const modules: PromptModuleRow[] = [
  { module_key: "A", version: 1, content: "HARD LOCK." },
  { module_key: "B", version: 1, content: "RULE PACK: {{RULE_PACK}}" },
  { module_key: "C", version: 1, content: "PHOTO TYPE: {{PHOTO_TYPE_RULES}}" },
  { module_key: "D", version: 1, content: "AUDIENCE: {{AUDIENCE_CONTEXT}}" },
  { module_key: "E", version: 1, content: "REALISM." },
  { module_key: "F", version: 1, content: "SCENARIO: {{SCENARIO}}" },
  { module_key: "G", version: 1, content: "ANTI-REP: {{ANTI_REPETITION}}" },
  { module_key: "H", version: 1, content: "PURPOSE: {{PURPOSE_ASPECT}}" },
  { module_key: "I", version: 1, content: "NOTE: {{USER_NOTE}}" },
  { module_key: "J", version: 1, content: "VALIDATE." },
];

const baseInput = {
  modules,
  productLockSummary: '{"nazwa":"Gryzak Test"}',
  rulePack: {
    typical_usage: "gryzienie przez niemowlę",
    forbidden_transformations: ["nie zmieniaj liczby elementów"],
  },
  photoType: "lifestyle",
  photoTypeLabel: "Lifestyle",
  purpose: "instagram",
  aspectRatio: "4:5",
  audienceLabel: "Dziecko",
  featuredSubjectLabel: "Auto",
  scenario: null,
  ideaText: "Kobieta w kawiarni.",
  antiRepetitionNotes: [] as string[],
  mode: "prototype" as const,
};

describe("buildPrompt", () => {
  it("składa moduły w stałej kolejności A..J", () => {
    const result = buildPrompt(baseInput);
    const posA = result.text.indexOf("HARD LOCK");
    const posB = result.text.indexOf("RULE PACK");
    const posJ = result.text.indexOf("VALIDATE");
    expect(posA).toBeGreaterThanOrEqual(0);
    expect(posB).toBeGreaterThan(posA);
    expect(posJ).toBeGreaterThan(posB);
  });

  it("podstawia Rule Pack do modułu B", () => {
    const result = buildPrompt(baseInput);
    expect(result.text).toContain("gryzienie przez niemowlę");
    expect(result.text).toContain("nie zmieniaj liczby elementów");
  });

  it("zawiera Product Lock w module A", () => {
    const result = buildPrompt(baseInput);
    expect(result.text).toContain("Gryzak Test");
  });

  it("rozróżnia tryb prototyp i final", () => {
    const prototype = buildPrompt(baseInput);
    const final = buildPrompt({ ...baseInput, mode: "final" });
    expect(prototype.text).toContain("TRYB: PROTOTYP");
    expect(final.text).toContain("TRYB: FINAL");
    expect(final.text).not.toContain("TRYB: PROTOTYP");
  });

  it("gdy brak wcześniejszych sesji, moduł anti-repetition to o tym informuje", () => {
    const result = buildPrompt(baseInput);
    expect(result.text).toContain("Brak wcześniejszych sesji");
  });

  it("gdy są wcześniejsze sceny, wymienia je jako zakazane powtórzenia", () => {
    const result = buildPrompt({ ...baseInput, antiRepetitionNotes: ["kobieta, kawiarnia"] });
    expect(result.text).toContain("kobieta, kawiarnia");
  });

  it("zwraca moduleSnapshot z wersjami wszystkich modułów", () => {
    const result = buildPrompt(baseInput);
    expect(Object.keys(result.moduleSnapshot)).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]);
    expect(result.moduleSnapshot.A.version).toBe(1);
  });

  it("rzuca czytelny błąd, gdy brakuje modułu w wybranej wersji", () => {
    const incomplete = modules.filter((m) => m.module_key !== "F");
    expect(() => buildPrompt({ ...baseInput, modules: incomplete })).toThrow(/moduł.*F/i);
  });
});
