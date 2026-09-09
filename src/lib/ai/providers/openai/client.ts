import "server-only";
import OpenAI from "openai";
import { getServerEnv } from "@/lib/env";

let client: OpenAI | null = null;

export function getOpenAiClient(): OpenAI {
  if (client) return client;
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("Brak OPENAI_API_KEY — nie można wywołać realnego API OpenAI.");
  }
  client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}
