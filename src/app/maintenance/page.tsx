export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-[#1E3A8A] flex flex-col items-center justify-center px-6 text-center">
      {/* DS 로고 */}
      <div className="mb-8">
        <svg width="72" height="72" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="56" height="56" rx="10" fill="#1E2A4A" />
          <text
            x="50%" y="54%"
            dominantBaseline="middle" textAnchor="middle"
            fontFamily="Georgia, serif" fontWeight="700" fontSize="24"
            fill="#D4A843" letterSpacing="1"
          >DS</text>
        </svg>
      </div>

      <h1 className="text-white text-2xl font-bold mb-2">대신인력개발원</h1>
      <p className="text-[#F59E0B] text-lg font-semibold mb-6">서비스 준비 중입니다</p>

      <div className="bg-white/10 rounded-2xl px-8 py-6 max-w-sm w-full mb-8">
        <div className="text-4xl mb-4">🔧</div>
        <p className="text-white text-base leading-relaxed">
          더 나은 서비스 제공을 위해<br />
          시스템을 개선하고 있습니다.
        </p>
        <p className="text-blue-200 text-sm mt-3">
          빠른 시일 내에 정식 오픈하겠습니다.<br />
          이용에 불편을 드려 죄송합니다.
        </p>
      </div>

      <div className="text-blue-300 text-sm">
        문의: <span className="text-white font-semibold">대신인력개발원</span>
      </div>
    </main>
  );
}
