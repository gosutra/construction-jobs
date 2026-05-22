import Link from "next/link";

/* ── DS 대신인력개발원 로고 (SVG) ── */
function DSLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="56" height="56" rx="10" fill="#1E2A4A" />
      <text
        x="50%"
        y="54%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontWeight="700"
        fontSize="24"
        fill="#D4A843"
        letterSpacing="1"
      >DS</text>
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F9FAFB]">

      {/* ── 헤더 ── */}
      <header className="bg-[#1E3A8A] px-5 pt-12 pb-10">
        {/* 로고 + 사명 */}
        <div className="flex items-center gap-3 mb-6">
          <DSLogo size={52} />
          <div>
            <p className="text-[#D4A843] text-xs font-semibold tracking-widest uppercase">DS</p>
            <p className="text-white font-bold text-base leading-tight">대신인력개발원</p>
          </div>
        </div>

        {/* 슬로건 */}
        <h1 className="text-[#F59E0B] text-2xl font-bold leading-snug mb-2 tracking-tight">
          건설현장 인력 플랫폼
        </h1>
        <p className="text-blue-100 text-base leading-relaxed">
          등록만 하면 조건에 맞는 현장을<br />
          <span className="text-white font-semibold">카카오 알림</span>으로 먼저 알려드립니다
        </p>
      </header>

      {/* ── 본문 ── */}
      <div className="px-4 py-7 space-y-5 max-w-lg mx-auto">

        {/* 구직자 카드 */}
        <section className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-[#FEF3C7] px-5 py-4 flex items-center gap-3">
            <span className="text-3xl">👷</span>
            <div>
              <p className="font-bold text-[#1F2937] text-base">구직자 (노동자)</p>
              <p className="text-amber-700 text-sm">현장이 먼저 연락해 옵니다</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-2">
            {[
              "현장을 직접 찾아다닐 필요 없음",
              "일당·숙소·교통 조건이 명확히 표시",
              "3분 등록으로 평생 관리",
            ].map(t => (
              <div key={t} className="flex items-start gap-2 text-base text-[#1F2937]">
                <span className="text-[#F59E0B] font-bold mt-0.5">✓</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5">
            <Link
              href="/worker/register"
              className="block w-full text-center bg-[#F59E0B] hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl text-base transition-colors shadow"
            >
              구직 등록하기 (3분 완성) →
            </Link>
          </div>
        </section>

        {/* 구분선 */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-gray-400 text-xs font-medium">또는</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* 구인업체 카드 */}
        <section className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-[#EFF6FF] px-5 py-4 flex items-center gap-3">
            <span className="text-3xl">🏢</span>
            <div>
              <p className="font-bold text-[#1F2937] text-base">구인업체 (건설사)</p>
              <p className="text-blue-600 text-sm">조건 입력 → 자동 매칭 시작</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-2">
            {[
              "조건 입력만 하면 자동으로 인력 매칭",
              "검증된 숙련도·보유 서류 정보 제공",
              "재확인 전화 없이 즉시 투입 가능",
            ].map(t => (
              <div key={t} className="flex items-start gap-2 text-base text-[#1F2937]">
                <span className="text-[#1E3A8A] font-bold mt-0.5">✓</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5">
            <Link
              href="/employer/post"
              className="block w-full text-center bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold py-3.5 rounded-xl text-base transition-colors shadow"
            >
              구인 공고 올리기 →
            </Link>
          </div>
        </section>

        {/* 프로세스 */}
        <section className="pt-2">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">
            매칭 프로세스
          </h2>
          <div className="relative">
            {/* 세로 연결선 */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200 -z-0" />
            <div className="space-y-3">
              {[
                { step: "1", icon: "📝", title: "구직자 등록", desc: "직종·숙련도·거주지 등록" },
                { step: "2", icon: "🏗️", title: "구인 공고 접수", desc: "업체가 현장 조건 입력" },
                { step: "3", icon: "🤖", title: "자동 매칭", desc: "조건 맞는 구직자 자동 추출" },
                { step: "4", icon: "📱", title: "알림 발송", desc: "카카오 알림톡·SMS 즉시 전송" },
                { step: "5", icon: "🤝", title: "연결 완료", desc: "지원 의사 확인 후 채용" },
              ].map(item => (
                <div key={item.step} className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-base text-[#1F2937]">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 관리자 링크 */}
        <div className="text-center pt-4 pb-6">
          <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-600 underline">
            관리자 대시보드
          </Link>
        </div>
      </div>
    </main>
  );
}
