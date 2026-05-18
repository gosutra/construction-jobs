import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-500 to-orange-600">
      {/* 헤더 */}
      <div className="px-5 pt-12 pb-8 text-white text-center">
        <div className="text-4xl mb-3">🏗️</div>
        <h1 className="text-2xl font-bold mb-2">건설현장 인력 플랫폼</h1>
        <p className="text-orange-100 text-sm leading-relaxed">
          등록만 하면 조건에 맞는 현장을<br />
          카카오 알림으로 먼저 알려드립니다
        </p>
      </div>

      {/* 메인 카드 영역 */}
      <div className="bg-gray-50 min-h-screen rounded-t-3xl px-5 pt-8 pb-20">
        {/* 구직자 섹션 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">👷</span>
            <h2 className="text-lg font-bold text-gray-800">구직자 (노동자)</h2>
          </div>
          <div className="card mb-4">
            <h3 className="font-bold text-gray-800 mb-2">이렇게 달라집니다</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-orange-500 font-bold">✓</span>
                <span>현장을 직접 찾아다닐 필요 없음</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 font-bold">✓</span>
                <span>일당·숙소·교통 조건이 명확히 표시됨</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 font-bold">✓</span>
                <span>3분 등록으로 평생 관리</span>
              </li>
            </ul>
          </div>
          <Link href="/worker/register" className="btn-primary block text-center no-underline">
            구직 등록하기 (3분 완성)
          </Link>
        </section>

        {/* 구분선 */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-gray-400 text-sm">또는</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* 구인업체 섹션 */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏢</span>
            <h2 className="text-lg font-bold text-gray-800">구인업체 (건설사)</h2>
          </div>
          <div className="card mb-4">
            <h3 className="font-bold text-gray-800 mb-2">이렇게 달라집니다</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                <span>조건 입력만 하면 자동으로 인력 매칭</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                <span>검증된 숙련도·자격증 정보 제공</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                <span>재확인 전화 없이 즉시 투입 가능</span>
              </li>
            </ul>
          </div>
          <Link href="/employer/post" className="btn-secondary block text-center no-underline">
            구인 공고 올리기
          </Link>
        </section>

        {/* 프로세스 안내 */}
        <section>
          <h2 className="text-base font-bold text-gray-700 mb-4">어떻게 연결되나요?</h2>
          <div className="space-y-3">
            {[
              { step: '1', icon: '📝', title: '구직자 등록', desc: '직종·숙련도·거주지 등록' },
              { step: '2', icon: '🏗️', title: '구인 공고 접수', desc: '업체가 현장 조건 입력' },
              { step: '3', icon: '🤖', title: '자동 매칭', desc: '조건 맞는 구직자 자동 추출' },
              { step: '4', icon: '📱', title: '알림 발송', desc: '카카오·SMS로 즉시 전송' },
              { step: '5', icon: '🤝', title: '연결 완료', desc: '지원 의사 확인 후 채용' },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-4 card py-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div className="text-xl">{item.icon}</div>
                <div>
                  <div className="font-semibold text-sm text-gray-800">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 관리자 링크 */}
        <div className="mt-10 text-center">
          <Link href="/admin" className="text-xs text-gray-400 underline">
            관리자 대시보드
          </Link>
        </div>
      </div>
    </main>
  );
}
