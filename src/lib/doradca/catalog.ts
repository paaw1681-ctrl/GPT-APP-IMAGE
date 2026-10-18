/**
 * Katalog doradcy zakupowego — produkty widoczne w Sky-Shop według kopii katalogu z API (24.08.2026).
 * Typ, personalizacja i kolorystyka są oznaczone ręcznie na podstawie nazw, opisów i zdjęć produktów.
 * Ceny i dostępność sprawdzaj w Sky-Shop; po zmianie oferty zaktualizuj tę listę.
 */
export type ProductType = "zawieszka" | "grzechotka" | "zestaw" | "brelok";
export type Personalization = "imie" | "mama" | "inicjaly" | "brak";
export type Palette = "neutral" | "roz" | "blekit";

export interface Product {
  id: string;
  name: string;
  price: number;
  type: ProductType;
  personalization: Personalization;
  colors: Palette[];
  /** Ścieżka produktu w sklepie (format Sky-Shop „NAZWA-p{ID}”); widget poprawia ją adresem znalezionym na stronie. */
  path: string;
  img: string;
  desc: string;
}

export const SHOP_URL = "https://oakandoats.pl";
export const FREE_SHIPPING_FROM = 150;
export const NAME_MAX_LETTERS = 6;

export const CATEGORIES = {
  wszystkie: "/WSZYSTKIE-PRODUKTY-c37",
  gryzaki: "/GRYZAKI-c30",
  zawieszki: "/ZAWIESZKI-DO-SMOCZKA-c32",
  zestawy: "/ZESTAWY-c36",
  personalizowane: "/PERSONALIZOWANE-c40",
  breloki: "/BRELOKI-c41",
} as const;

/** Fakty, na które doradca może się powoływać. Nic spoza tej listy i opisów produktów. */
export const FACTS = [
  `Darmowa dostawa od ${FREE_SHIPPING_FROM} zł.`,
  "Produkty są wykonywane ręcznie w Polsce z drewna bukowego i silikonu LFGB.",
  `Zawieszki imienne: imię z bukowych literek, do ${NAME_MAX_LETTERS} znaków; długość dopasowywana do liczby liter.`,
  "Zawieszki do smoczka mają klips ze stali nierdzewnej w drewnianej oprawie.",
  "Pielęgnacja: czyścić wilgotną chusteczką, nie sterylizować.",
  "Zestaw to gryzak i zawieszka do smoczka w jednej kolorystyce.",
  "Breloki DAISY i TULIP mają litery MAMA; IRIS ma jedną, dwie lub trzy litery.",
];

export const PRODUCTS: Product[] = [
  { id: "181", name: "BRELOCZEK DAISY", price: 55, type: "brelok", personalization: "mama", colors: ["roz", "neutral"],
    path: "/BRELOCZEK-DAISY-p181", img: "https://oakandoats.pl/images/cd583/0-1000/BRELOCZEK-DAISY_%5B757%5D",
    desc: "Brelok - obręcz idealnie pasująca do dłoni z literkami MAMA." },
  { id: "180", name: "BRELOCZEK TULIP", price: 55, type: "brelok", personalization: "mama", colors: ["neutral"],
    path: "/BRELOCZEK-TULIP-p180", img: "https://oakandoats.pl/images/cd583/0-1000/BRELOCZEK-TULIP_%5B754%5D",
    desc: "Brelok z bukowych i silikonowych koralików z literami MAMA." },
  { id: "179", name: "BRELOCZEK IRIS", price: 49, type: "brelok", personalization: "inicjaly", colors: ["blekit"],
    path: "/BRELOCZEK-IRIS-p179", img: "https://oakandoats.pl/images/cd583/0-1000/BRELOCZEK-ASH_%5B734%5D",
    desc: "Drobny brelok z silikonowych i bukowych koralików z jedną, dwiema lub trzema literami." },
  { id: "178", name: "BRELOCZEK PEONY", price: 45, type: "brelok", personalization: "brak", colors: ["neutral"],
    path: "/BRELOCZEK-PEONY-p178", img: "https://oakandoats.pl/images/cd583/0-1000/Breloczek-FLOWER_%5B725%5D",
    desc: "Brelok z bukowych i białych koralików zakończony dużym silikonowym kwiatem." },
  { id: "177", name: "ZAWIESZKA CHESTNUT", price: 59, type: "zawieszka", personalization: "imie", colors: ["roz", "neutral"],
    path: "/ZAWIESZKA-CHESTNUT-p177", img: "https://oakandoats.pl/images/cd583/0-1000/ZAWIESZKA-CHESTNUT_%5B682%5D",
    desc: "Ciepłe, orzechowe odcienie drewna i imię dziecka w oprawie z silikonu LFGB. Zgodna z EN 12586, ręcznie robiona w Polsce." },
  { id: "176", name: "ZAWIESZKA CYPRESS", price: 59, type: "zawieszka", personalization: "imie", colors: ["neutral"],
    path: "/ZAWIESZKA-CYPRESS-p176", img: "https://oakandoats.pl/images/cd583/0-1000/ZAWIESZKA-CYPRESS_%5B673%5D",
    desc: "Najbardziej minimalistyczna z zawieszek imiennych: same literki, bez ozdobników. Dla tych, które wolą, żeby imię było jedynym akcentem." },
  { id: "175", name: "ZAWIESZKA CEDAR", price: 59, type: "zawieszka", personalization: "imie", colors: ["neutral"],
    path: "/ZAWIESZKA-CEDAR-p175", img: "https://oakandoats.pl/images/cd583/0-1000/ZAWIESZKA-CEDAR_%5B668%5D",
    desc: "Imię dziecka z bukowych literek, nawleczonych jedna po drugiej. Zawieszka zgodna z EN 12586 — długość sznurka mierzona pod naciągiem." },
  { id: "174", name: "GRZECHOTKA SENSORYCZNA RIVER", price: 69, type: "grzechotka", personalization: "imie", colors: ["blekit"],
    path: "/GRZECHOTKA-SENSORYCZNA-RIVER-p174", img: "https://oakandoats.pl/images/cd583/0-1000/GRYZAK-RIVER_%5B638%5D",
    desc: "Bukowe pierścienie z grawerem i silikon w odcieniach wody. Imię dziecka wpisane na stałe, nie naklejone." },
  { id: "173", name: "GRZECHOTKA SENSORYCZNA CLOUD", price: 69, type: "grzechotka", personalization: "imie", colors: ["neutral"],
    path: "/GRZECHOTKA-SENSORYCZNA-CLOUD-p173", img: "https://oakandoats.pl/images/cd583/0-1000/GRYZAK-CLOUD_%5B630%5D",
    desc: "Chłodna, spokojna paleta i imię dziecka na bukowych pierścieniach. Gryzak, który nie przebodźcowuje — ani dziecka, ani wnętrza." },
  { id: "172", name: "ZESTAW MAPLE", price: 115, type: "zestaw", personalization: "imie", colors: ["neutral"],
    path: "/ZESTAW-MAPLE-p172", img: "https://oakandoats.pl/images/cd583/0-1000/ZESTAW-MAPLE_%5B624%5D",
    desc: "Klasyczny komplet z imieniem: gryzak do ząbkowania i zawieszka do smoczka. Jedna kolorystyka, jeden woreczek, zero pakowania po Twojej stronie." },
  { id: "171", name: "ZESTAW ACACIA", price: 115, type: "zestaw", personalization: "imie", colors: ["neutral"],
    path: "/ZESTAW-ACACIA-p171", img: "https://oakandoats.pl/images/cd583/0-1000/ZESTAW-ACACIA_%5B639%5D",
    desc: "Ciepłe odcienie drewna i imię dziecka na obu elementach zestawu. Najczęściej wybierany na chrzciny, bo wygląda jak prezent, a nie jak zakup." },
  { id: "170", name: "ZESTAW PINE", price: 115, type: "zestaw", personalization: "imie", colors: ["roz"],
    path: "/ZESTAW-PINE-p170", img: "https://oakandoats.pl/images/cd583/0-1000/ZESTAW-PINE_%5B643%5D",
    desc: "Gryzak i zawieszka w jednej palecie, oba z imieniem dziecka. Komplet, którego nie trzeba dobierać — przyjeżdża gotowy w lnianym woreczku." },
  { id: "169", name: "ZAWIESZKA WILLOW", price: 49, type: "zawieszka", personalization: "brak", colors: ["blekit"],
    path: "/ZAWIESZKA-WILLOW-p169", img: "https://oakandoats.pl/images/cd583/0-1000/Zawieszka-WILLOW_%5B596%5D",
    desc: "Zawieszka do smoczka Willow - dwukolorowa kompozycja pasteli i głębszych odcieni. Stymuluje wzrok malucha, drewno bukowe i silikon LFGB." },
  { id: "168", name: "ZAWIESZKA PEONY", price: 65, type: "zawieszka", personalization: "brak", colors: ["neutral"],
    path: "/ZAWIESZKA-PEONY-p168", img: "https://oakandoats.pl/images/cd583/0-1000/ZAWIESZKA-PEONY_%5B590%5D",
    desc: "Zawieszka do smoczka Peony - cztery kwiaty z silikonu food-grade i koraliki z drewna bukowego. Do dotykania, ściskania i odkrywania." },
  { id: "167", name: "ZAWIESZKA OAK SPRING", price: 48, type: "zawieszka", personalization: "brak", colors: ["neutral", "roz"],
    path: "/ZAWIESZKA-OAK-SPRING-p167", img: "https://oakandoats.pl/images/cd583/0-1000/ZAWIESZKA-OAK-SPRING_%5B587%5D",
    desc: "Zawieszka do smoczka Oak Spring - wiosenna, jasna kolorystyka, drewno bukowe i silikon LFGB. Lekka, bezpieczna, ręcznie robiona." },
  { id: "166", name: "ZESTAW LILAC", price: 98, type: "zestaw", personalization: "brak", colors: ["roz"],
    path: "/ZESTAW-LILAC-p166", img: "https://oakandoats.pl/images/cd583/0-1000/ZESTAW-LILAC_%5B583%5D",
    desc: "Zestaw Lilac - gryzak i zawieszka do smoczka w pastelowym, wrzosowym silikonie i drewnie bukowym. Gotowy prezent na baby shower." },
  { id: "165", name: "ZESTAW LINDEN", price: 86, type: "zestaw", personalization: "brak", colors: ["blekit"],
    path: "/ZESTAW-LINDEN-p165", img: "https://oakandoats.pl/images/cd583/0-1000/Produkt-bez-nazwy_%5B570%5D",
    desc: "Zestaw Linden - flagowa zawieszka i gryzak sensoryczny w naturalnych odcieniach drewna. Podwójne nawlekanie, premium bezpieczeństwo." },
  { id: "158", name: "ZAWIESZKA TILIA", price: 48, type: "zawieszka", personalization: "brak", colors: ["blekit", "neutral"],
    path: "/ZAWIESZKA-TILIA-p158", img: "https://oakandoats.pl/images/cd583/0-1000/ZAWIESZKA-TILIA-COSY-BEIGE_%5B537%5D",
    desc: "Zawieszka do smoczka Tilia - podwójne nawlekanie koralików, certyfikowany silikon i drewno bukowe. Higieniczna, lekka, premium." },
  { id: "152", name: "ZAWIESZKA SUNFLOWER", price: 55, type: "zawieszka", personalization: "brak", colors: ["blekit"],
    path: "/ZAWIESZA-SUNFLOWER-p152", img: "https://oakandoats.pl/images/cd583/0-1000/ZAWIESZA-SUNFLOWER_%5B541%5D",
    desc: "Zawieszka do smoczka Sunflower - kwiatowy wzór z koralików, drewniany klips i sznurek nylonowo-satynowy. Smoczek już nigdy nie spadnie na ziemię." },
  { id: "145", name: "ZAWIESZKA OAT", price: 48, type: "zawieszka", personalization: "brak", colors: ["roz", "neutral"],
    path: "/ZAWIESZKA-OAT-p145", img: "https://oakandoats.pl/images/cd583/0-1000/ZAWIESZKA-OAT_%5B545%5D",
    desc: "Zawieszka do smoczka Oat - geometryczny rytm koralików i surowe drewno bukowe. Minimalistyczny design, pancerne bezpieczeństwo." },
  { id: "137", name: "ZAWIESZKA OAK", price: 48, type: "zawieszka", personalization: "brak", colors: ["blekit"],
    path: "/ZAWIESZKA-OAK-p137", img: "https://oakandoats.pl/images/cd583/0-1000/ZAWIESZKA-OAK_%5B550%5D",
    desc: "Zawieszka do smoczka Oak - klasyczne drewno bukowe i silikon LFGB, mocny klips ze stali nierdzewnej. Smoczek zawsze w zasięgu rączki." },
  { id: "131", name: "GRZECHOTKA SENSORYCZNA RAINBOW", price: 59, type: "grzechotka", personalization: "brak", colors: ["blekit"],
    path: "/GRZECHOTKA-SENSORYCZNA-RAINBOW-p131", img: "https://oakandoats.pl/images/cd583/0-1000/GRYZAK-RAINBOW_%5B555%5D",
    desc: "Gryzak Rainbow - kolorowe koraliki silikonowe i drewniane kółko w nowoczesnym, premium wydaniu. Bezpieczny, ręcznie robiony w Polsce." },
  { id: "127", name: "GRZECHOTKA SENSORYCZNA FLORA", price: 52, type: "grzechotka", personalization: "brak", colors: ["roz"],
    path: "/GRZECHOTKA-SENSORYCZNA-FLORA-p127", img: "https://oakandoats.pl/images/cd583/0-1000/GRYZAK-FLORA_%5B559%5D",
    desc: "Gryzak Flora - pastelowe koraliki i bukowe drewno w kwiatowej, delikatnej kolorystyce. Łagodzi ząbkowanie, wspiera chwyt małych rączek." },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
