export const PHOTO_TYPES = [
  { key: "lifestyle", label: "Lifestyle" },
  { key: "mama_dziecko", label: "Mama + dziecko" },
  { key: "flat_lay", label: "Flat lay" },
  { key: "makro", label: "Makro / detal" },
  { key: "packshot", label: "Packshot" },
  { key: "w_uzyciu", label: "Produkt w użyciu" },
] as const;

export type PhotoTypeKey = (typeof PHOTO_TYPES)[number]["key"];

export const PURPOSES = [
  { key: "auto", label: "Auto" },
  { key: "sklep", label: "Sklep" },
  { key: "instagram", label: "Instagram" },
  { key: "stories", label: "Stories / Reels" },
  { key: "meta_ads", label: "Meta Ads" },
  { key: "pinterest", label: "Pinterest" },
  { key: "banner", label: "Banner" },
] as const;

export const ASPECT_RATIOS = [
  { key: "auto", label: "Auto" },
  { key: "1:1", label: "1:1" },
  { key: "4:5", label: "4:5" },
  { key: "3:4", label: "3:4" },
  { key: "9:16", label: "9:16" },
  { key: "poziomy", label: "Poziomy" },
] as const;

export const FEATURED_SUBJECTS = [
  { key: "auto", label: "Auto" },
  { key: "sam_produkt", label: "Sam produkt" },
  { key: "kobieta", label: "Kobieta" },
  { key: "mama_dziecko", label: "Mama + dziecko" },
  { key: "dziecko", label: "Dziecko" },
  { key: "dorosly", label: "Dorosły" },
  { key: "bez_osob", label: "Bez osób" },
] as const;

/** Domyślny cel dla danego typu zdjęcia — używany, gdy użytkownik zostawi "Auto". */
export function defaultPurposeFor(photoType: string): string {
  switch (photoType) {
    case "packshot":
      return "sklep";
    case "mama_dziecko":
    case "lifestyle":
    case "w_uzyciu":
      return "instagram";
    case "makro":
      return "sklep";
    case "flat_lay":
      return "instagram";
    default:
      return "instagram";
  }
}

/** Domyślny format dla danego celu — sekcja 18/19: cel wpływa na aspect ratio, nie na konstrukcję produktu. */
export function defaultAspectFor(purpose: string, photoType: string): string {
  switch (purpose) {
    case "stories":
      return "9:16";
    case "meta_ads":
      return "4:5";
    case "pinterest":
      return "3:4";
    case "banner":
      return "poziomy";
    case "sklep":
      return "1:1";
    case "instagram":
      return photoType === "mama_dziecko" || photoType === "lifestyle" ? "4:5" : "1:1";
    default:
      return "1:1";
  }
}

export function photoTypeRulesText(photoType: string): string {
  switch (photoType) {
    case "lifestyle":
      return "NIE twórz reklamy produktowej — stwórz wiarygodny fragment prawdziwego życia, w którym produkt naturalnie istnieje. Unikaj sztampowej formuły AI-lifestyle (beż, len, suszone kwiaty, permanentne ciepłe światło, generyczna influencerka). Świat sceny może być kolorowy, zimny, miejski, deszczowy, wieczorny — cokolwiek pasuje do konkretnego produktu i sytuacji. Prawdziwa skóra, naturalne włosy, realne fałdy ubrania. Produkt może być naturalnie przesunięty, częściowo zasłonięty, asymetryczny zgodnie z fizyką — ale bez deformacji konstrukcji.";
    case "mama_dziecko":
      return "Macierzyństwo jako prawdziwa część życia, nie postawiona scena na sofie. Możliwe środowiska: miasto, spacer, wejście/wyjście, kawiarnia, podróż, sklep, ulica, park, dom — tylko jeśli scena tego faktycznie wymaga. Unikaj domyślnie: mama na beżowej sofie w lnianej sukience z ciepłym światłem z okna. Produkt nadal może być naturalną częścią stylizacji mamy.";
    case "flat_lay":
      return "Nie domyślaj się automatycznie lnu, suszonych kwiatów i beżowego tła — dobierz powierzchnię i światło do konkretnego produktu. Zachowaj produkt w skali 1:1, prawdziwe cienie kontaktowe, realistyczne materiały, komercyjną czytelność, bez dekoracyjnego chaosu.";
    case "makro":
      return "Pokaż prawdziwą fakturę: silikon, drewno, sznurek, grawer, zapięcie, połączenia elementów, realną głębię ostrości. Bez pseudo-makro z błędną geometrią produktu.";
    case "packshot":
      return "Priorytet: maksymalna zgodność z produktem, minimalna kreatywność. Czysty, realistyczny produkt e-commerce na neutralnym tle. Nie przestylizowuj.";
    case "w_uzyciu":
      return "Użycie musi być zgodne z faktyczną funkcją produktu opisaną w Rule Pack i Product Lock — nie wymyślaj atrakcyjnych, ale nieprawdziwych zastosowań.";
    default:
      return "Zachowaj naturalny, wiarygodny kontekst zgodny z charakterem produktu.";
  }
}

export function purposeAspectRulesText(purpose: string, aspectRatio: string): string {
  const purposeText: Record<string, string> = {
    sklep: "Kadr czytelny na białym/neutralnym tle e-commerce, produkt w pełni widoczny.",
    instagram: "Kadr naturalny, dopasowany do siatki Instagrama, bez sztucznego zagęszczenia.",
    stories: "Pionowy kadr z zostawionym bezpiecznym marginesem (safe zone) na UI Stories — nie umieszczaj kluczowych elementów produktu w górnych/dolnych ~15% kadru.",
    meta_ads: "Kadr czytelny w małym formacie na urządzeniu mobilnym, produkt musi być rozpoznawalny nawet w miniaturze.",
    pinterest: "Pionowy, inspirujący kadr z wyraźną hierarchią wizualną.",
    banner: "Poziomy kadr z zostawioną przestrzenią (negative space) pod ewentualny tekst nakładany później — nie generuj tekstu w obrazie.",
    auto: "Dobierz kadrowanie odpowiednie do typowego użycia tego typu zdjęcia.",
  };
  return `${purposeText[purpose] ?? purposeText.auto} Format docelowy: ${aspectRatio}.`;
}
