import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { BottomNav } from "@/components/BottomNav";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-top sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Oak &amp; Oats
        </Link>
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="hidden sm:inline">{user.displayName ?? user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
