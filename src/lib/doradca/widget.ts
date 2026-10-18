import { FREE_SHIPPING_FROM, SHOP_URL, productById, type Product } from "@/lib/doradca/catalog";
import {
  checkName,
  complements,
  formatPrice,
  freeShippingCombo,
  nameProducts,
  offlineAnswer,
  quizSteps,
  recommend,
  type Answers,
  type OfflineReply,
} from "@/lib/doradca/engine";

/**
 * Widget doradcy zakupowego do osadzenia w sklepie Sky-Shop jednym tagiem <script>.
 * Bez zależności, w Shadow DOM (style sklepu go nie psują i on nie psuje sklepu).
 * Trzy narzędzia: quiz doboru, sprawdzenie imienia z podglądem, czat; plus
 * podpowiedź „pasuje do tego” na stronie produktu z wyliczeniem darmowej dostawy.
 */

type ChatMessage = { role: "user" | "assistant"; content: string };
export interface DoradcaConfig {
  /** Adres trasy /api/doradca; bez niego czat odpowiada regułami (offline). */
  api?: string;
  position?: "right" | "left";
  nudge?: boolean;
  label?: string;
  /** Podmiana adresu zdjęcia (np. w podglądzie poza sklepem). */
  imgFor?: (p: Product) => string;
  /** Własna funkcja odpowiedzi czatu (np. w podglądzie). */
  ask?: (messages: ChatMessage[], productId?: string) => Promise<OfflineReply>;
  /** Linki względne (na stronie sklepu) albo pełne (poza sklepem). */
  absoluteLinks?: boolean;
  /** Wymuszenie oglądanego produktu (domyślnie odczytywany z adresu „…-p{ID}”). */
  productId?: string;
}

const STORE_KEY = "oo-doradca";
const store = {
  get<T>(k: string, fallback: T): T {
    try { const v = sessionStorage.getItem(`${STORE_KEY}:${k}`); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
  },
  set(k: string, v: unknown) { try { sessionStorage.setItem(`${STORE_KEY}:${k}`, JSON.stringify(v)); } catch { /* prywatne okno */ } },
};

function track(action: string, extra: Record<string, unknown> = {}) {
  const w = window as unknown as { dataLayer?: unknown[] };
  if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: "oo_doradca", oo_action: action, ...extra });
}

type Attrs = Record<string, string | boolean | ((e: Event) => void) | undefined>;
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: (Node | string | null | false | undefined)[]) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "text") el.textContent = String(v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids) if (kid) el.append(kid);
  return el;
}

const CSS = `
:host{all:initial}
*{box-sizing:border-box}
[hidden]{display:none!important}
.w{--oat:#f6f1ea;--linen:#fbf8f3;--ink:#2e2924;--muted:#6f655c;--clay:#a8796d;--line:#e4dbcf;--taupe:#9c8b78;
  font:15px/1.5 -apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--ink);position:fixed;z-index:2147483000;bottom:max(18px,env(safe-area-inset-bottom));right:max(18px,env(safe-area-inset-right))}
.w.left{right:auto;left:max(18px,env(safe-area-inset-left))}
.serif{font-family:"Playfair Display","Cormorant Garamond",Georgia,serif;font-weight:400}
button{font:inherit;color:inherit;cursor:pointer}
:focus-visible{outline:2px solid var(--clay);outline-offset:2px}
.launch{display:flex;align-items:center;gap:10px;border:0;border-radius:999px;background:var(--ink);color:var(--linen);padding:13px 20px 13px 16px;box-shadow:0 10px 30px rgba(46,41,36,.28);font-size:14px;letter-spacing:.02em}
.launch svg{flex:none}
.launch:hover{transform:translateY(-1px)}
.nudge{position:absolute;bottom:62px;right:0;width:min(330px,calc(100vw - 36px));background:var(--linen);border:1px solid var(--line);border-radius:16px;box-shadow:0 14px 40px rgba(46,41,36,.2);padding:14px;display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center;animation:up .35s ease}
.left .nudge{right:auto;left:0}
.nudge img{width:64px;height:64px;border-radius:10px;object-fit:cover;background:var(--oat)}
.nudge b{display:block;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--clay);font-weight:600}
.nudge p{margin:2px 0 0;font-size:13.5px;line-height:1.35}
.nudge a{color:var(--ink);font-weight:600}
.x{border:0;background:transparent;font-size:20px;line-height:1;color:var(--muted);padding:4px 6px;align-self:start}
.panel{position:absolute;bottom:62px;right:0;width:min(400px,calc(100vw - 36px));height:min(640px,calc(100vh - 110px));background:var(--linen);border:1px solid var(--line);border-radius:20px;box-shadow:0 20px 60px rgba(46,41,36,.25);display:grid;grid-template-rows:auto auto 1fr;overflow:hidden;animation:up .3s cubic-bezier(.2,.7,.2,1)}
.left .panel{right:auto;left:0}
.hd{display:flex;align-items:flex-start;gap:10px;padding:18px 18px 10px}
.hd h2{margin:0;font-size:22px;line-height:1.1}
.hd p{margin:4px 0 0;color:var(--muted);font-size:13px}
.hd .x{margin-left:auto}
.tabs{display:flex;gap:4px;padding:0 14px 10px;border-bottom:1px solid var(--line)}
.tab{flex:1;border:1px solid transparent;background:transparent;border-radius:999px;padding:8px 6px;font-size:13.5px;color:var(--muted)}
.tab[aria-selected="true"]{background:var(--ink);color:var(--linen)}
.body{overflow-y:auto;padding:16px 18px 18px;display:grid;align-content:start;gap:14px}
.prog{display:flex;gap:5px}.prog i{height:3px;flex:1;border-radius:2px;background:var(--line)}.prog i.on{background:var(--clay)}
.q{font-size:21px;line-height:1.2;margin:2px 0 4px}
.opts{display:grid;gap:8px}
.opt{text-align:left;border:1px solid var(--line);background:#fff;border-radius:12px;padding:13px 14px;font-size:15px;transition:border-color .2s,background .2s}
.opt:hover{border-color:var(--ink)}
.link{border:0;background:transparent;color:var(--muted);text-decoration:underline;text-underline-offset:3px;padding:0;font-size:13.5px;justify-self:start}
.card{display:grid;grid-template-columns:78px 1fr;gap:12px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px;color:inherit;text-decoration:none}
.card:hover{border-color:var(--ink)}
.card img{width:78px;height:78px;border-radius:10px;object-fit:cover;background:var(--oat)}
.card>span{display:grid;gap:1px;min-width:0;justify-items:start}
.card b{display:block;font-size:13.5px;letter-spacing:.04em;font-weight:600}
.card .pr{font-size:14px;color:var(--muted);font-variant-numeric:tabular-nums}
.card .why{font-size:12.5px;color:var(--clay);margin-top:2px;line-height:1.35}
.card .go{font-size:12.5px;font-weight:600;margin-top:4px;display:inline-block;border-bottom:1px solid currentColor}
.best{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--clay);font-weight:600}
.combo{background:var(--oat);border-radius:14px;padding:12px 14px;font-size:13.5px;line-height:1.45}
.combo b{font-weight:600}
.field{display:grid;gap:6px}
.field label{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600}
.in{width:100%;border:1px solid var(--line);background:#fff;border-radius:12px;padding:12px 14px;font:500 18px/1.2 inherit;letter-spacing:.24em;text-transform:uppercase;color:var(--ink)}
.msg{font-size:13.5px;color:var(--muted)}.msg.bad{color:#9b3d33}.msg.good{color:#3f6a4b}
.beads{display:flex;align-items:center;justify-content:center;gap:2px;background:var(--oat);border-radius:14px;padding:22px 8px;min-height:78px;overflow:hidden}
.beads .c{width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#e8cfa8,#b88d5c);margin-right:3px;flex:none}
.beads .s{width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#d9cbbb);flex:none}
.beads .l{width:28px;height:28px;border-radius:4px;background:linear-gradient(145deg,#e6c79c,#c99e6c);color:#5b3f27;display:grid;place-items:center;font:600 14px/1 Georgia,serif;flex:none}
.copy{border:1px solid var(--ink);background:var(--ink);color:var(--linen);border-radius:999px;padding:10px 16px;font-size:13.5px;justify-self:start}
.chat{display:grid;gap:10px}
.bub{max-width:88%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap}
.bub.me{justify-self:end;background:var(--ink);color:var(--linen);border-bottom-right-radius:4px}
.bub.ai{justify-self:start;background:#fff;border:1px solid var(--line);border-bottom-left-radius:4px}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 12px;font-size:13px}
.chip:hover{border-color:var(--ink)}
.send{display:grid;grid-template-columns:1fr auto;gap:8px;position:sticky;bottom:0;background:var(--linen);padding-top:6px}
.send input{border:1px solid var(--line);background:#fff;border-radius:999px;padding:11px 15px;font:inherit;font-size:14.5px;color:var(--ink);min-width:0}
.send button{border:0;background:var(--ink);color:var(--linen);border-radius:999px;padding:0 16px;font-size:14px}
.send button:disabled{opacity:.5}
.note{font-size:11.5px;color:var(--muted)}
.dots{display:inline-flex;gap:4px}.dots i{width:6px;height:6px;border-radius:50%;background:var(--taupe);animation:b 1s infinite}.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
@keyframes b{0%,80%,100%{opacity:.3}40%{opacity:1}}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (max-width:520px){
  .w{right:12px;bottom:max(12px,env(safe-area-inset-bottom))}.w.left{left:12px}
  .launch .t{display:none}.launch{padding:14px}
  .panel{position:fixed;left:0;right:0;bottom:0;width:100%;height:min(88vh,720px);border-radius:20px 20px 0 0;border-bottom:0}
  .nudge{position:fixed;left:12px;right:12px;width:auto;bottom:calc(76px + env(safe-area-inset-bottom))}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;

const SPARK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>';

export function mountDoradca(cfg: DoradcaConfig = {}) {
  if (document.getElementById("oo-doradca")) return;
  const host = h("div", { id: "oo-doradca" });
  document.body.append(host);
  const root = host.attachShadow({ mode: "open" });
  root.append(h("style", { text: CSS }));
  const w = h("div", { class: "w" + (cfg.position === "left" ? " left" : "") });
  root.append(w);

  // --- linki do produktów: uczymy się prawdziwych adresów z linków na stronie sklepu ---
  let links: Record<string, string> = {};
  try { links = JSON.parse(localStorage.getItem(`${STORE_KEY}:links`) || "{}"); } catch { /* brak dostępu */ }
  document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
    const m = a.getAttribute("href")!.match(/-p(\d+)(?:[/?#.]|$)/);
    if (m && productById(m[1])) links[m[1]] = new URL(a.href, location.href).pathname;
  });
  try { localStorage.setItem(`${STORE_KEY}:links`, JSON.stringify(links)); } catch { /* brak dostępu */ }
  const href = (p: Product, src: string) => {
    const path = links[p.id] || p.path;
    const url = new URL(cfg.absoluteLinks ? SHOP_URL + path : path, location.href);
    url.searchParams.set("utm_source", "doradca");
    url.searchParams.set("utm_medium", src);
    return url.toString();
  };
  const img = (p: Product) => (cfg.imgFor ? cfg.imgFor(p) : p.img);
  const viewingId = cfg.productId ?? location.pathname.match(/-p(\d+)(?:[/?#.]|$)/)?.[1];
  const viewing = viewingId ? productById(viewingId) : undefined;

  const card = (p: Product, src: string, why?: string[], best?: boolean) =>
    h("a", { class: "card", href: href(p, src), onclick: () => track("product_click", { product_id: p.id, source: src }) },
      h("img", { src: img(p), alt: p.name, loading: "lazy", width: "78", height: "78" }),
      h("span", {},
        best ? h("span", { class: "best", text: "Najlepszy wybór" }) : null,
        h("b", { text: p.name }),
        h("span", { class: "pr", text: formatPrice(p.price) }),
        why && why.length ? h("span", { class: "why", text: why.join(" · ") }) : null,
        h("span", { class: "go", text: "Zobacz produkt" })));

  const comboBox = (p: Product, src: string) => {
    const combo = freeShippingCombo(p.id);
    if (!combo) return null;
    return h("div", { class: "combo" },
      h("b", { text: `Darmowa dostawa od ${FREE_SHIPPING_FROM} zł. ` }),
      `Dobierz ${combo.add.name} (${formatPrice(combo.add.price)}) — razem ${formatPrice(combo.total)} i dostawa gratis. `,
      h("a", { href: href(combo.add, src + "_combo"), onclick: () => track("combo_click", { product_id: combo.add.id }), text: "Zobacz" }));
  };

  // --- przycisk i panel ---
  const launch = h("button", { class: "launch", type: "button", "aria-expanded": "false", "aria-controls": "oo-panel" });
  launch.innerHTML = SPARK;
  launch.append(h("span", { class: "t", text: cfg.label || (viewing ? "Pytania o ten produkt?" : "Pomóc w wyborze?") }));
  launch.setAttribute("aria-label", "Doradca zakupowy Oak&Oats");

  const body = h("div", { class: "body" });
  const tabs: Record<string, HTMLButtonElement> = {};
  const tabBar = h("div", { class: "tabs", role: "tablist" });
  const panel = h("div", { class: "panel", id: "oo-panel", role: "dialog", "aria-label": "Doradca zakupowy", hidden: true },
    h("div", { class: "hd" },
      h("div", {}, h("h2", { class: "serif", text: "Pomogę Ci wybrać" }), h("p", { text: "Dobór w 30 sekund, sprawdzenie imienia i odpowiedzi na pytania." })),
      h("button", { class: "x", type: "button", "aria-label": "Zamknij", onclick: () => toggle(false), text: "×" })),
    tabBar, body);
  w.append(panel, launch);

  let view = store.get<"quiz" | "name" | "chat">("view", "quiz");
  const VIEWS = { quiz: "Dobierz", name: "Imię", chat: "Zapytaj" } as const;
  (Object.keys(VIEWS) as (keyof typeof VIEWS)[]).forEach((k) => {
    tabs[k] = h("button", { class: "tab", type: "button", role: "tab", "aria-selected": String(view === k), onclick: () => show(k), text: VIEWS[k] }) as HTMLButtonElement;
    tabBar.append(tabs[k]);
  });

  function toggle(open?: boolean) {
    const willOpen = open ?? panel.hidden;
    panel.hidden = !willOpen;
    launch.setAttribute("aria-expanded", String(willOpen));
    nudgeBox?.remove();
    if (willOpen) { show(view); track("open", { view }); }
  }
  launch.addEventListener("click", () => toggle());
  root.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Escape" && !panel.hidden) { toggle(false); launch.focus(); } });

  function show(k: keyof typeof VIEWS) {
    view = k; store.set("view", k);
    Object.entries(tabs).forEach(([key, t]) => t.setAttribute("aria-selected", String(key === k)));
    body.replaceChildren();
    if (k === "quiz") renderQuiz();
    if (k === "name") renderName();
    if (k === "chat") renderChat();
  }

  // --- 1. quiz doboru ---
  let answers = store.get<Answers>("answers", {});
  function renderQuiz() {
    const steps = quizSteps(answers);
    const next = steps.find((s) => answers[s.key] === undefined);
    const total = quizSteps({ recipient: answers.recipient ?? "dziecko" }).length;
    const done = steps.filter((s) => answers[s.key] !== undefined).length;
    body.append(h("div", { class: "prog", "aria-hidden": "true" }, ...Array.from({ length: total }, (_, i) => h("i", { class: i < done ? "on" : "" }))));
    if (next) {
      body.append(h("p", { class: "q serif", text: next.question }),
        h("div", { class: "opts" }, ...next.options.map((o) => h("button", { class: "opt", type: "button", text: o.label, onclick: () => {
          answers = { ...answers, [next.key]: o.value };
          if (next.key === "recipient") answers = { recipient: answers.recipient };
          store.set("answers", answers); track("quiz_answer", { step: next.key, value: o.value });
          show("quiz");
        } }))));
      if (done) body.append(h("button", { class: "link", type: "button", text: "← Wstecz", onclick: () => {
        const lastKey = steps.filter((s) => answers[s.key] !== undefined).pop()!.key;
        const copy = { ...answers }; delete copy[lastKey]; answers = copy; store.set("answers", answers); show("quiz");
      } }));
      return;
    }
    const recs = recommend(answers);
    track("quiz_result", { product_ids: recs.map((r) => r.product.id).join(",") });
    body.append(h("p", { class: "q serif", text: recs.length ? "Oto, co polecam" : "Nic nie spełnia wszystkich warunków" }));
    recs.forEach((r, i) => body.append(card(r.product, "quiz", r.reasons, i === 0)));
    if (recs[0]) { const c = comboBox(recs[0].product, "quiz"); if (c) body.append(c); }
    body.append(h("button", { class: "link", type: "button", text: "Zacznij od nowa", onclick: () => { answers = {}; store.set("answers", answers); show("quiz"); } }),
      h("button", { class: "link", type: "button", text: "Mam jeszcze pytanie", onclick: () => show("chat") }));
  }

  // --- 2. imię: sprawdzenie i podgląd ---
  function renderName() {
    const input = h("input", { class: "in", id: "oo-name", maxlength: "14", autocomplete: "off", spellcheck: "false", value: store.get("name", "") }) as HTMLInputElement;
    const msg = h("p", { class: "msg", "aria-live": "polite" });
    const beads = h("div", { class: "beads", "aria-hidden": "true" });
    const copy = h("button", { class: "copy", type: "button", text: "Skopiuj imię", hidden: true }) as HTMLButtonElement;
    const list = h("div", { class: "opts" });
    const update = () => {
      const r = checkName(input.value);
      store.set("name", input.value);
      msg.textContent = input.value ? r.message : "Wpisz imię, a pokażę, jak będzie wyglądać.";
      msg.className = "msg" + (input.value ? (r.ok ? " good" : " bad") : "");
      beads.replaceChildren(h("span", { class: "c" }), h("span", { class: "s" }), h("span", { class: "s" }),
        ...[...(r.clean || "IMIĘ").slice(0, 10)].map((ch) => h("span", { class: "l", text: ch })), h("span", { class: "s" }), h("span", { class: "s" }));
      copy.hidden = !r.ok;
    };
    copy.addEventListener("click", async () => {
      const name = checkName(input.value).clean;
      try { await navigator.clipboard.writeText(name); copy.textContent = "Skopiowano — wklej w opisie zamówienia"; }
      catch { input.select(); copy.textContent = "Zaznaczone — naciśnij Ctrl+C"; }
      track("name_copy", { length: name.length });
    });
    input.addEventListener("input", update);
    nameProducts().forEach((p) => list.append(card(p, "imie", [p.type === "zawieszka" ? "zawieszka do smoczka" : p.type === "grzechotka" ? "grzechotka sensoryczna" : "zestaw: gryzak + zawieszka"])));
    body.append(h("p", { class: "q serif", text: "Sprawdź imię przed zamówieniem" }),
      h("div", { class: "field" }, h("label", { for: "oo-name", text: "Imię dziecka" }), input), msg, beads, copy,
      h("p", { class: "note", text: "Podgląd poglądowy — kolory koralików zależą od wybranego modelu." }),
      h("p", { class: "best", text: "Produkty z imieniem" }), list);
    update();
    setTimeout(() => input.focus(), 30);
  }

  // --- 3. czat ---
  let chat = store.get<ChatMessage[]>("chat", []);
  let busy = false;
  async function ask(messages: ChatMessage[]): Promise<OfflineReply> {
    if (cfg.ask) return cfg.ask(messages, viewing?.id);
    if (!cfg.api) return offlineAnswer(messages[messages.length - 1].content, viewing?.id);
    const r = await fetch(cfg.api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: messages.slice(-10), productId: viewing?.id }) });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      if (r.status === 429) return { reply: j.error || "Za dużo pytań naraz. Spróbuj za kilka minut.", productIds: [], quickReplies: [] };
      return offlineAnswer(messages[messages.length - 1].content, viewing?.id);
    }
    return r.json();
  }
  function renderChat() {
    const list = h("div", { class: "chat", "aria-live": "polite" });
    const chips = h("div", { class: "chips" });
    const input = h("input", { placeholder: "Np. prezent na chrzciny do 120 zł", "aria-label": "Twoje pytanie", maxlength: "500" }) as HTMLInputElement;
    const send = h("button", { type: "submit", text: "Wyślij" }) as HTMLButtonElement;
    const form = h("form", { class: "send" }, input, send);
    const draw = (extraChips: string[] = []) => {
      list.replaceChildren(h("div", { class: "bub ai", text: viewing
        ? `Oglądasz ${viewing.name}. O co chcesz zapytać — personalizację, dobranie pary, a może prezent?`
        : "Dzień dobry! Napisz, dla kogo szukasz i na jaką okazję — podpowiem konkretne produkty." }));
      for (const m of chat) {
        list.append(h("div", { class: `bub ${m.role === "user" ? "me" : "ai"}`, text: m.content }));
        const ids = (m as ChatMessage & { ids?: string[] }).ids;
        if (ids) ids.map(productById).filter((p): p is Product => !!p).forEach((p) => list.append(card(p, "czat")));
      }
      chips.replaceChildren(...(extraChips.length ? extraChips : viewing
        ? ["Co do tego dobrać?", "Ile liter zmieści się na zawieszce?", "Jak dbać o produkt?"]
        : ["Prezent na chrzciny do 120 zł", "Coś na ząbkowanie w różu", "Brelok dla mamy"]).map((q) => h("button", { class: "chip", type: "button", text: q, onclick: () => submit(q) })));
      body.scrollTop = body.scrollHeight;
    };
    async function submit(text: string) {
      if (busy || !text.trim()) return;
      busy = true; send.disabled = true; input.value = "";
      chat.push({ role: "user", content: text.trim() });
      draw([]);
      list.append(h("div", { class: "bub ai" }, h("span", { class: "dots", "aria-label": "Piszę" }, h("i"), h("i"), h("i"))));
      body.scrollTop = body.scrollHeight;
      track("chat_question", { length: text.length });
      try {
        const res = await ask(chat.map(({ role, content }) => ({ role, content })));
        chat.push({ role: "assistant", content: res.reply, ids: res.productIds } as ChatMessage);
        chat = chat.slice(-12); store.set("chat", chat);
        draw(res.quickReplies || []);
      } catch {
        chat.push({ role: "assistant", content: "Nie udało się teraz odpowiedzieć. Spróbuj ponownie albo skorzystaj z zakładki „Dobierz”." });
        draw();
      } finally { busy = false; send.disabled = false; input.focus(); }
    }
    form.addEventListener("submit", (e) => { e.preventDefault(); submit(input.value); });
    body.append(list, chips, form, h("p", { class: "note", text: "Odpowiada asystent AI sklepu na podstawie oferty Oak&Oats. W sprawie zamówień napisz przez zakładkę „Kontakt”." }));
    draw();
  }

  // --- podpowiedź na stronie produktu: „pasuje do tego” + darmowa dostawa ---
  let nudgeBox: HTMLElement | null = null;
  if (viewing && cfg.nudge !== false && !store.get(`nudge-${viewing.id}`, false)) {
    setTimeout(() => {
      if (!panel.hidden) return;
      const pair = complements(viewing.id, 1)[0];
      if (!pair) return;
      const total = viewing.price + pair.price;
      store.set(`nudge-${viewing.id}`, true);
      nudgeBox = h("div", { class: "nudge", role: "status" },
        h("img", { src: img(pair), alt: "", width: "64", height: "64" }),
        h("div", {}, h("b", { text: "Pasuje do tego" }),
          h("p", {}, `${pair.name} · ${formatPrice(pair.price)}`, total >= FREE_SHIPPING_FROM ? ` — razem ${formatPrice(total)}, dostawa gratis. ` : ". ",
            h("a", { href: href(pair, "nudge"), onclick: () => track("nudge_click", { product_id: pair.id }), text: "Zobacz" }))),
        h("button", { class: "x", type: "button", "aria-label": "Zamknij podpowiedź", text: "×", onclick: () => { nudgeBox?.remove(); track("nudge_close"); } }));
      w.prepend(nudgeBox);
      track("nudge_show", { product_id: viewing.id, pair_id: pair.id });
    }, 7000);
  }
}
