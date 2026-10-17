# Edytor strony głównej Oak&Oats

Jeden plik: **`edytor.html`**. Pobierz go i otwórz dwuklikiem w Chrome, Edge albo Safari. Nie potrzeba serwera ani instalacji.

## Punkt wyjścia: obecna strona oakandoats.pl

Edytor startuje od odtworzonej **obecnej** strony głównej. Źródła:
- zrzut strony głównej z audytu,
- kody wklejone wcześniej w Sky-Shop (`oakandoats-kody.pdf`),
- kopia katalogu z Sky-Shop API z 24.08.2026: 23 produkty, ceny, opisy, kategorie i ich adresy.

Sekcje, które dostajesz na start:
- pasek przewijany,
- hero „Oak & Oats”,
- liczby i atuty,
- historie (stories),
- kategorie z prawdziwymi adresami (`/GRYZAKI-c30` …),
- produkty z cenami,
- doradca prezentowy,
- „Dlaczego mamy wybierają Oak&Oats?”,
- podgląd imienia na koralikach,
- baner prezentowy.

Opinie i newsletter są ukryte i czekają na uzupełnienie.

**Wczytaj stronę** wstawia prawdziwą zawartość prosto z kodu źródłowego oakandoats.pl:
1. Otwórz stronę w Chrome i naciśnij Ctrl+U.
2. Skopiuj cały kod (Ctrl+A, Ctrl+C) i wklej go w oknie importu.

Edytor rozpozna hero, kategorie, produkty, nagłówki i zdjęcia. Zdjęcia zostają podlinkowane z Twojego sklepu.

Projekt → „Prototyp z kaflami” wczytuje wcześniejszy projekt w kierunku lifestyle.

## Szablony

Przycisk **Szablony** otwiera wysuwany panel z 10 szablonami:
- Oak&Oats — obecny,
- Atelier Pastel,
- Quiet Luxury,
- Nordic Linen,
- Editorial,
- Terracotta Sun,
- Sage Botanica,
- Gallery White,
- Soft Boutique,
- Heritage Paper.

Kliknięcie przebudowuje stronę: kolory, fonty, przyciski, zaokrąglenia, podpisy kafli, rytm sekcji i układ hero (kafle, pełny ekran albo pół na pół). Teksty, zdjęcia i linki zostają. Każdy element dopracujesz potem ręcznie w „Ustawienia strony”. Cofnij: Ctrl+Z.

## Widgety dla klientek

| Widget | Co robi | Skrypt |
|---|---|---|
| Doradca prezentowy | Dwa pytania (dla kogo, z imieniem czy bez) i od razu pasujące produkty z cenami | nie |
| Podgląd imienia na koralikach | Klientka wpisuje imię i widzi je z bukowych kostek, w wybranej palecie | tak, mały |
| Historie (stories) | Kółka jak na Instagramie, pełnoekranowa historia z przyciskiem | nie |
| Punkty na zdjęciu | Kliknięcie punktu otwiera kartę produktu | nie |
| Zakładki, FAQ, pasek przewijany | Interaktywne panele | nie |
| Karty produktów, liczby i atuty, dlaczego my, baner, tekst, galeria, opinie | Treść i sprzedaż | nie |

Przy kartach produktów, punktach i doradcy jest przycisk **Wybierz produkt z katalogu**. Wypełnia on nazwę, cenę, link i zdjęcie. Ceny pochodzą z kopii katalogu z 24.08.2026, więc sprawdź aktualne w Sky-Shop.

## Generator tekstów

Przy każdym polu tekstowym jest **✨ Napisz**: napisz od nowa, krócej, bardziej elegancko, cieplej, lepiej sprzedaje, pod Google albo własne polecenie. Dostajesz trzy propozycje do wyboru. W każdej sekcji jest też **✨ Napisz teksty całej sekcji**.

Generator zna brief marki v2, katalog produktów i układ strony. Nie wymyśla certyfikatów, cen, terminów ani opinii.
- **Wersja online (link claude.ai):** działa przez Twoje konto Claude, bez klucza.
- **Wersja lokalna:** wpisz klucz API Anthropic w „Ustawienia strony → Generator tekstów”. Klucz zostaje tylko w tej przeglądarce. Model to Claude Opus 5.5.

## Wysyłka do Sky-Shop

1. **Eksport do Sky-Shop** → pobierz ZIP.
2. Wgraj pliki z folderu `zdjecia` do menedżera plików Sky-Shop. Zdjęcia produktów i zdjęcia z importu już są w sklepie, więc kod wskazuje na nie bezpośrednio.
3. Wklej `obszar-edytowalny.html` w: Wygląd → Strona główna → Obszar edytowalny → tryb **Źródło**.

Jeśli Sky-Shop wytnie `<script>`, podgląd imienia pokaże imię startowe bez zmiany na żywo. Pozostałe widgety działają na samym HTML i CSS.

## Do sprawdzenia

- **Adresy produktów** mają format Sky-Shop `/NAZWA-PRODUKTU-p{ID}`. Kopia katalogu nie zawierała linków, więc sprawdź jeden w sklepie.
- **Zdjęcie hero** obecnej strony (mama z dzieckiem) nie było dostępne w plikach. Podmień je przyciskiem „Wgraj z dysku” albo wczytaj stronę przez import.
- **Hasła z obecnej strony** (LFGB, „500+ mam nam ufa”) zostały przeniesione bez zmian. Brand OS oznacza je jako do potwierdzenia.

## Dla programisty

`edytor.src.html` to źródło. Po zmianie zbuduj plik poleceniem `python3 build-edytor.py`. Skrypt wstawia zdjęcia z `../hero-kafle/img/`, wycinki produktów i katalog z `produkty/`.
