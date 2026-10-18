import {
  CATEGORIES,
  FREE_SHIPPING_FROM,
  NAME_MAX_LETTERS,
  PRODUCTS,
  productById,
  type Palette,
  type Product,
  type ProductType,
} from "@/lib/doradca/catalog";

/**
 * Silnik doradcy zakupowego. Czysty TypeScript bez zależności — ten sam kod
 * działa w widgecie na stronie sklepu i w trasie API, więc rekomendacje
 * z quizu, czatu offline i czatu AI zawsze opierają się na tych samych regułach.
 */

export type Recipient = "dziecko" | "prezent" | "mama" | "ja";
export type Need = "smoczek" | "zabkowanie" | "komplet" | "klucze" | "maly" | "dowolne";
export type PersonalizationWish = "imie" | "mama" | "inicjaly" | "bez" | "dowolne";

export interface Answers {
  recipient?: Recipient;
  need?: Need;
  personalization?: PersonalizationWish;
  /** Maksymalna kwota w zł; 0 albo brak = bez znaczenia. */
  budget?: number;
  color?: Palette | "dowolne";
}

export interface Recommendation {
  product: Product;
  score: number;
  reasons: string[];
}

export interface QuizOption<V> {
  value: V;
  label: string;
}
export interface QuizStep {
  key: keyof Answers;
  question: string;
  options: QuizOption<string | number>[];
}

const forChild = (a: Answers) => a.recipient === "dziecko" || a.recipient === "prezent";

/** Kolejne pytania quizu. Drugie i trzecie pytanie zależą od odpowiedzi na pierwsze. */
export function quizSteps(a: Answers): QuizStep[] {
  const steps: QuizStep[] = [
    {
      key: "recipient",
      question: "Dla kogo szukasz?",
      options: [
        { value: "dziecko", label: "Dla mojego dziecka" },
        { value: "prezent", label: "Prezent dla maluszka" },
        { value: "mama", label: "Prezent dla mamy" },
        { value: "ja", label: "Dla siebie" },
      ],
    },
  ];
  if (!a.recipient) return steps;
  if (forChild(a)) {
    steps.push(
      {
        key: "need",
        question: "Czego potrzebujesz?",
        options: [
          { value: "smoczek", label: "Zawieszki do smoczka" },
          { value: "zabkowanie", label: "Czegoś na ząbkowanie" },
          { value: "komplet", label: "Kompletu na prezent" },
          { value: "dowolne", label: "Jeszcze nie wiem" },
        ],
      },
      {
        key: "personalization",
        question: "Z imieniem dziecka?",
        options: [
          { value: "imie", label: "Tak, z imieniem" },
          { value: "bez", label: "Bez imienia" },
          { value: "dowolne", label: "Bez znaczenia" },
        ],
      },
    );
  } else {
    steps.push(
      {
        key: "need",
        question: "Jaki drobiazg?",
        options: [
          { value: "klucze", label: "Brelok do kluczy" },
          { value: "maly", label: "Mały brelok do torebki" },
          { value: "dowolne", label: "Pokaż wszystkie" },
        ],
      },
      {
        key: "personalization",
        question: "Z napisem?",
        options: [
          { value: "mama", label: "Z napisem MAMA" },
          { value: "inicjaly", label: "Z inicjałami" },
          { value: "bez", label: "Bez napisu" },
          { value: "dowolne", label: "Bez znaczenia" },
        ],
      },
    );
  }
  steps.push(
    {
      key: "budget",
      question: "Jaki budżet?",
      options: [
        { value: 50, label: "do 50 zł" },
        { value: 70, label: "do 70 zł" },
        { value: 120, label: "do 120 zł" },
        { value: 0, label: "Bez znaczenia" },
      ],
    },
    {
      key: "color",
      question: "Jakie kolory?",
      options: [
        { value: "neutral", label: "Naturalne, beże" },
        { value: "roz", label: "Pudrowy róż" },
        { value: "blekit", label: "Błękity" },
        { value: "dowolne", label: "Bez znaczenia" },
      ],
    },
  );
  return steps;
}

const NEED_TYPES: Record<Need, ProductType[]> = {
  smoczek: ["zawieszka"],
  zabkowanie: ["grzechotka"],
  komplet: ["zestaw"],
  klucze: ["brelok"],
  maly: ["brelok"],
  dowolne: [],
};
const COLOR_LABEL: Record<Palette, string> = { neutral: "w naturalnych odcieniach", roz: "w odcieniach różu", blekit: "w odcieniach błękitu" };
export const formatPrice = (zl: number) => `${zl.toFixed(2).replace(".", ",")} zł`;

function scoreProduct(p: Product, a: Answers): Recommendation | null {
  const reasons: string[] = [];
  let score = 0;
  const child = a.recipient ? forChild(a) : null;

  if (child === true && p.type === "brelok") return null;
  if (child === false && p.type !== "brelok") return null;

  const wanted = a.need ? NEED_TYPES[a.need] : [];
  if (wanted.length) {
    if (!wanted.includes(p.type)) return null;
    score += 40;
  }
  if (a.need === "klucze" && p.id === "181") { score += 8; reasons.push("obręcz wygodna do trzymania w dłoni"); }
  if (a.need === "maly" && (p.id === "179" || p.id === "178")) score += 8;

  switch (a.personalization) {
    case "imie":
      if (p.personalization === "imie") { score += 30; reasons.push("z imieniem dziecka"); } else score -= 35;
      break;
    case "mama":
      if (p.personalization === "mama") { score += 30; reasons.push("z napisem MAMA"); } else score -= 35;
      break;
    case "inicjaly":
      if (p.personalization === "inicjaly") { score += 30; reasons.push("z Twoimi inicjałami"); } else score -= 35;
      break;
    case "bez":
      if (p.personalization === "brak") score += 15; else score -= 15;
      break;
  }

  if (a.recipient === "prezent" && p.type === "zestaw") { score += 12; reasons.push("komplet gotowy do podarowania"); }
  if (a.recipient === "prezent" && p.personalization === "imie") score += 6;
  if (a.recipient === "mama" && p.personalization === "mama") score += 10;

  if (a.budget && a.budget > 0) {
    if (p.price <= a.budget) { score += 12; reasons.push(`mieści się w budżecie do ${a.budget} zł`); } else score -= 25 + (p.price - a.budget);
  }

  if (a.color && a.color !== "dowolne") {
    if (p.colors.includes(a.color)) { score += 18; reasons.push(COLOR_LABEL[a.color]); } else score -= 8;
  }

  if (p.type === "zestaw" && !reasons.includes("komplet gotowy do podarowania")) reasons.push("gryzak i zawieszka w jednej kolorystyce");
  return { product: p, score, reasons: reasons.slice(0, 3) };
}

/** Najlepiej dopasowane produkty z uzasadnieniem. Nigdy nie zwraca pustej listy, gdy coś choć trochę pasuje. */
export function recommend(a: Answers, limit = 3): Recommendation[] {
  return PRODUCTS.map((p) => scoreProduct(p, a))
    .filter((r): r is Recommendation => r !== null)
    .sort((x, y) => y.score - x.score || x.product.price - y.product.price)
    .slice(0, limit);
}

/** Produkty, które dobrze uzupełniają dany produkt (np. zawieszka + grzechotka w tej samej kolorystyce). */
export function complements(id: string, limit = 2): Product[] {
  const p = productById(id);
  if (!p) return [];
  const pairType: Record<ProductType, ProductType[]> = {
    zawieszka: ["grzechotka", "brelok"],
    grzechotka: ["zawieszka", "brelok"],
    zestaw: ["brelok"],
    brelok: ["zawieszka", "zestaw"],
  };
  const order = pairType[p.type];
  return PRODUCTS.filter((q) => q.id !== p.id && order.includes(q.type))
    .map((q) => {
      let s = 10 - order.indexOf(q.type) * 5;
      if (q.personalization === p.personalization && p.personalization !== "brak") s += 6;
      if (q.colors.some((c) => p.colors.includes(c))) s += 4;
      return { q, s };
    })
    .sort((x, y) => y.s - x.s || x.q.price - y.q.price)
    .slice(0, limit)
    .map((x) => x.q);
}

export interface ShippingCombo {
  add: Product;
  total: number;
}

/** Najtańsze sensowne uzupełnienie koszyka, z którym zamówienie łapie darmową dostawę. */
export function freeShippingCombo(id: string): ShippingCombo | null {
  const p = productById(id);
  if (!p || p.price >= FREE_SHIPPING_FROM) return null;
  const pool = [...complements(id, 8), ...PRODUCTS.filter((q) => q.id !== id)];
  const seen = new Set<string>();
  const options = pool
    .filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)))
    .filter((q) => p.price + q.price >= FREE_SHIPPING_FROM)
    .map((q, i) => ({ add: q, total: p.price + q.price, rank: i }));
  if (!options.length) return null;
  options.sort((x, y) => x.total - y.total || x.rank - y.rank);
  const best = options.find((o) => o.rank < 8 && o.total <= options[0].total + 25) ?? options[0];
  return { add: best.add, total: best.total };
}

export interface NameCheck {
  ok: boolean;
  clean: string;
  message: string;
}

const LETTERS = /[^A-ZĄĆĘŁŃÓŚŹŻ]/g;

/** Sprawdza imię pod zawieszkę imienną: litery, długość, czytelny komunikat. */
export function checkName(raw: string): NameCheck {
  const clean = raw.toUpperCase().replace(LETTERS, "");
  if (!clean) return { ok: false, clean, message: "Wpisz imię — same litery, bez cyfr i znaków." };
  if (clean.length > NAME_MAX_LETTERS) {
    return {
      ok: false,
      clean,
      message: `To ${clean.length} liter, a na zawieszce imiennej mieści się do ${NAME_MAX_LETTERS}. Wybierz krótszą formę imienia albo napisz do nas — sprawdzimy, co da się zrobić.`,
    };
  }
  return { ok: true, clean, message: `${clean} — ${clean.length} ${clean.length === 1 ? "litera" : clean.length < 5 ? "litery" : "liter"}, zmieści się.` };
}

/** Produkty, na których można umieścić imię dziecka. */
export const nameProducts = () => PRODUCTS.filter((p) => p.personalization === "imie");

export interface OfflineReply {
  reply: string;
  productIds: string[];
  quickReplies: string[];
}

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w));

/** Odczytuje z pytania klientki to, co da się przełożyć na odpowiedzi quizu. */
export function answersFromText(text: string): Answers {
  const t = text.toLowerCase();
  const a: Answers = {};
  if (has(t, "dla mamy", "mamie", "mamy", "dla żony", "przyjaciółk")) a.recipient = "mama";
  else if (has(t, "dla siebie", "dla mnie", "sobie")) a.recipient = "ja";
  else if (has(t, "prezent", "chrzciny", "chrzest", "baby shower", "narodziny", "roczek", "urodziny")) a.recipient = "prezent";
  else if (has(t, "dziecko", "synek", "córk", "córeczk", "maluch", "niemowl", "noworod", "bobas")) a.recipient = "dziecko";

  if (has(t, "smocz")) a.need = "smoczek";
  else if (has(t, "ząbk", "zabk", "gryzak", "grzechot")) a.need = "zabkowanie";
  else if (has(t, "zestaw", "komplet")) a.need = "komplet";
  else if (has(t, "brelok", "klucz")) a.need = "klucze";

  if (has(t, "z imieniem", "imię", "imie", "imienn", "personaliz")) a.personalization = "imie";
  else if (has(t, "napis mama", "z napisem mama")) a.personalization = "mama";
  else if (has(t, "inicja", "liter")) a.personalization = a.recipient === "mama" || a.recipient === "ja" ? "inicjaly" : a.personalization;

  const money = t.match(/(?:do|max|maks\w*|około|ok\.?|poniżej)\s*(\d{2,3})\s*(?:zł|zl|pln)?/) || t.match(/(\d{2,3})\s*(?:zł|zl|pln)/);
  if (money) a.budget = Number(money[1]);

  if (has(t, "róż", "roz", "pudrow", "dziewczyn")) a.color = "roz";
  else if (has(t, "błęk", "blek", "niebiesk", "chłop")) a.color = "blekit";
  else if (has(t, "beż", "bez kolor", "natural", "neutral", "drewn", "biał", "szar")) a.color = "neutral";
  return a;
}

/**
 * Odpowiedź bez modelu AI: najczęstsze pytania z faktów sklepu oraz dobór produktów
 * z silnika. Używana w widgecie bez serwera i w API, gdy płatne AI jest wyłączone.
 */
export function offlineAnswer(text: string, viewingId?: string): OfflineReply {
  const t = text.toLowerCase();
  const quick = ["Prezent na chrzciny do 120 zł", "Zawieszka z imieniem w różu", "Brelok dla mamy"];

  if (has(t, "dobrać", "dobrac", "pasuje", "do tego", "do pary", "w parze", "razem z")) {
    const base = (viewingId && productById(viewingId)) ||
      PRODUCTS.find((p) => (has(t, "zawiesz") && p.type === "zawieszka") || (has(t, "gryzak", "grzechot") && p.type === "grzechotka"));
    if (base) {
      const pair = complements(base.id);
      const combo = freeShippingCombo(base.id);
      return {
        reply: `Do ${base.name} najlepiej pasuje ${pair.map((p) => p.name).join(" albo ")}.` +
          (combo ? ` Z ${combo.add.name} zamówienie wyniesie ${formatPrice(combo.total)} — wtedy dostawa jest darmowa.` : ""),
        productIds: [...new Set([...pair.map((p) => p.id), ...(combo ? [combo.add.id] : [])])].slice(0, 3),
        quickReplies: ["Ile liter zmieści się na zawieszce?", "Jak dbać o produkt?"],
      };
    }
  }

  if (has(t, "ile liter", "ile znak", "długie imię", "dlugie imie", "zmieści", "zmiesci")) {
    return {
      reply: `Na zawieszce imiennej mieści się do ${NAME_MAX_LETTERS} liter — długość dopasowujemy do imienia. Wpisz imię w zakładce „Imię”, a od razu sprawdzę, czy się zmieści.`,
      productIds: nameProducts().filter((p) => p.type === "zawieszka").map((p) => p.id),
      quickReplies: ["Zawieszka z imieniem w różu", "Zestaw z imieniem"],
    };
  }
  if (has(t, "dostaw", "wysył", "wysyl", "kurier", "przesyłk")) {
    return {
      reply: `Dostawa jest darmowa od ${FREE_SHIPPING_FROM} zł. Szczegóły kosztów i czasu wysyłki znajdziesz w koszyku. Jeśli brakuje Ci niewiele do darmowej dostawy, podpowiem, co dobrać.`,
      productIds: [],
      quickReplies: ["Co dobrać do zawieszki?", "Zestaw na prezent"],
    };
  }
  if (has(t, "myć", "myc", "czyść", "czysc", "steryliz", "pielęgn", "pielegn", "zmywar")) {
    return { reply: "Wystarczy przetrzeć wilgotną chusteczką. Prosimy nie sterylizować i nie wkładać do zmywarki — silikon i drewno dłużej zachowają wygląd.", productIds: [], quickReplies: quick };
  }
  if (has(t, "bezpieczn", "lfgb", "bpa", "materiał", "material", "z czego", "atest", "norm")) {
    return {
      reply: "Koraliki są z silikonu LFGB i naturalnego drewna bukowego bez farby, a klips zawieszki ze stali nierdzewnej. Zawieszki opisujemy jako zgodne z normą EN 12586. Jak przy każdym akcesorium dla niemowlęcia — używaj pod nadzorem dorosłego.",
      productIds: [],
      quickReplies: quick,
    };
  }
  if (has(t, "zwrot", "reklamac", "zamówieni", "zamowieni", "status", "faktur", "kontakt")) {
    return { reply: "W sprawach zamówień, zwrotów i reklamacji napisz do nas przez zakładkę „Kontakt” — odpowiemy osobiście.", productIds: [], quickReplies: quick };
  }

  const a = answersFromText(text);
  if (!Object.keys(a).length) {
    return {
      reply: "Chętnie pomogę wybrać. Napisz, dla kogo szukasz, czy ma być imię dziecka i jaki masz budżet — albo skorzystaj z zakładki „Dobierz”, to zajmie 30 sekund.",
      productIds: [],
      quickReplies: quick,
    };
  }
  const recs = recommend(a);
  if (!recs.length) {
    return { reply: "Nie mam produktu, który spełnia wszystkie warunki. Spróbuj poluzować budżet albo kolor.", productIds: [], quickReplies: quick };
  }
  const top = recs[0];
  const why = top.reasons.length ? ` — ${top.reasons.join(", ")}` : "";
  return {
    reply: `Najlepiej pasuje ${top.product.name} (${formatPrice(top.product.price)})${why}.${recs.length > 1 ? " Zobacz też pozostałe propozycje poniżej." : ""}`,
    productIds: recs.map((r) => r.product.id),
    quickReplies: [top.product.type === "zawieszka" ? "Co dobrać do zawieszki?" : "Zawieszka z imieniem w różu", "Ile liter zmieści się na zawieszce?", "Jak dbać o gryzak?"],
  };
}

export { CATEGORIES, FREE_SHIPPING_FROM, NAME_MAX_LETTERS };
