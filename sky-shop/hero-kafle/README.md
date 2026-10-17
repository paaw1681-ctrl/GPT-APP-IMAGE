# Oak&Oats: pełnoekranowe hero kafle i obszar edytowalny

Strona główna oakandoats.pl (Sky-Shop, szablon Vouges) według briefu marki v2:
kolejność komunikacji to **kobieta, potem biżuteria, breloki i wristlety, personalizacja, a na końcu linia dziecięca**.

| Plik | Co to jest |
|---|---|
| `obszar-edytowalny.html` | Kod do wklejenia w Sky-Shop (HTML + CSS, bez JavaScriptu). Jedyne źródło prawdy. |
| `podglad.html` | Podgląd z atrapą nagłówka sklepu, generowany skryptem `build-podglad.py`. |
| `img/` | 16 zdjęć w dwóch rozmiarach: `nazwa.jpg` (do 1600 px) i `nazwa-m.jpg` (800 px, telefony). |

## Sekcje

1. **Hero na pełny ekran**: duży kafel z naszyjnikiem (H1 „Noszone blisko”) oraz dwa kafle: breloki/wristlety i linia IMIENNE.
2. **Pas 4 kategorii**: Naszyjniki, Wristlet MAMA, Dodatki do torebki, Dla dziecka (na telefonie siatka 2×2).
3. **Z pracowni**: zdjęcie pracowni i tekst podpisany przez Wiktorię, plus trzy materiały: buk, silikon, imię.
4. **Galeria „Na co dzień”**: 8 kafli przewijanych w poziomie.

## Wdrożenie krok po kroku

1. **Wgraj zdjęcia.** Panel Sky-Shop → menedżer plików → utwórz folder `oo-hero` → wgraj wszystkie pliki z `img/`.
2. **Sprawdź adres.** Otwórz jeden wgrany plik i skopiuj jego URL. Kod zakłada prefiks
   `/userdata/public/assets/oo-hero/`. Jeśli Sky-Shop pokazuje inny, zrób „Znajdź i zamień” tego prefiksu w całym pliku.
3. **Podmień linki** (adresy kategorii z panelu → Kategorie → „Zobacz w sklepie”):

   | W kodzie | Docelowa kategoria |
   |---|---|
   | `/pl/c/naszyjniki` | naszyjniki / biżuteria |
   | `/pl/c/breloki` | breloki, wristlety, dodatki do torebki |
   | `/pl/c/imienne` | linia IMIENNE / personalizacja |
   | `/pl/c/mama` | wristlet / brelok MAMA |
   | `/pl/c/dla-dziecka` | zawieszki, gryzaki, grzechotki, zestawy |
   | `/pl/c/nowosci` | wszystkie produkty |

4. **Wklej kod.** Wygląd → Strona główna → Obszar edytowalny → przełącz edytor na **Źródło** → wklej całość `obszar-edytowalny.html`.
   Zapisz bez przełączania z powrotem na tryb wizualny, bo edytor wizualny może przebudować bloki wewnątrz linków.
5. **Wyłącz stary slider** na stronie głównej, żeby hero był pierwszym elementem pod menu.
6. **Dopasuj wysokość nagłówka.** Hero ma wysokość `100svh - --oo-offset`. Domyślnie 150 px (desktop) i 110 px (telefon).
   Jeśli pod hero widać kawałek następnej sekcji albo hero wychodzi poza ekran, zmień `--oo-offset` w bloku `.oo { … }`.

## Edycja bez programisty

- **Tekst**: zmień go bezpośrednio w HTML. Kursywę w nagłówkach daje `<em>`.
- **Zdjęcie**: podmień nazwę pliku w `src` i `srcset` (oba rozmiary) oraz opis w `alt`.
- **Kadr**: `object-position` przy `.oo-hero__main>img` (np. `42% 30%`) przesuwa kadr w poziomie i pionie.
- **Kolory, fugi, fonty**: zmienne `--oo-…` na górze stylu.

## Źródła zdjęć (Google Drive, folder z grafikami Oak&Oats)

| Plik w `img/` | Oryginał na Drive |
|---|---|
| 01-hero-naszyjnik | Naturalistyczny portret z drewnianym naszyjnikiem.png |
| 02-hero-brelok-torebka | Klucze i kwiatowy brelok nad plecioną torebką.png |
| 03-hero-imienne | Ręcznie robiony brelok ZOSIA na tle drewna i kwiatów.png |
| 10-kat-naszyjniki | Minimalistyczna ekspozycja naszyjników na marmurze.png |
| 11-kat-mama | Bransoletka MAMA w skandynawskim świetle.png |
| 12-kat-breloki | Beżowy brelok MAMA przy torebce.png |
| 13-kat-dziecko | Zestaw dla niemowlaka w neutralnych barwach.png |
| 20-pracownia | image-gen-1(1).png |
| 30-galeria-klucze | Brelok MAMA przy kluczach w dłoni.png |
| 31-galeria-mama-dlon | Brelok MAMA w ciepłym świetle.png |
| 32-galeria-naszyjnik | Minimalistyczny naszyjnik z koralików na marmurze.png |
| 33-galeria-asm | Perłowy brelok z drewnianymi literami ASM.png |
| 34-galeria-kwiaty | Ręcznie wykonane kwiatowe zawieszki z koralików.png |
| 35-galeria-zawieszka | Beżowa torba z koralikowym zawieszeniem.png |
| 36-galeria-naszyjniki-trio | Naturalna kompozycja naszyjników z koralików.png |
| 37-galeria-mama-len | Różowa bransoletka MAMA na lnie.png |

## Do decyzji przed publikacją

- **D03, polityka AI na stronie.** Większość zdjęć to grafiki generowane (portret, pracownia, sceny lifestyle).
  Brand OS V01 mówi, że użycie AI lifestyle/hero na stronie czeka na decyzję D03. Kod pozwala podmienić każde zdjęcie
  na realne ujęcie bez zmian w układzie.
- **Zgodność produktu 1:1.** Przed publikacją Wiktoria powinna porównać produkty na zdjęciach z egzemplarzami
  (liczba koralików, litery, zapięcia), zgodnie z zasadą Product Lock.
- **Claims.** Celowo pominięto certyfikaty (np. LFGB) i obietnice sensoryczne. Brand OS oznacza je jako TO VERIFY.

Po zmianie `obszar-edytowalny.html` odśwież podgląd: `python3 build-podglad.py`.
