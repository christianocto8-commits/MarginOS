import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "marginos_token";

// Protected app routes requiring authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/menus",
  "/ingredients",
  "/purchases",
  "/sub-recipes",
  "/cogs-inventory",
  "/menu-engineering",
  "/financials",
  "/sop-export",
  "/outlets",
  "/admin",
  "/quick-calc",
  "/pricing-simulator",
  "/super-admin",
];

// Helper to safely parse JWT payload in Edge runtime without external crypto deps
function parseJwtPayload(token: string): { userId?: string; businessId?: string; role?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? parseJwtPayload(token) : null;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  // 1. If trying to access protected app routes without a valid token, redirect to /login
  if (isProtected) {
    if (!token || !payload) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based protection: /super-admin is only for SUPER_ADMIN role
    if (pathname.startsWith("/super-admin") && payload.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 2. If already logged in and visiting /login or /register, route to their respective dashboard
  if ((pathname === "/login" || pathname === "/register") && token && payload) {
    if (payload.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/super-admin", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (they handle their own granular HTTP 401/403 JSON responses)
     * - _next/static, _next/image
     * - static assets (.svg, .png, .jpg, .ico, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|svg|webp|ico)$).*)",
  ],
};
