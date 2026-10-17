# Składa edytor z edytor.src.html + zdjęcia startowe + katalog produktów.
#   ../hero-kafle/img/*.jpg (bez wersji -m)  -> zdjęcia lifestyle
#   produkty/p{id}.jpg + produkty/produkty.json -> zdjęcia i dane produktów z katalogu Sky-Shop
# Wynik: edytor.html — jeden plik, który działa po dwukliku (bez serwera).
#   python3 build-edytor.py                 -> edytor.html (pełny dokument do otwarcia lokalnie)
#   python3 build-edytor.py --fragment OUT  -> sama treść strony (do publikacji jako Artifact)
import base64, json, pathlib, sys

d = pathlib.Path(__file__).resolve().parent
b64 = lambda p: 'data:image/jpeg;base64,' + base64.b64encode(p.read_bytes()).decode()
imgs = {}
for p in sorted((d.parent / 'hero-kafle' / 'img').glob('*.jpg')):
    if not p.stem.endswith('-m'):
        imgs[p.stem] = b64(p)
for p in sorted((d / 'produkty').glob('p*.jpg')):
    imgs[p.stem] = b64(p)
catalog = json.loads((d / 'produkty' / 'produkty.json').read_text(encoding='utf-8'))

src = (d / 'edytor.src.html').read_text(encoding='utf-8')
for marker, value in (('/*@@IMAGES@@*/{}', imgs), ('/*@@CATALOG@@*/{}', catalog)):
    assert src.count(marker) == 1, 'brak znacznika ' + marker
    src = src.replace(marker, json.dumps(value, ensure_ascii=False))

if len(sys.argv) > 2 and sys.argv[1] == '--fragment':
    pathlib.Path(sys.argv[2]).write_text(src, encoding='utf-8')
    print('fragment', sys.argv[2], len(src))
else:
    full = ('<!doctype html>\n<html lang="pl">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '</head>\n<body>\n' + src + '\n</body>\n</html>\n')
    (d / 'edytor.html').write_text(full, encoding='utf-8')
    print('edytor.html', round(len(full) / 1e6, 2), 'MB,', len(imgs), 'zdjęć,', len(catalog), 'produktów')
