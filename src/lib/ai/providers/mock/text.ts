import type {
  ConceptInput,
  ConceptResult,
  ContentInput,
  ContentResult,
  ProductAnalysisInput,
  ProductProfileResult,
  TextVisionProvider,
  TrendBriefResult,
} from "@/lib/ai/types";

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Mock tekstowo-wizyjny — nie wywołuje żadnego zewnętrznego API. Zwraca
 * deterministyczne, sensowne dane, żeby cały flow dało się przetestować
 * bez klucza OpenAI (sekcja 69 zadania — USE_MOCK_AI=true).
 */
export class MockTextVisionProvider implements TextVisionProvider {
  async analyzeProduct(input: ProductAnalysisInput) {
    const typeOption = input.productTypeOptions[0] ?? { key: "inny", label: "Inny" };
    const audienceOption = input.audienceOptions[0] ?? { key: "uniwersalny", label: "Uniwersalny" };
    const result: ProductProfileResult = {
      product_name: "Produkt Oak & Oats (analiza demo)",
      product_type_key: typeOption.key,
      product_type_confidence: input.references.length >= 3 ? "high" : "medium",
      product_type_alternative: null,
      variant_name: null,
      audience_context_key: audienceOption.key,
      materials: ["drewno bukowe", "silikon spożywczy"],
      main_colors: ["naturalne drewno", "beż"],
      secondary_colors: [],
      element_count: 5,
      element_sequence: ["drewno", "silikon", "drewno", "silikon", "drewno"],
      shapes: ["koło", "heksagon"],
      relative_sizes: "elementy zbliżonej wielkości, ok. 2 cm",
      wooden_elements: ["korale bukowe"],
      silicone_elements: ["korale silikonowe"],
      cord: "bawełniany sznurek woskowany",
      clasp: "zapięcie bezpieczeństwa z zatrzaskiem",
      hardware: [],
      text_elements: [],
      letters: null,
      engraving: null,
      personalization_detected: false,
      critical_features: ["kolejność elementów", "typ zapięcia"],
      usage: "produkt dziecięcy/sensoryczny zgodnie z kategorią",
      forbidden_transformations: ["zmiana liczby elementów", "zmiana kolejności", "zmiana zapięcia"],
      safety_context: "podwójne nawlekanie, elementy bezpieczne dla niemowląt",
      notes: "To dane demonstracyjne z trybu mock — podłącz ENABLE_PAID_AI, aby użyć realnej analizy.",
      uncertain_fields: input.references.length < 3 ? ["element_count", "clasp"] : [],
      analysis_confidence: input.references.length >= 3 ? "high" : "medium",
      suggested_master_reference_index: 0,
      reference_quality_status: input.references.length >= 2 ? "sufficient" : "can_improve",
      reference_quality_notes:
        input.references.length < 2
          ? ["Dodaj więcej zdjęć — co najmniej jedno bliskie ujęcie zapięcia."]
          : [],
    };
    return {
      result,
      usage: { inputTokens: 400 * input.references.length, outputTokens: 220 },
    };
  }

  async proposeConcept(input: ConceptInput) {
    const seed = seedFromString(
      input.photoType + input.productSummary + (input.userNote ?? "") + input.recentScenarios.length,
    );
    const locations = [
      "miejska ulica wczesnym wieczorem, neony w tle",
      "przedpokój tuż przed wyjściem z domu",
      "peron kolejowy, chwila w podróży",
      "kawiarnia z dużym oknem, popołudniowe światło",
      "plac zabaw jesienią, chłodne światło",
      "wnętrze samochodu, pauza w trakcie jazdy",
    ];
    const lightings = [
      "naturalne światło dzienne, lekko chmurno",
      "ciepłe światło lamp ulicznych o zmierzchu",
      "kontrastowe światło słoneczne z ostrym cieniem",
      "miękkie rozproszone światło z okna",
      "bezpośredni flash, reporterski charakter",
    ];
    const moods = ["spokojny, codzienny", "energiczny, w ruchu", "intymny, ciepły", "reporterski, autentyczny"];
    const idea = `Propozycja AI: ${pick(locations, seed)}. Światło: ${pick(lightings, seed + 1)}. Nastrój: ${pick(moods, seed + 2)}. Produkt naturalnie wpisany w kadr, bez pozowanej reklamowej kompozycji.`;
    const result: ConceptResult = {
      idea_pl: idea,
      scenario: {
        subject_type: input.featuredSubject === "auto" ? "dobrany automatycznie do kontekstu" : input.featuredSubject,
        apparent_age_group: input.featuredSubject.includes("dziecko") ? "niemowlę/małe dziecko" : "dorosły 25-35",
        hair: pick(["rozpuszczone, naturalne", "spięte w kok", "krótkie"], seed + 3),
        wardrobe: pick(["casualowa kurtka", "prosty sweter", "płaszcz"], seed + 4),
        location_type: pick(locations, seed),
        palette: pick(["stonowana, jesienna", "chłodna, miejska", "ciepła, naturalna", "kontrastowa"], seed + 5),
        lighting: pick(lightings, seed + 1),
        camera_language: pick(["reporterskie, 35mm", "bliski kadr, 50mm", "szeroki kadr środowiskowy"], seed + 6),
        composition: pick(["kadr niecentralny", "rule of thirds", "close-up z negative space"], seed + 7),
        time_of_day: pick(["rano", "popołudnie", "zmierzch", "wieczór"], seed + 8),
        props: [],
        mood: pick(moods, seed + 2),
      },
    };
    return { result, usage: { inputTokens: 300, outputTokens: 180 } };
  }

  async generateContent(input: ContentInput) {
    const facts = input.verifiedFacts.slice(0, 3).join(", ");
    const result: ContentResult = {
      channel: input.channel,
      instagram:
        input.channel === "instagram"
          ? {
              caption: `${input.productSummary} — u nas robimy to ręcznie, z dbałością o każdy detal. ${facts ? "Materiały: " + facts + "." : ""}`,
              alt: `${input.productSummary}, zdjęcie produktowe Oak & Oats`,
              hashtags: ["#oakandoats", "#rekodzielo", "#swiadomemacierzynstwo"],
            }
          : undefined,
      meta_ads:
        input.channel === "meta_ads"
          ? {
              primary_text: `${input.productSummary}. Polska manufaktura, materiały bezpieczne dla dziecka.`,
              headline: "Oak & Oats — rękodzieło dla najmłodszych",
              description: "Sprawdź kolekcję",
            }
          : undefined,
      sklep:
        input.channel === "sklep"
          ? {
              alt: `${input.productSummary} — Oak & Oats`,
              seo_filename: "oak-and-oats-" + input.photoType.toLowerCase().replace(/\s+/g, "-"),
              short_description: `${input.productSummary}. ${facts}`,
            }
          : undefined,
      pinterest:
        input.channel === "pinterest"
          ? {
              title: `${input.productSummary} | Oak & Oats`,
              description: `Polskie rękodzieło dla mam i dzieci. ${facts}`,
            }
          : undefined,
    };
    return { result, usage: { inputTokens: 250, outputTokens: 150 } };
  }

  async researchTrends() {
    const result: TrendBriefResult = {
      points: [
        {
          summary_pl: "Bardziej bezpośredni, reporterski flash zamiast wystudiowanego światła studyjnego.",
          relevance: "lifestyle, social organic",
          confidence: "medium",
          sources: [{ title: "Przykładowe źródło demo (tryb mock)", url: null }],
        },
        {
          summary_pl: "Mniej perfekcyjne product placement — produkt naturalnie 'żyje' w kadrze.",
          relevance: "e-commerce visuals",
          confidence: "medium",
          sources: [{ title: "Przykładowe źródło demo (tryb mock)", url: null }],
        },
        {
          summary_pl: "Większa różnorodność kolorystyczna otoczenia zamiast jednej stałej palety marki.",
          relevance: "motherhood/lifestyle",
          confidence: "low",
          sources: [{ title: "Przykładowe źródło demo (tryb mock)", url: null }],
        },
      ],
    };
    return { result, usage: { inputTokens: 200, outputTokens: 200, webSearchCalls: 0 } };
  }
}
