import { NextRequest, NextResponse } from 'next/server';

/**
 * API 라우트에서 관리자 인증을 검사합니다.
 * 인증 실패 시 401 응답을 반환하고, 성공 시 null을 반환합니다.
 *
 * 사용법:
 *   const authError = requireAdmin(req);
 *   if (authError) return authError;
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const session = req.cookies.get('admin_session')?.value;
  const secret  = process.env.ADMIN_SECRET;

  if (!secret || !session || session !== secret) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }
  return null;
}
