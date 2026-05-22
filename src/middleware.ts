import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 점검 페이지 자체 · 정적 파일은 항상 통과
  if (
    pathname === "/maintenance" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // 점검 모드: /admin 제외한 모든 경로 차단
  if (process.env.MAINTENANCE_MODE === "true" && !pathname.startsWith("/admin")) {
    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.redirect(url);
  }

  // /admin/login 은 통과
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  // /admin/* 경로 보호 (비밀번호 인증)
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
