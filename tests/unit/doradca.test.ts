import { describe, it, expect } from "vitest";
import {
  answersFromText,
  checkName,
  complements,
  freeShippingCombo,
  offlineAnswer,
  quizSteps,
  recommend,
} from "@/lib/doradca/engine";
import { FREE_SHIPPING_FROM, PRODUCTS, productById } from "@/lib/doradca/catalog";

describe("quizSteps", () => {
  it("bez odpowiedzi pyta tylko, dla kogo", () => {
    expect(quizSteps({}).map((s) => s.key)).toEqual(["recipient"]);
  });
  it("dla dziecka pyta o potrzebę, imię, budżet i kolor", () => {
    expect(quizSteps({ recipient: "dziecko" }).map((s) => s.key)).toEqual(["recipient", "need", "personalization", "budget", "color"]);
  });
  it("dla mamy proponuje napis MAMA", () => {
    const step = quizSteps({ recipient: "mama" }).find((s) => s.key === "personalization");
    expect(step?.options.map((o) => o.value)).toContain("mama");
  });
});

describe("recommend", () => {
  it("prezent z imieniem do 120 zł daje zestaw z imieniem", () => {
    const recs = recommend({ recipient: "prezent", need: "komplet", personalization: "imie", budget: 120 });
    expect(recs[0].product.type).toBe("zestaw");
    expect(recs[0].product.personalization).toBe("imie");
    expect(recs[0].reasons).toContain("z imieniem dziecka");
  });
  it("dla dziecka nigdy nie proponuje breloka, a dla mamy tylko breloki", () => {
    expect(recommend({ recipient: "dziecko" }, 10).every((r) => r.product.type !== "brelok")).toBe(true);
    expect(recommend({ recipient: "mama" }, 10).every((r) => r.product.type === "brelok")).toBe(true);
  });
  it("dla mamy z napisem MAMA wybiera brelok MAMA", () => {
    expect(recommend({ recipient: "mama", personalization: "mama" })[0].product.personalization).toBe("mama");
  });
  it("budżet do 50 zł stawia na pierwszym miejscu produkt w budżecie", () => {
    const recs = recommend({ recipient: "dziecko", need: "smoczek", budget: 50 });
    expect(recs[0].product.price).toBeLessThanOrEqual(50);
  });
  it("kolor róż podbija produkty w różu", () => {
    expect(recommend({ recipient: "dziecko", need: "zabkowanie", color: "roz" })[0].product.colors).toContain("roz");
  });
});

describe("complements i darmowa dostawa", () => {
  it("do zawieszki imiennej proponuje grzechotkę z imieniem", () => {
    const c = complements("175");
    expect(c[0].type).toBe("grzechotka");
    expect(c[0].personalization).toBe("imie");
  });
  it("uzupełnienie koszyka przekracza próg darmowej dostawy", () => {
    const combo = freeShippingCombo("137");
    expect(combo).not.toBeNull();
    expect(combo!.total).toBeGreaterThanOrEqual(FREE_SHIPPING_FROM);
    expect(combo!.add.id).not.toBe("137");
  });
  it("produkt powyżej progu nie potrzebuje uzupełnienia", () => {
    const expensive = PRODUCTS.find((p) => p.price >= FREE_SHIPPING_FROM);
    if (expensive) expect(freeShippingCombo(expensive.id)).toBeNull();
    expect(productById("nie-ma")).toBeUndefined();
  });
});

describe("checkName", () => {
  it("akceptuje polskie imię do 6 liter", () => {
    const r = checkName("Zośka");
    expect(r.ok).toBe(true);
    expect(r.clean).toBe("ZOŚKA");
  });
  it("odrzuca zbyt długie imię z wyjaśnieniem", () => {
    const r = checkName("Aleksandra");
    expect(r.ok).toBe(false);
    expect(r.message).toContain("10 liter");
  });
  it("usuwa cyfry i znaki", () => {
    expect(checkName("Ola 2!").clean).toBe("OLA");
  });
});

describe("czat offline", () => {
  it("rozpoznaje budżet, okazję i personalizację z pytania", () => {
    expect(answersFromText("Szukam prezentu na chrzciny z imieniem do 120 zł")).toMatchObject({ recipient: "prezent", personalization: "imie", budget: 120 });
  });
  it("odpowiada o długości imienia faktem ze sklepu", () => {
    expect(offlineAnswer("Ile liter zmieści się na zawieszce?").reply).toContain("6 liter");
  });
  it("na stronie produktu podpowiada, co dobrać, z darmową dostawą", () => {
    const r = offlineAnswer("Co do tego dobrać?", "175");
    expect(r.productIds.length).toBeGreaterThan(0);
    expect(r.reply).toContain("ZAWIESZKA CEDAR");
  });
  it("poleca produkty z katalogu", () => {
    const r = offlineAnswer("brelok dla mamy z napisem mama");
    expect(r.productIds.length).toBeGreaterThan(0);
    expect(r.productIds.every((id) => productById(id)?.type === "brelok")).toBe(true);
  });
});

describe("walidacja zapytania czatu", () => {
  it("odrzuca pustą rozmowę i rozmowę zakończoną odpowiedzią asystenta", async () => {
    const { chatRequestSchema } = await import("@/lib/doradca/chat");
    expect(chatRequestSchema.safeParse({ messages: [] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ messages: [{ role: "assistant", content: "hej" }] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ messages: [{ role: "user", content: "Prezent do 100 zł" }], productId: "175" }).success).toBe(true);
  });
});
