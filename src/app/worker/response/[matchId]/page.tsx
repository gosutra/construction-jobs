"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

type Status = "loading" | "ready" | "already_responded" | "error";

interface MatchInfo {
  response: string;
  job: {
    company_name: string; job_category: string; skill_level_required: string;
    daily_wage: number; work_start_date: string; work_end_date?: string;
    location_city: string; location_district?: string;
    accommodation_provided: boolean; transportation_provided: boolean;
    meal_provided: boolean;
    required_documents?: string[]; description?: string;
  };
  worker: { name: string };
}

export default function WorkerResponsePage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [finalResponse, setFinalResponse] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/match?matchId=${matchId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.match) { setStatus("error"); return; }
        setMatchInfo(data.match);
        if (data.match.response !== "pending") {
          setFinalResponse(data.match.response);
          setStatus("already_responded");
        } else setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [matchId]);

  const respond = async (response: "interested" | "not_interested") => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/match", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, response }),
      });
      const data = await res.json();
      setFinalResponse(res.status === 409 ? data.response : response);
      setStatus("already_responded");
    } finally { setSubmitting(false); }
  };

  if (status === "loading") return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">불러오는 중...</div>
    </main>
  );

  if (status === "error") return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5">
      <div className="text-4xl mb-3">😕</div>
      <p className="text-gray-600 text-center">링크가 유효하지 않거나 만료되었습니다</p>
    </main>
  );

  if (status === "already_responded") {
    const isInterested = finalResponse === "interested";
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5">
        <div className="text-5xl mb-4">{isInterested ? "🙌" : "👋"}</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          {isInterested ? "지원 의향 전달 완료!" : "확인했습니다"}
        </h1>
        <p className="text-gray-600 text-center text-sm">
          {isInterested ? "담당자가 곧 연락드릴 예정입니다" : "다음 기회에 더 좋은 현장을 알려드리겠습니다"}
        </p>
      </main>
    );
  }

  const job = matchInfo!.job;
  const wage = job.daily_wage.toLocaleString("ko-KR");
  const startDate = new Date(job.work_start_date).toLocaleDateString("ko-KR");
  const endDate = job.work_end_date ? new Date(job.work_end_date).toLocaleDateString("ko-KR") : "미정";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-[#1E3A8A] text-white px-5 pt-10 pb-6">
        <p className="text-blue-200 text-sm mb-1">안녕하세요, {matchInfo!.worker.name}님</p>
        <h1 className="text-xl font-bold">조건에 맞는 현장이 있습니다!</h1>
      </div>
      <div className="px-5 py-6 max-w-lg mx-auto">
        <div className="card mb-6">
          <h2 className="font-bold text-gray-800 text-lg mb-4">{job.company_name}</h2>
          <div className="space-y-3">
            {[
              { icon: "📍", label: "현장 위치", value: `${job.location_city} ${job.location_district || ""}`.trim() },
              { icon: "🔨", label: "공종", value: `${job.job_category} (${job.skill_level_required})` },
              { icon: "💰", label: "일당", value: `${wage}원` },
              { icon: "📅", label: "근무 기간", value: `${startDate} ~ ${endDate}` },
              { icon: "🏠", label: "숙소", value: job.accommodation_provided ? "✅ 제공" : "❌ 미제공" },
              { icon: "🚌", label: "교통", value: job.transportation_provided ? "✅ 제공" : "❌ 미제공" },
              { icon: "🍱", label: "식사", value: job.meal_provided ? "✅ 제공" : "❌ 미제공" },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-xl w-7">{row.icon}</span>
                <div className="flex-1 flex justify-between">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className="text-sm font-semibold text-gray-800">{row.value}</span>
                </div>
              </div>
            ))}
          </div>
          {job.required_documents?.length ? (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">📋 필요 서류</p>
              <p className="text-sm text-gray-700">{job.required_documents.join(", ")}</p>
            </div>
          ) : null}
          {job.description && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">📝 특이사항</p>
              <p className="text-sm text-gray-700">{job.description}</p>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 text-center mb-4 font-medium">이 현장에 관심이 있으신가요?</p>
        <div className="space-y-3">
          <button onClick={() => respond("interested")} disabled={submitting} className="btn-primary">
            {submitting ? "처리 중..." : "✅ 네, 지원하고 싶습니다"}
          </button>
          <button onClick={() => respond("not_interested")} disabled={submitting} className="w-full py-4 text-gray-500 font-medium text-base">
            이번엔 괜찮습니다
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">지원 의향을 밝히시면 담당자가 직접 연락드립니다</p>
      </div>
    </main>
  );
}