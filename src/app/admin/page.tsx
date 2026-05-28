"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Worker, JobPosting, Match } from "@/types";
import { JOB_CATEGORIES, SKILL_LEVELS, CITIES } from "@/types";
import * as XLSX from "xlsx";

type Tab = "workers" | "jobs" | "matches";

const RESPONSE_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  interested: "bg-green-100 text-green-700",
  not_interested: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
};
const RESPONSE_LABEL: Record<string, string> = {
  pending: "대기중", interested: "지원의향", not_interested: "미관심", expired: "만료",
};

/* ───────── 삭제 확인 모달 ───────── */
function ConfirmModal({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <p className="text-gray-800 font-semibold text-center mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium">취소</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold">삭제</button>
        </div>
      </div>
    </div>
  );
}

/* ───────── 구직자 수정 모달 ───────── */
function WorkerEditModal({ worker, onSave, onClose }: {
  worker: Worker; onSave: (updated: Partial<Worker>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: worker.name,
    phone: worker.phone,
    birth_date: worker.birth_date || "",
    gender: (worker as Worker & { gender?: string }).gender || "",
    city: worker.city,
    job_category: worker.job_category,
    skill_level: worker.skill_level,
    experience_years: worker.experience_years,
    preferred_wage: worker.preferred_wage || 0,
    need_accommodation: worker.need_accommodation,
    need_transportation: worker.need_transportation,
    has_car: worker.has_car,
    is_active: worker.is_active,
    notes: worker.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ id: worker.id, ...form } as Partial<Worker>);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center px-4 py-8">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
            <h2 className="font-bold text-gray-800">구직자 정보 수정</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
          </div>
          <div className="px-5 py-4 space-y-4">
            {/* 이름 */}
            <div>
              <label className="form-label">이름</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} className="form-input" />
            </div>
            {/* 전화번호 */}
            <div>
              <label className="form-label">휴대폰</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)} className="form-input" inputMode="numeric" />
            </div>
            {/* 생년월일 */}
            <div>
              <label className="form-label">생년월일 6자리 (YYMMDD)</label>
              <input value={form.birth_date} onChange={e => set("birth_date", e.target.value)} className="form-input" placeholder="850315" maxLength={6} inputMode="numeric" />
            </div>
            {/* 성별 */}
            <div>
              <label className="form-label">성별</label>
              <div className="grid grid-cols-2 gap-2">
                {["남", "여"].map(g => (
                  <button key={g} type="button" onClick={() => set("gender", g)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors
                      ${form.gender === g ? "border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]" : "border-gray-200 text-gray-600"}`}>
                    {g === "남" ? "👨 남성" : "👩 여성"}
                  </button>
                ))}
              </div>
            </div>
            {/* 지역 */}
            <div>
              <label className="form-label">거주 지역</label>
              <select value={form.city} onChange={e => set("city", e.target.value)} className="form-select">
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* 직종 */}
            <div>
              <label className="form-label">직종</label>
              <select value={form.job_category} onChange={e => set("job_category", e.target.value)} className="form-select">
                {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* 숙련도 */}
            <div>
              <label className="form-label">숙련도</label>
              <div className="grid grid-cols-3 gap-2">
                {SKILL_LEVELS.map(lv => (
                  <button key={lv} type="button" onClick={() => set("skill_level", lv)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors
                      ${form.skill_level === lv ? "border-[#F59E0B] bg-amber-50 text-amber-600" : "border-gray-200 text-gray-600"}`}>
                    {lv}
                  </button>
                ))}
              </div>
            </div>
            {/* 경력 */}
            <div>
              <label className="form-label">경력 연수</label>
              <input type="number" value={form.experience_years} onChange={e => set("experience_years", Number(e.target.value))} className="form-input" />
            </div>
            {/* 희망 일당 */}
            <div>
              <label className="form-label">희망 일당 (원)</label>
              <input type="number" value={form.preferred_wage} onChange={e => set("preferred_wage", Number(e.target.value))} className="form-input" />
            </div>
            {/* 토글 */}
            {([
              { k: "need_accommodation", label: "🏠 숙소 필요" },
              { k: "need_transportation", label: "🚌 교통 필요" },
              { k: "has_car", label: "🚗 차량 보유" },
              { k: "is_active", label: "✅ 활성 상태" },
            ] as { k: keyof typeof form; label: string }[]).map(({ k, label }) => (
              <label key={k} className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-sm text-gray-700">{label}</span>
                <div className={`relative w-11 h-6 rounded-full transition-colors ${form[k] ? "bg-[#1E3A8A]" : "bg-gray-300"}`}
                  onClick={() => set(k, !form[k])}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[k] ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </label>
            ))}
            {/* 메모 */}
            <div>
              <label className="form-label">특이사항</label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)} className="form-input" rows={2} />
            </div>
          </div>
          <div className="px-5 pb-5 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium">취소</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#1E3A8A] text-white font-bold disabled:opacity-50">
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 구인공고 수정 모달 ───────── */
function JobEditModal({ job, onSave, onClose }: {
  job: JobPosting; onSave: (updated: Partial<JobPosting>) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState({
    company_name: job.company_name,
    contact_name: job.contact_name,
    contact_phone: job.contact_phone,
    location_city: job.location_city,
    location_address: job.location_address || "",
    job_category: job.job_category,
    skill_level_required: job.skill_level_required,
    workers_needed: job.workers_needed,
    daily_wage: job.daily_wage,
    work_start_date: job.work_start_date?.split("T")[0] || "",
    work_end_date: job.work_end_date?.split("T")[0] || "",
    age_min: job.age_min || 0,
    age_max: job.age_max || 0,
    accommodation_provided: job.accommodation_provided,
    transportation_provided: job.transportation_provided,
    meal_provided: (job as JobPosting & { meal_provided?: boolean }).meal_provided || false,
    status: job.status,
    description: job.description || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ id: job.id, ...form } as Partial<JobPosting>);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center px-4 py-8">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
            <h2 className="font-bold text-gray-800">구인 공고 수정</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="form-label">업체명</label>
              <input value={form.company_name} onChange={e => set("company_name", e.target.value)} className="form-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">담당자</label>
                <input value={form.contact_name} onChange={e => set("contact_name", e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">연락처</label>
                <input value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)} className="form-input" inputMode="numeric" />
              </div>
            </div>
            <div>
              <label className="form-label">지역</label>
              <select value={form.location_city} onChange={e => set("location_city", e.target.value)} className="form-select">
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">상세 주소</label>
              <input value={form.location_address} onChange={e => set("location_address", e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="form-label">직종</label>
              <select value={form.job_category} onChange={e => set("job_category", e.target.value)} className="form-select">
                {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">필요 숙련도</label>
              <div className="grid grid-cols-3 gap-2">
                {SKILL_LEVELS.map(lv => (
                  <button key={lv} type="button" onClick={() => set("skill_level_required", lv)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors
                      ${form.skill_level_required === lv ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-600"}`}>
                    {lv}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">필요 인원</label>
                <input type="number" value={form.workers_needed} onChange={e => set("workers_needed", Number(e.target.value))} className="form-input" />
              </div>
              <div>
                <label className="form-label">일당 (원)</label>
                <input type="number" value={form.daily_wage} onChange={e => set("daily_wage", Number(e.target.value))} className="form-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">시작일</label>
                <input type="date" value={form.work_start_date} onChange={e => set("work_start_date", e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">종료일</label>
                <input type="date" value={form.work_end_date} onChange={e => set("work_end_date", e.target.value)} className="form-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">최소 나이</label>
                <input type="number" value={form.age_min} onChange={e => set("age_min", Number(e.target.value))} className="form-input" placeholder="제한없음" />
              </div>
              <div>
                <label className="form-label">최대 나이</label>
                <input type="number" value={form.age_max} onChange={e => set("age_max", Number(e.target.value))} className="form-input" placeholder="제한없음" />
              </div>
            </div>
            {/* 상태 */}
            <div>
              <label className="form-label">공고 상태</label>
              <div className="grid grid-cols-3 gap-2">
                {(["open", "filled", "cancelled"] as const).map(s => (
                  <button key={s} type="button" onClick={() => set("status", s)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors
                      ${form.status === s ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-600"}`}>
                    {s === "open" ? "모집중" : s === "filled" ? "마감" : "취소"}
                  </button>
                ))}
              </div>
            </div>
            {/* 토글 */}
            {([
              { k: "accommodation_provided", label: "🏠 숙소 제공" },
              { k: "transportation_provided", label: "🚌 교통 제공" },
              { k: "meal_provided", label: "🍱 식사 제공" },
            ] as { k: keyof typeof form; label: string }[]).map(({ k, label }) => (
              <label key={k} className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-sm text-gray-700">{label}</span>
                <div className={`relative w-11 h-6 rounded-full transition-colors ${form[k] ? "bg-blue-500" : "bg-gray-300"}`}
                  onClick={() => set(k, !form[k])}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[k] ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </label>
            ))}
            <div>
              <label className="form-label">공고 설명</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} className="form-input" rows={2} />
            </div>
          </div>
          <div className="px-5 pb-5 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium">취소</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold disabled:opacity-50">
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 메인 대시보드 ───────── */
export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("workers");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // 수정 모달
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [editJob, setEditJob] = useState<JobPosting | null>(null);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<{ type: "worker" | "job"; id: string; name: string } | null>(null);

  // 토스트 알림
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  /* ── 엑셀 내보내기 ── */
  const exportWorkers = () => {
    const rows = workers.map(w => ({
      이름: w.name,
      휴대폰: w.phone,
      생년월일: w.birth_date || "",
      성별: (w as Worker & { gender?: string }).gender ?? "",
      나이: w.age ?? "",
      거주지역: w.city,
      직종: w.job_category,
      숙련도: w.skill_level,
      경력년수: w.experience_years,
      희망일당: w.preferred_wage ?? "",
      숙소필요: w.need_accommodation ? "Y" : "N",
      교통필요: w.need_transportation ? "Y" : "N",
      차량보유: w.has_car ? "Y" : "N",
      보유서류: w.certifications?.join(", ") ?? "",
      활성여부: w.is_active ? "활성" : "비활성",
      특이사항: w.notes ?? "",
      등록일: new Date(w.created_at).toLocaleDateString("ko-KR"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    // 열 너비 자동 설정
    ws["!cols"] = [
      { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 6 }, { wch: 6 },
      { wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 8 },
      { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
      { wch: 30 }, { wch: 8 }, { wch: 20 }, { wch: 12 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "구직자");
    XLSX.writeFile(wb, `구직자_${new Date().toLocaleDateString("ko-KR").replace(/\. /g, "-").replace(".", "")}.xlsx`);
  };

  const exportJobs = () => {
    const rows = jobs.map(j => ({
      업체명: j.company_name,
      담당자: j.contact_name,
      연락처: j.contact_phone,
      지역: j.location_city,
      상세주소: j.location_address ?? "",
      직종: j.job_category,
      숙련도: j.skill_level_required,
      필요인원: j.workers_needed,
      일당: j.daily_wage,
      시작일: new Date(j.work_start_date).toLocaleDateString("ko-KR"),
      종료일: j.work_end_date ? new Date(j.work_end_date).toLocaleDateString("ko-KR") : "",
      연령하한: j.age_min ?? "",
      연령상한: j.age_max ?? "",
      성별: (j as JobPosting & { gender_preference?: string }).gender_preference ?? "성별무관",
      숙소제공: j.accommodation_provided ? "Y" : "N",
      교통제공: j.transportation_provided ? "Y" : "N",
      식사제공: (j as JobPosting & { meal_provided?: boolean }).meal_provided ? "Y" : "N",
      급여일: (j as JobPosting & { pay_day?: string }).pay_day ?? "",
      필요서류: j.required_documents?.join(", ") ?? "",
      공고상태: j.status === "open" ? "모집중" : j.status === "filled" ? "마감" : "취소",
      등록일: new Date(j.created_at).toLocaleDateString("ko-KR"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 24 },
      { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 12 },
      { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
      { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 30 }, { wch: 8 }, { wch: 12 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "구인공고");
    XLSX.writeFile(wb, `구인공고_${new Date().toLocaleDateString("ko-KR").replace(/\. /g, "-").replace(".", "")}.xlsx`);
  };

  const exportMatches = () => {
    const rows = matches.map(m => {
      const w = m.worker as Worker | undefined;
      const j = m.job_posting as JobPosting | undefined;
      return {
        구직자명: w?.name ?? "",
        구직자연락처: w?.phone ?? "",
        직종: w?.job_category ?? "",
        숙련도: w?.skill_level ?? "",
        거주지: w?.city ?? "",
        업체명: j?.company_name ?? "",
        담당자연락처: j?.contact_phone ?? "",
        일당: j?.daily_wage ?? "",
        현장지역: j?.location_city ?? "",
        응답상태: m.response === "interested" ? "지원의향" : m.response === "not_interested" ? "미관심" : m.response === "expired" ? "만료" : "대기중",
        알림발송: m.notified_at ? new Date(m.notified_at).toLocaleString("ko-KR") : "미발송",
        응답시각: m.responded_at ? new Date(m.responded_at).toLocaleString("ko-KR") : "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 8 },
      { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 8 },
      { wch: 8 }, { wch: 18 }, { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "매칭현황");
    XLSX.writeFile(wb, `매칭현황_${new Date().toLocaleDateString("ko-KR").replace(/\. /g, "-").replace(".", "")}.xlsx`);
  };

  const fetchData = useCallback(async (t: Tab) => {
    setLoading(true);
    setFetchError("");
    try {
      if (t === "workers") {
        const res = await fetch("/api/workers?admin=true");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "구직자 데이터 로드 실패");
        setWorkers(json.workers || []);
      } else if (t === "jobs") {
        const res = await fetch("/api/jobs");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "구인공고 데이터 로드 실패");
        setJobs(json.jobs || []);
      } else {
        const res = await fetch("/api/match");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "매칭 데이터 로드 실패");
        const normalized = (json.matches || []).map((m: Record<string, unknown>) => ({
          ...m,
          worker: m.workers ?? m.worker,
          job_posting: m.job_postings ?? m.job_posting,
        }));
        setMatches(normalized);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "데이터를 불러오지 못했습니다";
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(tab); }, [tab, fetchData]);

  /* 구직자 수정 저장 */
  const handleWorkerSave = async (updated: Partial<Worker>) => {
    const res = await fetch("/api/workers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    const json = await res.json();
    if (res.ok) {
      setEditWorker(null);
      fetchData("workers");
      showToast("구직자 정보를 저장했습니다");
    } else {
      showToast(json.error || "저장에 실패했습니다", false);
    }
  };

  /* 구직자 삭제 */
  const handleWorkerDelete = async (id: string) => {
    const res = await fetch(`/api/workers?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) {
      setDeleteTarget(null);
      setWorkers(prev => prev.filter(w => w.id !== id));
      showToast("구직자를 삭제했습니다");
    } else {
      setDeleteTarget(null);
      showToast(json.error || "삭제에 실패했습니다", false);
    }
  };

  /* 구인공고 수정 저장 */
  const handleJobSave = async (updated: Partial<JobPosting>) => {
    const res = await fetch("/api/jobs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    const json = await res.json();
    if (res.ok) {
      setEditJob(null);
      fetchData("jobs");
      showToast("공고를 저장했습니다");
    } else {
      showToast(json.error || "저장에 실패했습니다", false);
    }
  };

  /* 구인공고 삭제 */
  const handleJobDelete = async (id: string) => {
    const res = await fetch(`/api/jobs?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) {
      setDeleteTarget(null);
      setJobs(prev => prev.filter(j => j.id !== id));
      showToast("공고를 삭제했습니다");
    } else {
      setDeleteTarget(null);
      showToast(json.error || "삭제에 실패했습니다", false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gray-900 text-white px-5 pt-10 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">관리자 대시보드</h1>
            <p className="text-gray-400 text-sm mt-1">건설현장 인력 플랫폼</p>
          </div>
          <button onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors">
            로그아웃
          </button>
        </div>
      </div>

      {/* 토스트 알림 */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold transition-all
          ${toast.ok ? "bg-green-600" : "bg-red-500"}`}>
          {toast.ok ? "✅ " : "❌ "}{toast.msg}
        </div>
      )}

      {/* 탭 */}
      <div className="bg-white border-b border-gray-200 flex">
        {(["workers", "jobs", "matches"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors
              ${tab === t ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-500"}`}>
            {t === "workers" ? `구직자 ${workers.length > 0 ? `(${workers.length})` : ""}` : t === "jobs" ? `구인공고 ${jobs.length > 0 ? `(${jobs.length})` : ""}` : "매칭현황"}
          </button>
        ))}
      </div>

      <div className="px-4 py-5">
        {loading && <div className="text-center py-10 text-gray-500">불러오는 중...</div>}
        {!loading && fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4 text-red-600 text-sm text-center">
            ⚠️ {fetchError}
            <button onClick={() => fetchData(tab)} className="ml-3 underline font-semibold">다시 시도</button>
          </div>
        )}

        {/* ── 구직자 목록 ── */}
        {!loading && tab === "workers" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 font-medium">총 {workers.length}명 등록</div>
              <button onClick={exportWorkers} disabled={workers.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40
                           text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                📊 엑셀 내보내기
              </button>
            </div>
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
                <div className="flex flex-wrap gap-1.5 text-xs mb-3">
                  <span className="badge bg-orange-100 text-orange-700">{w.job_category}</span>
                  <span className="badge bg-blue-100 text-blue-700">{w.skill_level}</span>
                  <span className="badge bg-gray-100 text-gray-600">{w.city}</span>
                  {w.experience_years > 0 && <span className="badge bg-gray-100 text-gray-600">경력 {w.experience_years}년</span>}
                  {w.age && <span className="badge bg-gray-100 text-gray-600">{w.age}세</span>}
                  {(w as Worker & { gender?: string }).gender && (
                    <span className="badge bg-purple-100 text-purple-700">{(w as Worker & { gender?: string }).gender === "남" ? "👨 남" : "👩 여"}</span>
                  )}
                </div>
                {w.certifications?.length ? (
                  <div className="text-xs text-gray-500 mb-3">자격증: {w.certifications.join(", ")}</div>
                ) : null}
                {/* 수정·삭제 버튼 */}
                <div className="flex gap-2 border-t border-gray-100 pt-3">
                  <button onClick={() => setEditWorker(w)}
                    className="flex-1 py-2 text-sm font-semibold rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors">
                    ✏️ 수정
                  </button>
                  <button onClick={() => setDeleteTarget({ type: "worker", id: w.id, name: w.name })}
                    className="flex-1 py-2 text-sm font-semibold rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                    🗑️ 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 구인 공고 목록 ── */}
        {!loading && tab === "jobs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 font-medium">총 {jobs.length}건</div>
              <button onClick={exportJobs} disabled={jobs.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40
                           text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                📊 엑셀 내보내기
              </button>
            </div>
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
                  {(j as JobPosting & { meal_provided?: boolean }).meal_provided && " · 🍱 식사"}
                </div>
                <div className="text-xs text-gray-500 mt-1 mb-3">
                  {new Date(j.work_start_date).toLocaleDateString("ko-KR")} 시작
                  {j.work_end_date ? ` ~ ${new Date(j.work_end_date).toLocaleDateString("ko-KR")}` : ""}
                </div>
                {/* 수정·삭제 버튼 */}
                <div className="flex gap-2 border-t border-gray-100 pt-3">
                  <button onClick={() => setEditJob(j)}
                    className="flex-1 py-2 text-sm font-semibold rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    ✏️ 수정
                  </button>
                  <button onClick={() => setDeleteTarget({ type: "job", id: j.id, name: j.company_name })}
                    className="flex-1 py-2 text-sm font-semibold rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                    🗑️ 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 매칭 현황 ── */}
        {!loading && tab === "matches" && (
          <div className="space-y-3">
            <div className="flex gap-3 text-xs text-center mb-4">
              {["pending", "interested", "not_interested"].map(r => (
                <div key={r} className={`flex-1 py-2 rounded-lg ${RESPONSE_BADGE[r]}`}>
                  <div className="font-bold text-lg">{matches.filter(m => m.response === r).length}</div>
                  <div>{RESPONSE_LABEL[r]}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 font-medium">총 {matches.length}건</div>
              <button onClick={exportMatches} disabled={matches.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40
                           text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                📊 엑셀 내보내기
              </button>
            </div>
            {matches.map(m => {
              const worker = m.worker as Worker | undefined;
              const job = m.job_posting as JobPosting | undefined;
              return (
                <div key={m.id} className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">매칭 ID: {m.id.slice(0, 8)}…</span>
                    <span className={`badge text-xs font-bold ${RESPONSE_BADGE[m.response]}`}>{RESPONSE_LABEL[m.response]}</span>
                  </div>
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
                          {worker.experience_years > 0 && <span className="badge bg-gray-100 text-gray-600">경력 {worker.experience_years}년</span>}
                          {worker.age && <span className="badge bg-gray-100 text-gray-600">{worker.age}세</span>}
                        </div>
                      </div>
                    ) : <div className="text-xs text-gray-400">정보 없음</div>}
                  </div>
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
                        <div className="text-sm text-gray-700 font-semibold">💰 일당 {job.daily_wage.toLocaleString()}원 · 👥 {job.workers_needed}명</div>
                        <div className="text-xs text-gray-500">담당: {job.contact_name} {job.contact_phone}</div>
                      </div>
                    ) : <div className="text-xs text-gray-400">정보 없음</div>}
                  </div>
                  <div className="text-xs text-gray-400 space-y-0.5 border-t border-gray-100 pt-2">
                    {m.notified_at && <div>📤 알림 발송: {new Date(m.notified_at).toLocaleString("ko-KR")}</div>}
                    {m.responded_at && <div>✅ 응답 시각: {new Date(m.responded_at).toLocaleString("ko-KR")}</div>}
                    {!m.notified_at && <div className="text-yellow-500">⏳ 아직 알림 미발송</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 수정 모달 */}
      {editWorker && (
        <WorkerEditModal worker={editWorker} onSave={handleWorkerSave} onClose={() => setEditWorker(null)} />
      )}
      {editJob && (
        <JobEditModal job={editJob} onSave={handleJobSave} onClose={() => setEditJob(null)} />
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <ConfirmModal
          message={`"${deleteTarget.name}"을(를) 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`}
          onConfirm={() => {
            if (deleteTarget.type === "worker") handleWorkerDelete(deleteTarget.id);
            else handleJobDelete(deleteTarget.id);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </main>
  );
}
