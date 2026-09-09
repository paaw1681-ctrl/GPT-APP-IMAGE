"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Rejestracja SW nie jest krytyczna dla działania aplikacji — cicho ignorujemy błąd.
      });
    }
  }, []);
  return null;
}
