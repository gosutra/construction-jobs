"use client";

import { useState, useEffect, useCallback } from "react";
import type { Worker, JobPosting, Match } from "@/types";

type Tab = "workers" | "jobs" | "matches";

const RESPONSE_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  interested: "bg-green-100 text-green-700",
  not_interested: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
};

const RESPONSE_LABEL: Record<string, string> = {
  pending: "대기중",
  interested: "지원의향",
  not_interested: "미관심",
  expired: "만료",
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("workers");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      if (t === "workers") {
        const res = await fetch("/api/workers");
        const json = await res.json();
        setWorkers(json.workers || []);
      } else if (t === "jobs") {
        const res = await fetch("/api/jobs");
        const json = await res.json();
        setJobs(json.jobs || []);
      } else {
        const res = await fetch("/api/match");
        const json = await res.json();
        // Supabase JOIN 응답: workers/job_postings 키 → worker/job_posting 키로 정규화
        const normalized = (json.matches || []).map((m: Record<string, unknown>) => ({
          ...m,
          worker: m.workers ?? m.worker,
          job_posting: m.job_postings ?? m.job_posting,
        }));
        setMatches(normalized);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(tab); }, [tab, fetchData]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gray-900 text-white px-5 pt-10 pb-5">
        <h1 className="text-xl font-bold">관리자 대시보드</h1>
        <p className="text-gray-400 text-sm mt-1">건설현장 인력 플랫폼</p>
      </div>

      {/* 탭 */}
      <div className="bg-white border-b border-gray-200 flex">
        {(["workers", "jobs", "matches"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors
              ${tab === t ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-500"}`}
          >
            {t === "workers" ? "구직자" : t === "jobs" ? "구인공고" : "매칭현황"}
          </button>
        ))}
      </div>

      <div className="px-4 py-5">
        {loading && (
          <div className="text-center py-10 text-gray-500">불러오는 중...</div>
        )}

        {/* 구직자 목록 */}
        {!loading && tab === "workers" && (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 font-medium">총 {workers.length}명 등록</div>
            {workers.map(w => (
              <div key={w.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-bold text-gray-800">{w.name}</span>
                    <span className="text-gray-500 text-sm ml-2">{w.phone}</span>
                  </div>
                  <span className={`badge ${w.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {w.is_active ? "활성" : "비활성"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="badge bg-orange-100 text-orange-700">{w.job_category}</span>
                  <span className="badge bg-blue-100 text-blue-700">{w.skill_level}</span>
                  <span className="badge bg-gray-100 text-gray-600">{w.city}</span>
                  {w.experience_years > 0 && (
                    <span className="badge bg-gray-100 text-gray-600">경력 {w.experience_years}년</span>
                  )}
                  <span className="badge bg-gray-100 text-gray-600">{w.age}세</span>
                </div>
                {w.certifications?.length ? (
                  <div className="mt-1 text-xs text-gray-500">자격증: {w.certifications.join(", ")}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* 구인 공고 목록 */}
        {!loading && tab === "jobs" && (
          <div className="space-y-3">
            <div className="text-sm text-gray-500 font-medium">총 {jobs.length}건</div>
            {jobs.map(j => (
              <div key={j.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-bold text-gray-800">{j.company_name}</span>
                    <span className={`ml-2 badge ${j.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {j.status === "open" ? "모집중" : j.status === "filled" ? "마감" : "취소"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs mb-2">
                  <span className="badge bg-orange-100 text-orange-700">{j.job_category}</span>
                  <span className="badge bg-blue-100 text-blue-700">{j.skill_level_required}</span>
                  <span className="badge bg-gray-100 text-gray-600">{j.location_city}</span>
                </div>
                <div className="text-sm text-gray-700">
                  💰 {j.daily_wage.toLocaleString()}원 · 👥 {j.workers_needed}명
                  {j.accommodation_provided && " · 🏠 숙소"}
                  {j.transportation_provided && " · 🚌 교통"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(j.work_start_date).toLocaleDateString("ko-KR")} 시작
                  {j.work_end_date ? ` ~ ${new Date(j.work_end_date).toLocaleDateString("ko-KR")}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 매칭 현황 */}
        {!loading && tab === "matches" && (
          <div className="space-y-3">
            {/* 요약 카운트 */}
            <div className="flex gap-3 text-xs text-center mb-4">
              {["pending", "interested", "not_interested"].map(r => (
                <div key={r} className={`flex-1 py-2 rounded-lg ${RESPONSE_BADGE[r]}`}>
                  <div className="font-bold text-lg">
                    {matches.filter(m => m.response === r).length}
                  </div>
                  <div>{RESPONSE_LABEL[r]}</div>
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-500 font-medium">총 {matches.length}건</div>

            {matches.map(m => {
              const worker = m.worker as Worker | undefined;
              const job = m.job_posting as JobPosting | undefined;
              return (
                <div key={m.id} className="card space-y-3">
                  {/* 상단: 응답 상태 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">매칭 ID: {m.id.slice(0, 8)}…</span>
                    <span className={`badge text-xs font-bold ${RESPONSE_BADGE[m.response]}`}>
                      {RESPONSE_LABEL[m.response]}
                    </span>
                  </div>

                  {/* 구직자 정보 */}
                  <div className="bg-orange-50 rounded-xl px-3 py-2">
                    <div className="text-xs font-bold text-orange-600 mb-1">👷 구직자 정보</div>
                    {worker ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{worker.name}</span>
                          <span className="text-gray-500 text-sm">{worker.phone}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          <span className="badge bg-orange-100 text-orange-700">{worker.job_category}</span>
                          <span className="badge bg-blue-100 text-blue-700">{worker.skill_level}</span>
                          <span className="badge bg-gray-100 text-gray-600">{worker.city}</span>
                          {worker.experience_years > 0 && (
                            <span className="badge bg-gray-100 text-gray-600">경력 {worker.experience_years}년</span>
                          )}
                          {worker.age && (
                            <span className="badge bg-gray-100 text-gray-600">{worker.age}세</span>
                          )}
                        </div>
                        {worker.certifications?.length ? (
                          <div className="text-xs text-gray-500">자격증: {worker.certifications.join(", ")}</div>
                        ) : null}
                        <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                          {worker.need_accommodation && <span>🏠 숙소필요</span>}
                          {worker.need_transportation && <span>🚌 교통필요</span>}
                          {worker.has_car && <span>🚗 차량보유</span>}
                          {worker.preferred_wage ? <span>희망일당 {worker.preferred_wage.toLocaleString()}원</span> : null}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">구직자 정보 없음</div>
                    )}
                  </div>

                  {/* 구인 공고 정보 */}
                  <div className="bg-blue-50 rounded-xl px-3 py-2">
                    <div className="text-xs font-bold text-blue-600 mb-1">🏗️ 구인 공고 정보</div>
                    {job ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{job.company_name}</span>
                          <span className={`badge text-xs ${job.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {job.status === "open" ? "모집중" : job.status === "filled" ? "마감" : "취소"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          <span className="badge bg-orange-100 text-orange-700">{job.job_category}</span>
                          <span className="badge bg-blue-100 text-blue-700">{job.skill_level_required}</span>
                          <span className="badge bg-gray-100 text-gray-600">{job.location_city}</span>
                        </div>
                        <div className="text-sm text-gray-700 font-semibold">
                          💰 일당 {job.daily_wage.toLocaleString()}원 · 👥 {job.workers_needed}명
                        </div>
                        <div className="text-xs text-gray-600">
                          📍 {job.location_address}
                        </div>
                        <div className="text-xs text-gray-600">
                          📅 {new Date(job.work_start_date).toLocaleDateString("ko-KR")} 시작
                          {job.work_end_date ? ` ~ ${new Date(job.work_end_date).toLocaleDateString("ko-KR")}` : ""}
                        </div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                          {job.accommodation_provided && <span>🏠 숙소제공</span>}
                          {job.transportation_provided && <span>🚌 교통제공</span>}
                          {(job as JobPosting & { meal_provided?: boolean }).meal_provided && <span>🍱 식사제공</span>}
                        </div>
                        <div className="text-xs text-gray-500">담당: {job.contact_name} {job.contact_phone}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">공고 정보 없음</div>
                    )}
                  </div>

                  {/* 타임스탬프 */}
                  <div className="text-xs text-gray-400 space-y-0.5 border-t border-gray-100 pt-2">
                    {m.notified_at && (
                      <div>📤 알림 발송: {new Date(m.notified_at).toLocaleString("ko-KR")}</div>
                    )}
                    {m.responded_at && (
                      <div>✅ 응답 시각: {new Date(m.responded_at).toLocaleString("ko-KR")}</div>
                    )}
                    {!m.notified_at && <div className="text-yellow-500">⏳ 아직 알림 미발송</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
