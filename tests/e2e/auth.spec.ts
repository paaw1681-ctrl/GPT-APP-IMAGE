import { test, expect } from "@playwright/test";

test.describe("Najważniejszy flow mobilny — dostęp i logowanie", () => {
  test("niezalogowany użytkownik trafia na /logowanie", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/logowanie/);
    await expect(page.getByRole("heading", { name: "Oak & Oats" })).toBeVisible();
  });

  test("formularz logowania jest po polsku i ma pole e-mail", async ({ page }) => {
    await page.goto("/logowanie");
    await expect(page.getByLabel("Adres e-mail")).toBeVisible();
    await expect(page.getByRole("button", { name: "Wyślij link logowania" })).toBeVisible();
  });

  test("email spoza allowlisty pokazuje czytelny komunikat po polsku", async ({ page }) => {
    await page.goto("/logowanie");
    await page.getByLabel("Adres e-mail").fill("ktos-obcy@example.com");
    await page.getByRole("button", { name: "Wyślij link logowania" }).click();
    await expect(page.getByText("Ten adres e-mail nie ma dostępu do tej aplikacji")).toBeVisible();
  });

  test("allowlistowany email pokazuje ekran 'sprawdź skrzynkę'", async ({ page }) => {
    await page.goto("/logowanie");
    await page.getByLabel("Adres e-mail").fill("paaw1681@gmail.com");
    await page.getByRole("button", { name: "Wyślij link logowania" }).click();
    await expect(page.getByText("Sprawdź skrzynkę e-mail")).toBeVisible({ timeout: 15000 });
  });

  test("nieprawidłowy adres e-mail jest walidowany przez przeglądarkę", async ({ page }) => {
    await page.goto("/logowanie");
    const input = page.getByLabel("Adres e-mail");
    await input.fill("nieprawidlowy");
    await page.getByRole("button", { name: "Wyślij link logowania" }).click();
    const isValid = await input.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });
});
