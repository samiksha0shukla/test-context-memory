import { NextResponse } from "next/server";

// With token-based auth (localStorage), we can't check auth server-side.
// Auth protection is handled client-side in the AuthContext and protected layout.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only match paths that need middleware processing
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
  ],
};
