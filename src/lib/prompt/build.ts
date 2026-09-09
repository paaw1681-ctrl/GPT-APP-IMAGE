import { photoTypeRulesText, purposeAspectRulesText } from "@/lib/prompt/photoTypes";
import type { ConceptResult } from "@/lib/ai/types";

export interface PromptModuleRow {
  module_key: string;
  version: number;
  content: string;
}

export interface RulePackData {
  typical_usage?: string;
  correct_attachment?: string;
  relevant_subjects?: string[];
  lifestyle_rules?: string;
  child_context_rules?: string;
  adult_context_rules?: string;
  critical_product_features?: string[];
  forbidden_transformations?: string[];
  forbidden_usage?: string[];
  prompt_additions?: string;
}

export interface BuildPromptInput {
  modules: PromptModuleRow[];
  productLockSummary: string;
  rulePack: RulePackData;
  photoType: string;
  photoTypeLabel: string;
  purpose: string;
  aspectRatio: string;
  audienceLabel: string;
  featuredSubjectLabel: string;
  scenario: ConceptResult["scenario"] | null;
  ideaText: string;
  antiRepetitionNotes: string[];
  userNote?: string;
  mode: "prototype" | "final";
}

export interface BuiltPrompt {
  text: string;
  moduleSnapshot: Record<string, { version: number; resolved: string }>;
}

function rulePackText(rp: RulePackData): string {
  const lines = [
    rp.typical_usage && `Typowe użycie: ${rp.typical_usage}.`,
    rp.correct_attachment && `Poprawne mocowanie/noszenie: ${rp.correct_attachment}.`,
    rp.relevant_subjects?.length && `Właściwi bohaterowie sceny: ${rp.relevant_subjects.join(", ")}.`,
    rp.lifestyle_rules && `Zasady lifestyle: ${rp.lifestyle_rules}.`,
    rp.child_context_rules && `Kontekst dziecięcy: ${rp.child_context_rules}.`,
    rp.adult_context_rules && `Kontekst dorosłego: ${rp.adult_context_rules}.`,
    rp.critical_product_features?.length &&
      `Krytyczne cechy produktu do zachowania: ${rp.critical_product_features.join(", ")}.`,
    rp.forbidden_transformations?.length &&
      `Zabronione zmiany: ${rp.forbidden_transformations.join(", ")}.`,
    rp.forbidden_usage?.length && `Zabronione zastosowania: ${rp.forbidden_usage.join(", ")}.`,
    rp.prompt_additions,
  ].filter(Boolean);
  return lines.join(" ");
}

function scenarioText(scenario: ConceptResult["scenario"] | null, idea: string): string {
  if (!scenario) return idea;
  const parts = [
    idea,
    `Bohater/scena: ${scenario.subject_type}${scenario.apparent_age_group ? " (" + scenario.apparent_age_group + ")" : ""}.`,
    scenario.hair && `Włosy: ${scenario.hair}.`,
    scenario.wardrobe && `Garderoba: ${scenario.wardrobe}.`,
    `Miejsce: ${scenario.location_type}.`,
    `Paleta: ${scenario.palette}.`,
    `Światło: ${scenario.lighting}.`,
    `Język fotograficzny: ${scenario.camera_language}.`,
    `Kompozycja: ${scenario.composition}.`,
    `Pora dnia: ${scenario.time_of_day}.`,
    scenario.props.length ? `Rekwizyty: ${scenario.props.join(", ")}.` : undefined,
    `Nastrój: ${scenario.mood}.`,
  ].filter(Boolean);
  return parts.join(" ");
}

function antiRepetitionText(notes: string[]): string {
  if (notes.length === 0) {
    return "Brak wcześniejszych sesji tego produktu do porównania — pełna swoboda doboru sceny w granicach Rule Pack.";
  }
  return `Aby zachować różnorodność, NIE powtarzaj elementów z ostatnich sesji tego produktu: ${notes.join("; ")}. Różnorodność jest drugorzędna wobec sensu produktu i realizmu — nie wprowadzaj chaosu tylko po to, by być innym.`;
}

function audienceContextText(audienceLabel: string, featuredSubjectLabel: string): string {
  return `Kontekst odbiorcy produktu: ${audienceLabel}. Kto ma być w kadrze: ${featuredSubjectLabel === "Auto" ? "dobierz automatycznie zgodnie z Rule Pack i typem zdjęcia" : featuredSubjectLabel}. Nie myl kontekstu odbiorcy produktu z osobą występującą na konkretnym zdjęciu — mogą się różnić.`;
}

function moduleContent(modules: PromptModuleRow[], key: string): { version: number; content: string } {
  const m = modules.find((x) => x.module_key === key);
  if (!m) throw new Error(`Brak modułu promptu "${key}" w wybranej wersji.`);
  return { version: m.version, content: m.content };
}

/**
 * Deterministyczny, modułowy Prompt Engine (sekcja 24). Kolejność A..J jest
 * stała. Każda generacja zapisuje moduleSnapshot do generation_jobs.prompt_snapshot
 * (dane admin/debug — zwykły użytkownik ich nie widzi, sekcja 61).
 */
export function buildPrompt(input: BuildPromptInput): BuiltPrompt {
  const a = moduleContent(input.modules, "A");
  const b = moduleContent(input.modules, "B");
  const c = moduleContent(input.modules, "C");
  const d = moduleContent(input.modules, "D");
  const e = moduleContent(input.modules, "E");
  const f = moduleContent(input.modules, "F");
  const g = moduleContent(input.modules, "G");
  const h = moduleContent(input.modules, "H");
  const i = moduleContent(input.modules, "I");
  const j = moduleContent(input.modules, "J");

  const resolved = {
    A: `${a.content} Profil produktu (Product Lock): ${input.productLockSummary}.`,
    B: b.content.replace("{{RULE_PACK}}", rulePackText(input.rulePack)),
    C: c.content.replace(
      "{{PHOTO_TYPE_RULES}}",
      `Typ zdjęcia: ${input.photoTypeLabel}. ${photoTypeRulesText(input.photoType)}`,
    ),
    D: d.content.replace(
      "{{AUDIENCE_CONTEXT}}",
      audienceContextText(input.audienceLabel, input.featuredSubjectLabel),
    ),
    E: e.content,
    F: f.content.replace("{{SCENARIO}}", scenarioText(input.scenario, input.ideaText)),
    G: g.content.replace("{{ANTI_REPETITION}}", antiRepetitionText(input.antiRepetitionNotes)),
    H: h.content.replace(
      "{{PURPOSE_ASPECT}}",
      purposeAspectRulesText(input.purpose, input.aspectRatio),
    ),
    I: i.content.replace(
      "{{USER_NOTE}}",
      input.userNote ? `Dodatkowa uwaga użytkownika: ${input.userNote}.` : "Brak dodatkowej uwagi użytkownika.",
    ),
    J: j.content,
  };

  const modeNote =
    input.mode === "prototype"
      ? "TRYB: PROTOTYP — tania, szybka weryfikacja kierunku sceny i kompozycji. Zaakceptowana wersja NIE jest źródłem prawdy o produkcie — to nadal referencje."
      : "TRYB: FINAL — maksymalna precyzja i zgodność z prawdziwymi referencjami produktu. Referencje mają bezwzględne pierwszeństwo przed jakąkolwiek wcześniejszą wersją prototypu.";

  const text = [resolved.A, resolved.B, resolved.C, resolved.D, resolved.E, resolved.F, resolved.G, resolved.H, resolved.I, modeNote, resolved.J]
    .filter(Boolean)
    .join("\n\n");

  return {
    text,
    moduleSnapshot: {
      A: { version: a.version, resolved: resolved.A },
      B: { version: b.version, resolved: resolved.B },
      C: { version: c.version, resolved: resolved.C },
      D: { version: d.version, resolved: resolved.D },
      E: { version: e.version, resolved: resolved.E },
      F: { version: f.version, resolved: resolved.F },
      G: { version: g.version, resolved: resolved.G },
      H: { version: h.version, resolved: resolved.H },
      I: { version: i.version, resolved: resolved.I },
      J: { version: j.version, resolved: resolved.J },
    },
  };
}
