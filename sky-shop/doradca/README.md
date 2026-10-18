# Doradca zakupowy Oak&Oats

Widget na każdej stronie oakandoats.pl, który pomaga klientce wybrać i kupić. Sky-Shop dostaje jedną linijkę kodu.

## Co dostaje klientka

| Narzędzie | Jak pomaga kupić |
|---|---|
| **Dobierz** (quiz, 30 sekund) | 4–5 pytań: dla kogo, czego potrzebuje, czy z imieniem, budżet, kolory. Wynik to 3 produkty z ceną i powodem („z imieniem dziecka · mieści się w budżecie do 120 zł · w odcieniach różu”) oraz propozycja dobrania drugiego produktu do darmowej dostawy od 150 zł. |
| **Imię** | Sprawdza imię przed zamówieniem: litery i limit 6 znaków, z jasnym komunikatem. Pokazuje podgląd na bukowych kostkach i przycisk „Skopiuj imię” do wklejenia w zamówieniu. Pod spodem są produkty, na których można umieścić imię. |
| **Zapytaj** (czat) | Odpowiada na pytania o dobór, prezenty, liczbę liter, pielęgnację, materiały i dostawę. Pod odpowiedzią pokazuje karty produktów. Sprawy zamówień kieruje do zakładki Kontakt. |
| **Pasuje do tego** (strona produktu) | Po 7 sekundach na karcie produktu pokazuje raz na sesję produkt, który się z nim łączy, np. grzechotkę z imieniem do zawieszki z imieniem. Jeśli razem przekraczają 150 zł, dopisuje „razem X zł, dostawa gratis”. |

Każde kliknięcie produktu ma w adresie `utm_source=doradca`, więc w GA4 widać sprzedaż z doradcy.
Jeśli na stronie działa `dataLayer` (GTM), widget wysyła zdarzenia `oo_doradca`: otwarcie, odpowiedzi w quizie, wynik, kliknięcia produktów, podpowiedzi i pytania w czacie.

## Jak to działa

```
oakandoats.pl ── <script src=".../doradca.js"> ── quiz, imię, podpowiedzi: w przeglądarce, bez kosztów
                                     └── czat ── POST /api/doradca (aplikacja na Vercel)
                                                   ├─ płatne AI wyłączone → odpowiedzi z reguł (0 zł)
                                                   └─ ENABLE_PAID_AI=true → model OpenAI z katalogiem i faktami sklepu
```

- **Silnik doboru** to `src/lib/doradca/engine.ts`. Ten sam kod działa w widgecie i na serwerze, więc quiz, czat bez AI i czat z AI polecają według tych samych reguł. Silnik ma 18 testów (`tests/unit/doradca.test.ts`).
- **Katalog** to `src/lib/doradca/catalog.ts`: 23 widoczne produkty z kopii Sky-Shop API z 24.08.2026, z ręcznie oznaczonym typem, personalizacją i kolorami. Fakty, na które czat może się powoływać, są w tablicy `FACTS`. Czat nie wymyśla cen, terminów, rabatów ani opinii.
- **Czat z AI** korzysta z tego samego klucza OpenAI i bezpiecznika `ENABLE_PAID_AI` co Studio. Domyślny model to `gpt-5.4-mini`, a odpowiedź ma najwyżej 700 tokenów. Limit to 30 pytań na 10 minut z jednego adresu. Gdy model zawiedzie, odpowiadają reguły.
- **Linki do produktów:** widget sam uczy się prawdziwych adresów z linków na stronach sklepu. Do tego czasu używa formatu `/NAZWA-p{ID}`.

## Wdrożenie

1. **Wypchnij aplikację na Vercel** (ten sam projekt co Studio). Plik widgetu będzie pod `https://TWOJA-APLIKACJA.vercel.app/doradca.js`, a czat pod `/api/doradca`. Obie ścieżki są publiczne i ominięte w `src/proxy.ts`.
2. **Sky-Shop** → Ustawienia → własny kod HTML/JS w stopce (przed `</body>`). Wklej:

   ```html
   <script src="https://TWOJA-APLIKACJA.vercel.app/doradca.js"
           data-api="https://TWOJA-APLIKACJA.vercel.app/api/doradca" defer></script>
   ```

   Opcje: `data-position="left"` (przycisk po lewej), `data-nudge="false"` (bez podpowiedzi na stronie produktu), `data-label="Pomóc w wyborze?"`.
   Bez `data-api` czat działa na samych regułach.
3. **Czat z AI** (opcjonalnie): w Vercel ustaw `ENABLE_PAID_AI=true`, `USE_MOCK_AI=false` i `OPENAI_API_KEY`. Studio robi to samo. Jeśli sklep działa też pod inną domeną, dopisz ją w `DORADCA_ALLOWED_ORIGINS`.
4. **Sprawdź na sklepie:** otwórz kartę produktu i poczekaj 7 sekund na podpowiedź. Przejdź quiz i kliknij produkt. Adres powinien otworzyć właściwą kartę.

## Aktualizacja oferty

Po zmianie cen albo dodaniu produktu popraw `src/lib/doradca/catalog.ts` (cena, typ, personalizacja, kolory, zdjęcie), a potem:

```bash
npm test
npm run build:doradca      # przebudowuje public/doradca.js
```

Podgląd na atrapie strony: `python3 sky-shop/doradca/build-podglad.py podglad.html`.
