import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const env = getPublicSupabaseEnv();

  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: Avoid running logic between createServerClient and getUser().
  // Always use getUser() instead of getSession() to guarantee token freshness.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  const isMfaRoute = pathname === "/mfa-verify";

  // Protected application routes requiring complete authentication
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/directory") ||
    pathname.startsWith("/dues");

  const createRedirect = (targetUrl: URL) => {
    const redirectResponse = NextResponse.redirect(targetUrl);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    }
    return redirectResponse;
  };

  // If unauthenticated user tries to hit protected route or MFA route, forward to login
  if (!user && (isMfaRoute || isProtectedRoute)) {
    const loginUrl = new URL("/login", request.url);
    if (isProtectedRoute) {
      loginUrl.searchParams.set("returnTo", pathname + (url.search || ""));
    }
    return { response: createRedirect(loginUrl), user: null };
  }

  // If user is authenticated, enforce AAL2 for accounts with MFA configured
  if (user && (isProtectedRoute || isMfaRoute)) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalData) {
      const { currentLevel, nextLevel } = aalData;

      // Scenario A: User has enrolled MFA (nextLevel === "aal2"), but current session is only AAL1
      if (nextLevel === "aal2" && currentLevel !== "aal2") {
        if (!isMfaRoute) {
          url.pathname = "/mfa-verify";
          url.searchParams.set("returnTo", pathname + (url.search || ""));
          return { response: createRedirect(url), user };
        }
      }
      // Scenario B: User is already elevated to AAL2 (or has no MFA enrolled) and visits /mfa-verify
      else if (isMfaRoute) {
        if (currentLevel === "aal2" || nextLevel !== "aal2") {
          const rawReturnTo = url.searchParams.get("returnTo") || "/profile";
          const safeReturnTo = rawReturnTo.startsWith("/") ? rawReturnTo : "/profile";
          url.pathname = safeReturnTo;
          url.search = "";
          return { response: createRedirect(url), user };
        }
      }
    }
  }

  return { response: supabaseResponse, user };
}
