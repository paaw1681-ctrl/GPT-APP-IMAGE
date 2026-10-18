import { getServerEnv } from "@/lib/env";
import { answerChat, chatRequestSchema } from "@/lib/doradca/chat";
import { offlineAnswer } from "@/lib/doradca/engine";

/** Prosty limit zapytań na instancję: chroni budżet AI przed zalewem z jednego adresu. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = getServerEnv().DORADCA_ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && allowed.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

const json = (body: unknown, status: number, origin: string | null) =>
  Response.json(body, { status, headers: corsHeaders(origin) });

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

/** Czat doradcy zakupowego dla widgetu w sklepie oakandoats.pl (publiczny, bez logowania). */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return json({ error: "Za dużo pytań naraz. Spróbuj za kilka minut." }, 429, origin);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Niepoprawne zapytanie." }, 400, origin);
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Niepoprawne zapytanie." }, 400, origin);

  try {
    return json(await answerChat(parsed.data), 200, origin);
  } catch (err) {
    console.error("doradca", err);
    const last = parsed.data.messages[parsed.data.messages.length - 1].content;
    return json({ ...offlineAnswer(last, parsed.data.productId), source: "offline" }, 200, origin);
  }
}
