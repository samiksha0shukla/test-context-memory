import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/", "/signin", "/signup", "/demo"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/_next") || pathname.startsWith("/api")
  );

  // Get the access token from cookies
  const accessToken = request.cookies.get("access_token")?.value;

  // If the route is public, allow access
  if (isPublicRoute) {
    // If user is authenticated and trying to access signin/signup, redirect to dashboard
    if (accessToken && (pathname === "/signin" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // If the route is protected and user is not authenticated, redirect to signin
  if (!accessToken) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
  ],
};
