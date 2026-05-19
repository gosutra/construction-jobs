import { NextRequest, NextResponse } from "next/server";

// 로그인: 비밀번호 확인 후 세션 쿠키 발급
export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminPassword || !adminSecret) {
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "비밀번호가 틀렸습니다" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_session", adminSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8시간
    path: "/",
  });
  return res;
}

// 로그아웃: 쿠키 삭제
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_session", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return res;
}
