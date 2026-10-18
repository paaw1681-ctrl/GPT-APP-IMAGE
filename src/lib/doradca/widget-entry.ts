import { mountDoradca, type DoradcaConfig } from "@/lib/doradca/widget";

/**
 * Punkt wejścia pliku public/doradca.js. Konfiguracja z atrybutów tagu
 * <script data-api="…" data-position="left" data-nudge="false"> albo z window.OODoradcaConfig.
 */
declare global {
  interface Window { OODoradcaConfig?: DoradcaConfig; OODoradca?: { mount: typeof mountDoradca } }
}

const script = document.currentScript as HTMLScriptElement | null;
const data = script?.dataset ?? {};
const cfg: DoradcaConfig = {
  api: data.api || undefined,
  position: data.position === "left" ? "left" : "right",
  nudge: data.nudge !== "false",
  label: data.label || undefined,
  ...window.OODoradcaConfig,
};
window.OODoradca = { mount: mountDoradca };
if (data.manual !== "true") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mountDoradca(cfg));
  else mountDoradca(cfg);
}
