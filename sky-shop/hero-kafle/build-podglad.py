# Składa podglad.html z obszar-edytowalny.html (jedno źródło prawdy) + atrapa nagłówka sklepu.
import pathlib
d=pathlib.Path(__file__).parent
snip=(d/'obszar-edytowalny.html').read_text().replace('/userdata/public/assets/oo-hero/','img/')
head='''<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Oak&amp;Oats hero kafle</title>
<style>
:root{--pv-bg:#ffffff;--pv-ink:#2e2924;--pv-bar:#9c8b78;--pv-note:#2e2924;--pv-note-ink:#f8f4ee}
body{background:var(--pv-bg);color:var(--pv-ink)}
.pv-note{background:var(--pv-note);color:var(--pv-note-ink);font:500 12px/1.5 "Jost",system-ui,sans-serif;letter-spacing:.06em;text-align:center;
  padding-block:8px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.pv-head{height:150px;display:grid;grid-template-rows:1fr auto;background:var(--pv-bg)}
.pv-logo{display:grid;place-content:center;text-align:center;font:500 26px/1 "Cormorant Garamond",Georgia,serif;letter-spacing:.18em;color:var(--pv-ink)}
.pv-logo small{display:block;margin-top:6px;font:500 9px/1 "Jost",system-ui,sans-serif;letter-spacing:.5em}
.pv-nav{background:var(--pv-bar);color:#fff;display:flex;flex-wrap:wrap;justify-content:center;gap:6px 28px;font:500 11px/1 "Jost",system-ui,sans-serif;letter-spacing:.2em;
  padding-block:13px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
@media (max-width:760px){.pv-head{height:auto}.pv-logo{padding-block:22px}.pv-nav{gap:8px 16px;font-size:10px}}
</style>
<div class="pv-note">Podgląd obszaru edytowalnego · nagłówek i pasek menu to atrapa szablonu Vouges</div>
<header class="pv-head"><div class="pv-logo">OAK&amp;OATS<small>HANDMADE</small></div>
<nav class="pv-nav"><span>O NAS</span><span>PRODUKTY</span><span>BEZPIECZEŃSTWO</span><span>KONTAKT</span><span>BLOG</span></nav></header>
'''
(d/'podglad.html').write_text(head+snip)
print('ok',len(head+snip))
