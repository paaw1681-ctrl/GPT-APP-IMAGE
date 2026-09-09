"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPwaHint() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(true);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Odczyt stanu przeglądarki (display-mode, navigator.onLine) możliwy tylko po zamontowaniu na kliencie.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);
    setOnline(navigator.onLine);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <>
      {!online && (
        <Card className="border-warning/30 bg-warning-bg text-sm text-warning">
          Brak połączenia z internetem. Generowanie zdjęć wymaga internetu — spróbuj ponownie, gdy wrócisz online.
        </Card>
      )}
      {!standalone && deferred && (
        <Card className="flex items-center justify-between text-sm">
          <span>Dodaj Oak &amp; Oats do ekranu głównego dla szybszego dostępu.</span>
          <button
            className="font-medium text-primary"
            onClick={async () => {
              await deferred.prompt();
              setDeferred(null);
            }}
          >
            Zainstaluj
          </button>
        </Card>
      )}
    </>
  );
}
