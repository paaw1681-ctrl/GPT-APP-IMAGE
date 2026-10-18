# Składa podglad.html: atrapa karty produktu oakandoats.pl + działający widget doradcy
# (public/doradca.js wklejony w stronę, zdjęcia produktów jako data URI, bo poza sklepem nie ma dostępu do zdjęć z Sky-Shop).
#   python3 build-podglad.py OUT.html
import base64, json, pathlib, sys

root = pathlib.Path(__file__).resolve().parents[2]
widget = (root / 'public' / 'doradca.js').read_text(encoding='utf-8')
imgs = {p.stem[1:]: 'data:image/jpeg;base64,' + base64.b64encode(p.read_bytes()).decode()
        for p in sorted((root / 'sky-shop' / 'edytor' / 'produkty').glob('p*.jpg'))}

page = f'''<title>Doradca Oak&amp;Oats</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Montserrat:wght@400;500&display=swap">
<style>
:root{{--bg:#ffffff;--ink:#2b2622;--muted:#6f655c;--taupe:#a8998a;--oat:#f6f1ea;--line:#e6ddd2}}
body{{background:var(--bg);color:var(--ink);font:15px/1.6 Montserrat,system-ui,sans-serif}}
.note{{background:var(--ink);color:#f8f4ee;text-align:center;font-size:12px;letter-spacing:.04em;padding-block:9px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
header{{text-align:center;padding:26px 16px 18px;font:500 26px/1 "Playfair Display",Georgia,serif;letter-spacing:.2em}}
header small{{display:block;font:500 9px/1 Montserrat,sans-serif;letter-spacing:.5em;margin-top:8px}}
nav{{background:var(--taupe);color:#fff;display:flex;flex-wrap:wrap;justify-content:center;gap:6px 26px;font:500 11px/1 Montserrat,sans-serif;letter-spacing:.2em;padding-block:13px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
main{{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(24px,5vw,64px);padding-block:clamp(28px,5vw,56px);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
.ph{{background:var(--oat);aspect-ratio:1;display:grid;place-items:center;overflow:hidden}}
.ph img{{width:100%;height:100%;object-fit:cover}}
.crumb{{font-size:12px;color:var(--muted);letter-spacing:.06em}}
h1{{font:400 clamp(28px,4vw,40px)/1.1 "Playfair Display",Georgia,serif;margin:10px 0 8px;letter-spacing:.02em}}
.price{{font-size:20px;margin:0 0 18px}}
.desc{{color:var(--muted);max-width:34em}}
.opt label{{display:block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:18px 0 6px}}
.opt input{{width:100%;max-width:320px;border:1px solid var(--line);padding:12px 14px;font:inherit}}
.buy{{margin-top:20px;border:0;background:var(--ink);color:#fff;padding:15px 28px;font:500 12px/1 Montserrat,sans-serif;letter-spacing:.2em;text-transform:uppercase}}
.facts{{margin:22px 0 0;padding:16px 0 0;border-top:1px solid var(--line);list-style:none;display:grid;gap:6px;font-size:13.5px;color:var(--muted)}}
@media (max-width:760px){{main{{grid-template-columns:minmax(0,1fr)}}}}
</style>
<div class="note">Podgląd doradcy na atrapie strony produktu. W sklepie wygląda i działa tak samo. Czat w podglądzie odpowiada regułami bez AI.</div>
<header>OAK &amp; OATS<small>HANDMADE</small></header>
<nav><span>O NAS</span><span>PRODUKTY</span><span>BEZPIECZEŃSTWO</span><span>KONTAKT</span><span>BLOG</span></nav>
<main>
  <div class="ph"><img src="{imgs['175']}" alt="Zawieszka do smoczka CEDAR z imieniem"></div>
  <div>
    <div class="crumb">ZAWIESZKI DO SMOCZKA · PERSONALIZOWANE</div>
    <h1>ZAWIESZKA CEDAR</h1>
    <p class="price">59,00 zł</p>
    <p class="desc">Imię dziecka z bukowych literek, nawleczonych jedna po drugiej. Zawieszka zgodna z EN 12586 — długość sznurka mierzona pod naciągiem.</p>
    <div class="opt"><label for="nm">Imię dziecka</label><input id="nm" placeholder="np. ZOSIA" maxlength="6"></div>
    <button class="buy" type="button">Dodaj do koszyka</button>
    <ul class="facts"><li>Do 6 znaków, długość dopasowana do imienia</li><li>Darmowa dostawa od 150 zł</li><li>Ręcznie robione w Polsce</li></ul>
  </div>
</main>
<script>
window.OODoradcaConfig = {{ productId: "175", absoluteLinks: true, imgFor: function (p) {{ return IMGS[p.id] || p.img; }} }};
var IMGS = {json.dumps(imgs)};
</script>
<script>{widget}</script>
'''
pathlib.Path(sys.argv[1]).write_text(page, encoding='utf-8')
print('podglad', sys.argv[1], len(page))
