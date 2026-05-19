"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "로그인 실패");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏗️</div>
          <h1 className="text-2xl font-bold text-white">관리자 로그인</h1>
          <p className="text-gray-400 text-sm mt-1">건설현장 인력 플랫폼</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              관리자 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3.5 text-base
                         placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="비밀번호 입력"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                       text-white font-bold py-4 rounded-xl text-base transition-colors"
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </main>
  );
}
