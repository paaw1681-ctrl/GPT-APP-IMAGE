"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const ERROR_MESSAGES: Record<string, string> = {
  brak_dostepu: "Ten adres e-mail nie ma dostępu do aplikacji.",
  nieprawidlowy_link: "Link logowania wygasł albo jest nieprawidłowy. Poproś o nowy.",
  brak_kodu: "Link logowania jest niekompletny. Poproś o nowy.",
  link_wygasl: "Ten link logowania już wygasł albo został wcześniej użyty. Poproś o nowy poniżej i kliknij go od razu po otrzymaniu.",
};

function LoginForm() {
  const params = useSearchParams();
  const urlError = params.get("blad");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(
    urlError ? (ERROR_MESSAGES[urlError] ?? "Wystąpił błąd logowania.") : null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Nie udało się wysłać linku.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setError("Brak połączenia z internetem. Spróbuj ponownie.");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Oak &amp; Oats</h1>
        <p className="mt-1 text-muted">Image Studio</p>
      </div>

      <Card className="w-full max-w-sm">
        {status === "sent" ? (
          <div className="py-4 text-center">
            <p className="text-base font-medium">Sprawdź skrzynkę e-mail</p>
            <p className="mt-2 text-sm text-muted">
              Wysłaliśmy link logowania na adres <strong>{email}</strong>. Otwórz go na tym urządzeniu.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Adres e-mail</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="ty@oakandoats.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={status === "loading"}>
              Wyślij link logowania
            </Button>
            <p className="text-center text-xs text-muted">
              Dostęp tylko dla zespołu Oak &amp; Oats — bez hasła, przez magic link.
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
