import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getPublicEnv, isEmailAllowed } from "@/lib/env";

const PUBLIC_PATHS = [
  "/logowanie",
  "/auth/callback",
  "/api/auth/request-link",
  "/manifest.webmanifest",
  "/sw.js",
  "/offline.html",
  "/apple-touch-icon.png",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (pathname.startsWith("/icons/")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

/**
 * Odświeża sesję Supabase na każdym żądaniu i chroni trasy aplikacji —
 * niezalogowany albo spoza allowlisty użytkownik trafia na /logowanie
 * (sekcja 5: brak publicznej rejestracji, dostęp tylko dla wskazanych maili).
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const allowed = Boolean(user?.email && isEmailAllowed(user.email));

  if (isPublicPath(pathname)) {
    if (allowed && pathname === "/logowanie") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  if (!allowed) {
    const url = new URL("/logowanie", request.url);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
