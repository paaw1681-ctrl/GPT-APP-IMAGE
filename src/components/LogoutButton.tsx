"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="text-sm text-muted underline-offset-2 hover:underline"
      onClick={async () => {
        await createSupabaseBrowserClient().auth.signOut();
        router.push("/logowanie");
        router.refresh();
      }}
    >
      Wyloguj
    </button>
  );
}
