import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/",
  "/build",
  "/login",
  "/signup",
  "/desk/login",
  "/desk/forgot-password",
  "/desk/reset-password",
  "/auth",
  "/terms",
  "/privacy",
  "/cookies",
  "/agent-agreement",
];

function isPublicPath(path: string) {
  if (PUBLIC_PREFIXES.includes(path)) return true;
  if (path.startsWith("/images") || path.startsWith("/reference") || path.startsWith("/icons")) return true;
  if (
    path === "/favicon.ico" ||
    path === "/manifest.webmanifest" ||
    path === "/styles.css" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path === "/llms.txt"
  ) {
    return true;
  }
  return false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicApi =
    path === "/api/health" ||
    path === "/api/proposal" ||
    path === "/api/media/library";

  if (!user && !isPublicPath(path) && !isPublicApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/desk/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/signup" || path === "/desk/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/desk";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
