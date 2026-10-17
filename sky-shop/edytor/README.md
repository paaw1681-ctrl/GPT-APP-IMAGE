# Edytor strony głównej Oak&Oats

Jeden plik: **`edytor.html`**. Pobierz go i otwórz dwuklikiem w Chrome, Edge albo Safari. Nie potrzeba serwera ani instalacji. Działa też bez internetu, wtedy tylko fonty w podglądzie są zastępcze.

## Co potrafi

- **Podgląd na żywo** w trzech szerokościach: komputer, tablet, telefon. Kliknięcie dowolnego kafla w podglądzie otwiera jego pola.
- **Zdjęcia**: wgraj z dysku albo przeciągnij plik na miniaturę. Możesz też wybrać zdjęcie z biblioteki.
  Kliknięciem na miniaturze ustawiasz punkt ostrości osobno dla komputera i dla telefonu. Możesz też dać osobne zdjęcie na telefon.
- **Sekcje (widgety)**: dodawaj, przestawiaj, duplikuj, ukrywaj i usuwaj.
  - Pełny ekran: *Hero z kafli*, *Hero jednym zdjęciem*
  - Kafle: *Kafle kategorii* (na telefonie siatka, przewijanie albo lista), *Galeria przewijana*
  - Interaktywne: *Zakładki*, *Punkty na zdjęciu* (karta produktu po kliknięciu), *Pytania i odpowiedzi*, *Pasek przewijany*
  - Sprzedaż i zaufanie: *Karty produktów*, *Baner promocyjny*, *Opinie klientek*
  - Treść: *Zdjęcie i tekst*
- **Ustawienia strony**: kolory, fonty, fuga między kaflami, wysokość nagłówka sklepu, adres folderu ze zdjęciami.
- **Cofnij i ponów** (Ctrl+Z, Ctrl+Shift+Z). Praca **zapisuje się sama** w przeglądarce.
  „Projekt → Zapisz plik projektu” przenosi całość razem ze zdjęciami na inny komputer.

Interaktywne widgety działają na samym HTML i CSS, bez JavaScriptu, więc edytor Sky-Shop ich nie wytnie.

## Wysyłka do Sky-Shop

1. Kliknij **Eksport do Sky-Shop**, a potem **Pobierz paczkę ZIP**.
2. Wgraj pliki z folderu `zdjecia` do menedżera plików Sky-Shop.
   Adres folderu ustawiasz w „Ustawienia strony”. Domyślnie to `/userdata/public/assets/oo-hero/`.
3. Skopiuj całość z `obszar-edytowalny.html` i wklej w: Wygląd → Strona główna → Obszar edytowalny → tryb **Źródło**. Zapisz.

Nazwa pliku zdjęcia zawiera skrót jego zawartości. Po podmianie zdjęcia powstaje nowa nazwa, więc przeglądarki klientek nie pokażą starej wersji z pamięci.
Przy kolejnych eksportach możesz zaznaczyć „tylko nowe zdjęcia”.

## Dla programisty

`edytor.src.html` to źródło. Po zmianie zbuduj plik poleceniem `python3 build-edytor.py`. Skrypt wstawia zdjęcia startowe z `../hero-kafle/img/` do `edytor.html`.
