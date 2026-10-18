// Buduje public/doradca.js — widget doradcy zakupowego dla sklepu Sky-Shop.
// Uruchom: npm run build:doradca
import { build } from "esbuild";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
await build({
  entryPoints: [path.join(root, "src/lib/doradca/widget-entry.ts")],
  outfile: path.join(root, "public/doradca.js"),
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  alias: { "@": path.join(root, "src") },
  banner: { js: "/* Oak&Oats — doradca zakupowy. Źródło: src/lib/doradca/. */" },
  legalComments: "none",
});
console.log("public/doradca.js gotowy");
