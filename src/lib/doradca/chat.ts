import "server-only";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAiClient } from "@/lib/ai/providers/openai/client";
import { getServerEnv } from "@/lib/env";
import { CATEGORIES, FACTS, PRODUCTS, productById } from "@/lib/doradca/catalog";
import { formatPrice, offlineAnswer, type OfflineReply } from "@/lib/doradca/engine";

export const chatRequestSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(600) }))
    .min(1)
    .max(12)
    .refine((m) => m.length > 0 && m[m.length - 1].role === "user", "Ostatnia wiadomość musi pochodzić od klientki."),
  /** Produkt, który klientka właśnie ogląda (z adresu strony), jeśli jest w katalogu. */
  productId: z.string().max(12).optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

const replySchema = z.object({
  reply: z.string(),
  product_ids: z.array(z.string()).max(3),
  quick_replies: z.array(z.string()).max(3),
});

const CATALOG_TEXT = PRODUCTS.map(
  (p) => `- id ${p.id}: ${p.name}, ${formatPrice(p.price)}, typ: ${p.type}, personalizacja: ${p.personalization}, kolory: ${p.colors.join("/")}. ${p.desc}`,
).join("\n");

const SYSTEM = `Jesteś asystentką zakupową sklepu Oak&Oats (oakandoats.pl) — polskiej manufaktury, która ręcznie robi gryzaki, grzechotki sensoryczne, zawieszki do smoczka (także z imieniem dziecka), zestawy prezentowe i breloki dla mam.
Pomagasz klientce wybrać produkt i kupić go bez wahania. Piszesz po polsku, ciepło, konkretnie i krótko (najwyżej 3 zdania). Bez emoji, bez wykrzykników w każdym zdaniu, bez nachalnej sprzedaży.

ZASADY
- Opierasz się wyłącznie na katalogu i faktach poniżej. Nie wymyślasz cen, terminów wysyłki, kosztów dostawy poza progiem darmowej dostawy, rabatów, opinii ani właściwości zdrowotnych.
- Polecasz najwyżej 3 produkty, podając ich id w product_ids (tylko id z katalogu). W treści odpowiedzi nazwij najlepszy wybór i powiedz w jednym zdaniu dlaczego.
- Gdy brakuje informacji, zadaj jedno pytanie (dla kogo, okazja, imię, budżet, kolor).
- Nie dawaj porad medycznych. Przy pytaniach o bezpieczeństwo przypomnij, że akcesoria dla niemowląt używa się pod nadzorem dorosłego.
- Sprawy zamówień, zwrotów, reklamacji i nietypowych personalizacji kieruj do zakładki „Kontakt”.
- Przedstawiasz się jako asystentka AI sklepu, nie jako konkretna osoba z zespołu.
- quick_replies: do 3 krótkich podpowiedzi następnego pytania klientki (do 40 znaków).

FAKTY
${FACTS.map((f) => `- ${f}`).join("\n")}
- Kategorie: ${Object.entries(CATEGORIES).map(([k, v]) => `${k} ${v}`).join(", ")}.

KATALOG
${CATALOG_TEXT}`;

/**
 * Odpowiedź czatu doradcy. Przy wyłączonym płatnym AI (USE_MOCK_AI / brak
 * ENABLE_PAID_AI) używa silnika reguł, więc widget działa także bez kosztów.
 */
export async function answerChat(req: ChatRequest): Promise<OfflineReply & { source: "ai" | "offline" }> {
  const env = getServerEnv();
  const last = req.messages[req.messages.length - 1].content;
  if (env.USE_MOCK_AI || !env.ENABLE_PAID_AI) return { ...offlineAnswer(last, req.productId), source: "offline" };

  const viewing = req.productId ? productById(req.productId) : undefined;
  const response = await getOpenAiClient().responses.parse({
    model: env.DORADCA_MODEL,
    max_output_tokens: 700,
    input: [
      { role: "system", content: SYSTEM + (viewing ? `\n\nKlientka ogląda teraz: ${viewing.name} (id ${viewing.id}).` : "") },
      ...req.messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    text: { format: zodTextFormat(replySchema, "doradca_reply") },
  });
  const parsed = response.output_parsed;
  if (!parsed) return { ...offlineAnswer(last, req.productId), source: "offline" };
  return {
    reply: parsed.reply,
    productIds: parsed.product_ids.filter((id) => productById(id)).slice(0, 3),
    quickReplies: parsed.quick_replies.map((q) => q.slice(0, 60)).slice(0, 3),
    source: "ai",
  };
}
