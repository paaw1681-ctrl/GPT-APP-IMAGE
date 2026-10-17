# Składa edytor z edytor.src.html + zdjęcia startowe (../hero-kafle/img/*.jpg bez wersji -m).
# Wynik: edytor.html — jeden plik, który działa po dwukliku (bez serwera).
#   python3 build-edytor.py            -> edytor.html (pełny dokument do otwarcia lokalnie)
#   python3 build-edytor.py --fragment OUT -> sama treść strony (do publikacji jako Artifact)
import base64, json, pathlib, sys

d = pathlib.Path(__file__).resolve().parent
imgs = {}
for p in sorted((d.parent / 'hero-kafle' / 'img').glob('*.jpg')):
    if p.stem.endswith('-m'):
        continue
    imgs[p.stem] = 'data:image/jpeg;base64,' + base64.b64encode(p.read_bytes()).decode()

src = (d / 'edytor.src.html').read_text(encoding='utf-8')
marker = '/*@@IMAGES@@*/{}'
assert src.count(marker) == 1, 'brak znacznika zdjęć'
body = src.replace(marker, json.dumps(imgs))

if len(sys.argv) > 2 and sys.argv[1] == '--fragment':
    pathlib.Path(sys.argv[2]).write_text(body, encoding='utf-8')
    print('fragment', sys.argv[2], len(body))
else:
    full = ('<!doctype html>\n<html lang="pl">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '</head>\n<body>\n' + body + '\n</body>\n</html>\n')
    (d / 'edytor.html').write_text(full, encoding='utf-8')
    print('edytor.html', round(len(full) / 1e6, 2), 'MB,', len(imgs), 'zdjęć')
