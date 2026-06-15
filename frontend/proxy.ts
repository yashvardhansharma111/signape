import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token   = request.cookies.get("signape_token")?.value;
  const role    = request.cookies.get("signape_role")?.value;
  const ftl     = request.cookies.get("signape_ftl")?.value;
  const { pathname } = request.nextUrl;

  const isLogin          = pathname === "/login";
  const isSignup         = pathname === "/signup";
  const isPending        = pathname === "/pending";
  const isForgot         = pathname === "/forgot-password";
  const isReset          = pathname.startsWith("/reset-password");
  const isChangePassword = pathname.startsWith("/change-password");
  const isDashboard      = pathname.startsWith("/dashboard");
  const isRoom           = pathname.startsWith("/room");
  const isAdmin          = pathname.startsWith("/admin");

  // Unauthenticated public pages — always allow
  if (isForgot || isReset || isPending) return NextResponse.next();

  // Not logged in
  if (!token) {
    if (isDashboard || isRoom || isAdmin || isChangePassword) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Logged in — redirect away from auth pages
  if (isLogin || isSignup) {
    if (ftl === "1") return NextResponse.redirect(new URL("/change-password", request.url));
    if (role === "superadmin") return NextResponse.redirect(new URL("/admin", request.url));
    if (role === "occupancy")  return NextResponse.redirect(new URL("/room", request.url));
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // First-time login — must change password before accessing anything else
  if (ftl === "1" && !isChangePassword) {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  // Admin routes — superadmin only
  if (isAdmin && role !== "superadmin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Dashboard — not for occupancy-only users
  if (isDashboard && role === "occupancy") {
    return NextResponse.redirect(new URL("/room", request.url));
  }

  // Room — not for signage-only users
  if (isRoom && role === "signage") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/room/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/pending",
    "/change-password",
    "/forgot-password",
    "/reset-password",
  ],
};
