"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const ERROR_MESSAGES: Record<string, string> = {
  brak_dostepu: "Ten adres e-mail nie ma dostępu do aplikacji.",
  nieprawidlowy_link: "Poprzedni link był nieprawidłowy. Zaloguj się hasłem.",
  brak_kodu: "Zaloguj się adresem e-mail i hasłem.",
  link_wygasl: "Poprzedni link wygasł. Zaloguj się hasłem.",
};

function LoginForm() {
  const params = useSearchParams();
  const urlError = params.get("blad");
  const [email, setEmail] = useState("paaw1681@gmail.com");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(
    urlError ? (ERROR_MESSAGES[urlError] ?? "Wystąpił błąd logowania.") : null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Nie udało się zalogować.");
        return;
      }

      window.location.assign("/");
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Adres e-mail</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={status === "loading"}>
            Zaloguj się
          </Button>
          <p className="text-center text-xs text-muted">
            Dostęp tylko dla zespołu Oak &amp; Oats.
          </p>
        </form>
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
