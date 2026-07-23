import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/courses", "/profile", "/leaderboard", "/achievements", "/preview/lessons"];
const studentOnlyPrefixes = ["/dashboard", "/courses", "/profile", "/leaderboard", "/achievements"];
const authPages = ["/login", "/signup", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const adminApi = pathname.startsWith("/api/admin");
  const protectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) || pathname.startsWith("/admin") || adminApi;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    if (adminApi) return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
    if (protectedRoute) {
      const url = request.nextUrl.clone(); url.pathname = "/login"; url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata.role === "admin" ? "admin" : "student";
  if (!user && protectedRoute) {
    if (adminApi) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const url = request.nextUrl.clone(); url.pathname = "/login"; url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (user && authPages.includes(pathname)) {
    const url = request.nextUrl.clone(); url.pathname = role === "admin" ? "/admin" : "/dashboard"; url.search = "";
    return NextResponse.redirect(url);
  }
  if (pathname === "/" && user) {
    const url = request.nextUrl.clone(); url.pathname = role === "admin" ? "/admin" : "/dashboard"; url.search = "";
    return NextResponse.redirect(url);
  }
  if (adminApi && role !== "admin") {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }
  if (pathname.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone(); url.pathname = "/dashboard"; url.search = "";
    return NextResponse.redirect(url);
  }
  if (role === "admin" && studentOnlyPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    const url = request.nextUrl.clone(); url.pathname = "/admin"; url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
