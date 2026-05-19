import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin/login 은 통과
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  // /admin/* 경로 보호
  if (pathname.startsWith("/admin")) {
    const session = req.cookies.get("admin_session")?.value;
    const secret = process.env.ADMIN_SECRET;

    if (!secret || session !== secret) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
