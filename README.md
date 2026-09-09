# Oak & Oats Image Studio

Wewnętrzna aplikacja PWA dla zespołu Oak & Oats (Paweł + Wiktoria) do tworzenia
wybitnie realistycznych zdjęć produktowych na podstawie prawdziwych zdjęć
referencyjnych — bez pisania promptów. Użytkownik wrzuca zdjęcia produktu,
potwierdza „co to jest” i „dla kogo”, wybiera typ fotografii, dostaje
propozycję AI, generuje tani prototyp, zatwierdza kierunek, a na końcu
profesjonalny final z automatyczną kontrolą jakości (Quality Gate).

## Stack

- **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript**
- **Tailwind CSS v4**
- **Supabase**: PostgreSQL, Auth (magic link), Storage (prywatny bucket)
- **OpenAI**: Responses API (structured outputs, vision, web search) + Images API
  (rodzina GPT Image — `gpt-image-2.5-flare` do prototypów, `gpt-image-2.5-sunburst`
  do finałów)
- **sharp** + **heic-convert** — pipeline referencji (EXIF, sRGB, HEIC z iPhone'a)
- **Vercel** — hosting docelowy
- **PWA** — manifest, service worker, instalacja na iPhone/Windows

## Architektura w skrócie

- `src/lib/ai/` — abstrakcja providerów (`TextVisionProvider`, `ImageProvider`,
  `CriticProvider`) + Model Router (`router.ts`), który czyta konfigurację modeli
  z tabel `model_catalog` / `routing_policies` w bazie. Provider mock (domyślny)
  i provider OpenAI implementują te same interfejsy — dodanie kolejnego dostawcy
  (np. Anthropic jako `CriticProvider`) nie wymaga zmian w resztach aplikacji.
- `src/lib/prompt/` — modułowy Prompt Engine (moduły A–J, sekcja 24 specyfikacji),
  deterministyczny budowniczy promptu + loader wersji z bazy (`prompt_modules`,
  `prompt_versions`) i Rule Packów (`product_rule_packs`).
- `src/lib/cost/` — estymator kosztu (przed requestem) i ledger (po requeście),
  oparty o `model_catalog` (ceny edytowalne w panelu admina, nigdy zaszyte w kodzie)
  oraz strażnik budżetu (`budget.ts`).
- `src/lib/currency/nbp.ts` — kurs USD/PLN z NBP, cache w tabeli `currency_rates`,
  nigdy nie blokuje generacji przy niedostępności NBP.
- `src/lib/images/pipeline.ts` — EXIF-orientacja, konwersja HEIC/HEIF, sRGB,
  usuwanie prywatnych metadanych (GPS), trzy warstwy: working / preview / original.
- `src/lib/generation/` — kontekst generacji, ochrona przed podwójnym rachunkiem
  (idempotency key + unique constraint w bazie), historia scen (anti-repetition).
- `supabase/migrations/` — pełny schemat, RLS, seed konfiguracji Oak & Oats.

## Uruchomienie lokalne

```bash
npm install
cp .env.example .env.local   # uzupełnij zgodnie z sekcją "Zmienne środowiskowe"
npm run dev
```

Aplikacja domyślnie działa w **trybie mock** (`USE_MOCK_AI=true`,
`ENABLE_PAID_AI=false`) — cały flow (upload, analiza, koncepcja, prototyp,
final, Quality Gate, koszty, feedback, content studio, admin) działa bez
żadnego klucza OpenAI i bez ponoszenia kosztów.

### Wymagane minimum do uruchomienia

Nawet w trybie mock potrzebujesz prawdziwego projektu Supabase — Auth i baza
danych nie są mockowane (tylko wywołania AI są).

1. Utwórz projekt Supabase (patrz niżej).
2. Zastosuj migracje z `supabase/migrations/`.
3. Ustaw `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_USER_EMAILS`.

## Tryb mock (sekcja 69 zadania)

`USE_MOCK_AI=true` + `ENABLE_PAID_AI=false` (domyślne wartości) sprawiają, że:

- Product Analyzer zwraca deterministyczny, sensowny profil produktu.
- Concept Engine proponuje pomysł na podstawie prostej heurystyki (bez kosztu).
- Generator obrazów renderuje placeholder PNG (etykieta PROTOTYP/FINAL, kolor
  zależny od promptu) zamiast wywoływać OpenAI — cały pipeline (storage,
  galeria, Quality Gate, koszty = 0 zł) działa identycznie jak z prawdziwym API.
- Quality Gate zwraca optymistyczny, ale realistyczny wynik.
- Trend Radar i Content Studio zwracają przykładowe dane.

## Włączenie płatnego AI

1. Ustaw `OPENAI_API_KEY` (Vercel → Environment Variables, **nigdy** w kodzie).
2. Ustaw `USE_MOCK_AI=false` i `ENABLE_PAID_AI=true`.
3. Router modeli automatycznie przełączy się na realne modele wskazane w
   tabeli `routing_policies` (kolumna `fallback_model_catalog_id`) — domyślnie:
   `gpt-5.4-mini`/`gpt-5.2` do analizy i tekstu, `gpt-image-2.5-flare` do
   prototypów, `gpt-image-2.5-sunburst` do finałów, `gpt-5.2` do Quality Gate
   i Trend Radaru (z narzędziem `web_search`).
4. Ceny w `model_catalog` dla nowych modeli obrazu są **orientacyjne** —
   zweryfikuj je w panelu `/admin/modele` względem aktualnego cennika OpenAI
   przed produkcyjnym użyciem (kolumna `source_url` wskazuje dokumentację).

`ENABLE_PAID_AI=false` to twardy bezpiecznik: nawet z poprawnym kluczem
OpenAI w środowisku, żadne płatne wywołanie się nie wykona.

## Zmienne środowiskowe

Pełna lista z opisem w `.env.example`. Skrót:

| Zmienna | Gdzie ustawić | Opis |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | URL projektu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | Publiczny klucz anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (Production + Preview) | **Sekret** — Supabase → Project Settings → API |
| `OPENAI_API_KEY` | Vercel (dopiero przy włączaniu paid AI) | **Sekret** — platform.openai.com |
| `USE_MOCK_AI` | Vercel + `.env.local` | `true`/`false` |
| `ENABLE_PAID_AI` | Vercel + `.env.local` | `true`/`false` |
| `ALLOWED_USER_EMAILS` | Vercel + `.env.local` | Lista e-maili po przecinku |
| `APP_BASE_URL` | Vercel + `.env.local` | Publiczny adres aplikacji |
| `CRON_SECRET` | Vercel (opcjonalnie) | Ochrona endpointów cron |

## Konfiguracja Supabase

1. Utwórz projekt na [supabase.com](https://supabase.com) (region blisko Polski,
   np. Frankfurt).
2. Zastosuj migracje z `supabase/migrations/` w kolejności nazw plików —
   przez Supabase CLI (`supabase link` + `supabase db push`) albo ręcznie w
   SQL Editorze. Migracje tworzą pełny schemat, RLS oraz seed: workspace
   „Oak & Oats”, domyślne kategorie produktów, konteksty odbiorcy, Rule Packi,
   moduły promptu A–J, katalog modeli (mock + OpenAI) i politykę routingu.
3. W Supabase Auth ustaw **Site URL** i **Additional Redirect URLs** na adres
   aplikacji (np. `https://twoja-domena.vercel.app` i `http://localhost:3000`)
   — inaczej magic link nie zadziała.
4. Storage: migracja tworzy prywatny bucket `oakoats` z politykami RLS
   (dostęp tylko dla zalogowanych). Aplikacja generuje signed URLs po stronie
   serwera — żaden plik nie jest publicznie dostępny.

## Ustawienie dwóch użytkowników

Aplikacja NIE ma publicznej rejestracji. Dostęp mają wyłącznie adresy e-mail
wymienione w `ALLOWED_USER_EMAILS`. Przy pierwszym logowaniu (magic link)
użytkownik jest automatycznie dopisywany do wspólnego workspace „Oak & Oats”
— oboje widzą te same produkty, sesje, koszty i galerię.

Aby dodać/zmienić dostęp: edytuj `ALLOWED_USER_EMAILS` w Vercel i zrestartuj
deployment.

## Budżet

`/ustawienia` → limit miesięczny w PLN, próg twardego limitu (blokuje nowe
płatne generacje po przekroczeniu), ręczny override. Dashboard pokazuje
koszt dzisiaj/w tym miesiącu. Panel `/admin/metryki` pokazuje najważniejszą
metrykę: **koszt na zaakceptowany final** (nie koszt na generację — tańszy
model wymagający wielu prób bywa droższy w praktyce).

## Pierwszy realny test

1. Zaloguj się allowlistowanym adresem (magic link).
2. „+ Nowy produkt” → wrzuć 1–5 zdjęć prawdziwego produktu → „Analizuj produkt”.
3. Sprawdź/popraw kategorię i „dla kogo” → „Zapisz produkt”.
4. „Generuj zdjęcie” → wybierz typ fotografii → „Zaproponuj / generuj” →
   „Generuj prototyp” (w trybie mock: 0 zł).
5. Oceń wynik, „Finalizuj” → sprawdź ocenę Quality Gate → pobierz zdjęcie.
6. Opcjonalnie „Przygotować również opis?” → wybierz kanał.

Dopiero po przejściu tej ścieżki z realnym kluczem OpenAI (`ENABLE_PAID_AI=true`)
warto ocenić rzeczywistą jakość generacji.

## Architektura Prompt Engine

Prompt do modelu obrazu jest składany deterministycznie z 10 modułów (A–J),
przechowywanych i wersjonowanych w bazie (`prompt_modules`, `prompt_versions`):

`A` Hard Product Identity Lock → `B` Product Rule Pack → `C` Photo Type Rules →
`D` Audience/Usage Context → `E` Photographic Realism → `F` Selected Scenario →
`G` Anti-Repetition → `H` Purpose/Aspect Rules → `I` User Optional Note →
`J` Final Validation Reminder.

Każda generacja zapisuje finalny snapshot promptu do `generation_jobs.prompt_snapshot`
— widoczny wyłącznie w panelu admina (`Debug`/`Product Lock JSON`), zwykły
użytkownik go nie widzi. Zmiana modułu tworzy nowy draft; publikacja wersji
promptu archiwizuje poprzednią (rollback zawsze możliwy).

## Model Routing

Każda „rola” AI (`product_analysis`, `scenario`, `prompt_builder`,
`prototype_image`, `final_image`, `quality_gate`, `trend_research`, `content`)
ma wpis w `routing_policies`, wskazujący model z `model_catalog`. Router
(`src/lib/ai/router.ts`) wybiera provider mock/OpenAI na podstawie
`USE_MOCK_AI`/`ENABLE_PAID_AI` i potrafi eskalować do mocniejszego modelu tej
samej roli (np. przy niskim confidence analizy produktu albo wyniku Quality
Gate blisko progu — sekcja 36/62 specyfikacji).

## Trend Radar

Uruchamiany wyłącznie ręcznie z panelu `/admin/trend-radar` (albo przez
zewnętrzny harmonogram wywołujący `POST /api/admin/trend-radar/run`, np.
Vercel Cron) — nigdy przy każdej generacji. Wyniki (punkty + źródła) trafiają
do Concept Engine jako kontekst, nigdy nie wpływają na konstrukcję produktu.

## Test Lab

`/admin/test-lab` pozwala zaplanować porównanie A/B (dwie wersje promptu,
dwa modele) z widocznym kosztorysem przed uruchomieniem. Żadna strona testu
nie odpala się automatycznie — każdą stronę generujesz świadomo w generatorze
(z parametrem `promptVersionOverride`), a wynik (lepsze A/B/remis) zapisujesz
ręcznie.

## Bezpieczeństwo

- Żaden sekret (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`) nie trafia do
  bundla klienta — używane tylko w kodzie server-only (`import "server-only"`
  wymusza błąd builda przy próbie importu z komponentu klienckiego).
- RLS na każdej tabeli — dostęp tylko dla członków workspace „Oak & Oats”
  (zweryfikowane bezpośrednio w Postgresie: nieautoryzowany `authenticated`
  użytkownik widzi 0 wierszy w `products`/`workspaces`).
- Storage: prywatny bucket, signed URLs generowane server-side, ważne 1h.
- Upload: walidacja MIME (JPEG/PNG/WebP/HEIC/HEIF), limit 25 MB/plik, limit
  5 referencji/produkt.
- Idempotency: każdy płatny request generacji ma unikalny klucz
  (`generation_jobs.idempotency_key`, unique constraint w bazie) — podwójne
  tapnięcie zwraca istniejący job zamiast tworzyć drugi płatny request.
- Allowlist e-maili + magic link (bez haseł, bez publicznej rejestracji).

## Testy

```bash
npm run lint        # ESLint
npm run typecheck    # tsc --noEmit
npm run test          # Vitest — prompt builder, cost estimator, budget, idempotency
npm run build          # produkcyjny build Next.js
npm run test:e2e        # Playwright (wymaga uruchomionego npm run dev)
```

## Deployment

### Vercel

1. Zaimportuj repozytorium w Vercel.
2. Ustaw zmienne środowiskowe (patrz tabela wyżej) dla Production i Preview.
3. Deploy — build command `next build` (domyślny).

### Znane ograniczenia / uwagi produkcyjne

- Generacja finalna (obraz + Quality Gate, opcjonalnie drugi przebieg) działa
  synchronicznie w jednym żądaniu API (`maxDuration = 300`) — nie ma osobnej
  infrastruktury kolejkowej. Dla dwóch użytkowników i typowego wolumenu to
  wystarczający, prostszy i bardziej niezawodny mechanizm niż zewnętrzna
  kolejka (sekcja 47 zadania). Endpoint `GET /api/jobs/[id]` wykrywa i
  oznacza jako `failed` zadania utknięte w `processing` dłużej niż 4 minuty.
- Ceny modeli obrazu (`gpt-image-2.5-flare`/`sunburst`) w `model_catalog` są
  orientacyjne — zweryfikuj je w panelu admina przed produkcyjnym użyciem.
