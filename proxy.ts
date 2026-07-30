import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isStaffRole, resolveAppRole, roleHome } from "@/lib/auth/roles";

const protectedPrefixes = ["/dashboard", "/courses", "/classes", "/profile", "/leaderboard", "/achievements", "/preview/lessons"];
const studentOnlyPrefixes = ["/dashboard", "/courses", "/classes", "/profile", "/leaderboard", "/achievements"];

const authPages = ["/login", "/signup", "/forgot-password"];
const isAuthPage = (pathname: string) =>
  authPages.some((page) => pathname === page || pathname.startsWith(`${page}/`));

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const publicTeacherAppeal = pathname === "/teacher/appeal" || pathname.startsWith("/api/auth/teacher-appeal/");
  const adminApi = pathname.startsWith("/api/admin");
  const teacherApi = pathname.startsWith("/api/teacher");
  const staffApi = adminApi || teacherApi;
  const protectedRoute =
    protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.startsWith("/admin") ||
    (pathname.startsWith("/teacher") && !publicTeacherAppeal) ||
    staffApi;
  const hasSupabaseSession = request.cookies.getAll().some(({ name }) =>
    name.startsWith("sb-") && name.includes("-auth-token")
  );
  const needsAuthenticationLookup =
    protectedRoute ||
    (hasSupabaseSession && (isAuthPage(pathname) || pathname === "/"));

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    if (staffApi) return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
    if (protectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Anonymous public traffic does not need a network round trip to Supabase.
  // Protected routes still verify the token server-side, while signed-in visitors
  // retain the convenience redirects away from landing and authentication pages.
  if (!needsAuthenticationLookup) {
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
  const role = resolveAppRole(user?.app_metadata.role);

  if (!user && protectedRoute) {
    if (staffApi) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = roleHome(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname === "/" && user) {
    const url = request.nextUrl.clone();
    url.pathname = roleHome(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (adminApi && role !== "admin") {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  if (teacherApi && !isStaffRole(role)) {
    return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = roleHome(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/teacher") && !publicTeacherAppeal && !isStaffRole(role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isStaffRole(role) && studentOnlyPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    const url = request.nextUrl.clone();
    url.pathname = roleHome(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
