"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { JOB_CATEGORIES, SKILL_LEVELS, CITIES } from "@/types";

const REQUIRED_DOCS = [
  "주민등록증", "외국인등록증", "건강보험자격득실확인서",
  "건설기초안전보건이수증", "배치전건강진단표", "비계이수증",
  "기능사자격증", "경력증명서", "통장사본",
];

const schema = z.object({
  company_name: z.string().min(2, "업체명을 입력해주세요"),
  contact_name: z.string().min(2, "담당자명을 입력해주세요"),
  contact_phone: z.string().regex(/^010\d{8}$/, "010으로 시작하는 11자리"),
  location_city: z.string().min(1, "현장 지역을 선택해주세요"),
  location_district: z.string().optional(),
  location_address: z.string().min(2, "현장 주소를 입력해주세요"),
  job_category: z.string().min(1, "공종을 선택해주세요"),
  skill_level_required: z.string().min(1, "필요 숙련도를 선택해주세요"),
  workers_needed: z.coerce.number().min(1, "최소 1명"),
  daily_wage: z.coerce.number().min(50000, "일당을 입력해주세요"),
  work_start_date: z.string().min(1, "시작일을 선택해주세요"),
  work_end_date: z.string().optional(),
  age_min: z.coerce.number().optional(),
  age_max: z.coerce.number().optional(),
  accommodation_provided: z.boolean().default(false),
  transportation_provided: z.boolean().default(false),
  meal_provided: z.boolean().default(false),
  required_documents: z.array(z.string()).default([]),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEP_LABELS = ["업체 정보", "현장 조건", "근무 조건"];

export default function EmployerPostPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      workers_needed: 1,
      accommodation_provided: false,
      transportation_provided: false,
      meal_provided: false,
      required_documents: [],
    },
  });

  const requiredDocs = watch("required_documents") || [];
  const toggleDoc = (doc: string) => {
    const updated = requiredDocs.includes(doc)
      ? requiredDocs.filter(d => d !== doc)
      : [...requiredDocs, doc];
    setValue("required_documents", updated);
  };

  const nextStep = async () => {
    const fields: Record<number, (keyof FormData)[]> = {
      0: ["company_name", "contact_name", "contact_phone"],
      1: ["location_city", "location_address", "job_category", "skill_level_required"],
    };
    const valid = await trigger(fields[step]);
    if (valid) setStep(s => s + 1);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "접수 실패");
      }
      const json = await res.json();
      setMatchCount(json.matchCount || 0);
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">구인 공고 접수 완료!</h1>
        <div className="card w-full max-w-sm text-center mb-6">
          <p className="text-4xl font-bold text-orange-500 mb-1">{matchCount}명</p>
          <p className="text-gray-600 text-sm">조건에 맞는 구직자에게<br />카카오 알림을 발송했습니다</p>
        </div>
        <p className="text-sm text-gray-500 text-center">
          지원 의향을 밝힌 구직자 정보는<br />
          담당자 번호로 문자 안내됩니다
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-blue-600 text-white px-5 pt-10 pb-6">
        <h1 className="text-xl font-bold mb-1">구인 공고 등록</h1>
        <p className="text-blue-100 text-sm">조건 입력 후 자동 매칭이 시작됩니다</p>
        <div className="flex gap-2 mt-4">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-white" : "bg-blue-400"}`} />
              <p className={`text-xs mt-1 ${i <= step ? "text-white" : "text-blue-300"}`}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-6 space-y-5 max-w-lg mx-auto">
        {/* ── STEP 0: 업체 정보 ── */}
        {step === 0 && (
          <>
            <div>
              <label className="form-label">업체명 *</label>
              <input {...register("company_name")} className="form-input" placeholder="(주)OO건설" />
              {errors.company_name && <p className="form-error">{errors.company_name.message}</p>}
            </div>
            <div>
              <label className="form-label">담당자명 *</label>
              <input {...register("contact_name")} className="form-input" placeholder="김담당" />
              {errors.contact_name && <p className="form-error">{errors.contact_name.message}</p>}
            </div>
            <div>
              <label className="form-label">담당자 연락처 *</label>
              <input
                {...register("contact_phone")}
                className="form-input"
                placeholder="01012345678"
                inputMode="numeric"
                maxLength={11}
              />
              {errors.contact_phone && <p className="form-error">{errors.contact_phone.message}</p>}
            </div>
          </>
        )}

        {/* ── STEP 1: 현장 조건 ── */}
        {step === 1 && (
          <>
            <div>
              <label className="form-label">현장 지역 (시/도) *</label>
              <select {...register("location_city")} className="form-select">
                <option value="">선택해주세요</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.location_city && <p className="form-error">{errors.location_city.message}</p>}
            </div>
            <div>
              <label className="form-label">구/군 (선택)</label>
              <input {...register("location_district")} className="form-input" placeholder="예: 강남구" />
            </div>
            <div>
              <label className="form-label">현장 상세 주소 *</label>
              <input {...register("location_address")} className="form-input" placeholder="예: 강남구 테헤란로 123" />
              {errors.location_address && <p className="form-error">{errors.location_address.message}</p>}
            </div>
            <div>
              <label className="form-label">공종 (직종) *</label>
              <select {...register("job_category")} className="form-select">
                <option value="">선택해주세요</option>
                {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.job_category && <p className="form-error">{errors.job_category.message}</p>}
            </div>
            <div>
              <label className="form-label">필요 숙련도 *</label>
              <div className="grid grid-cols-3 gap-2">
                {SKILL_LEVELS.map(level => (
                  <label key={level} className="cursor-pointer">
                    <input type="radio" {...register("skill_level_required")} value={level} className="sr-only" />
                    <div className={`text-center py-3 rounded-xl border-2 font-semibold text-sm transition-colors
                      ${watch("skill_level_required") === level
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-gray-200 text-gray-600"}`}>
                      {level}
                    </div>
                  </label>
                ))}
              </div>
              {errors.skill_level_required && <p className="form-error">{errors.skill_level_required.message}</p>}
            </div>
          </>
        )}

        {/* ── STEP 2: 근무 조건 ── */}
        {step === 2 && (
          <>
            <div className="text-xs text-blue-600 font-semibold bg-blue-50 rounded-lg px-3 py-2">
              💡 알림 메시지에 모두 표시됩니다 — 재확인 전화가 줄어듭니다
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">필요 인원 *</label>
                <input
                  {...register("workers_needed")}
                  type="number"
                  className="form-input"
                  placeholder="3"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="form-label">일당 *</label>
                <input
                  {...register("daily_wage")}
                  type="number"
                  className="form-input"
                  placeholder="200000"
                  inputMode="numeric"
                />
                {errors.daily_wage && <p className="form-error">{errors.daily_wage.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">근무 시작일 *</label>
                <input
                  {...register("work_start_date")}
                  type="date"
                  className="form-input"
                  min={new Date().toISOString().split("T")[0]}
                />
                {errors.work_start_date && <p className="form-error">{errors.work_start_date.message}</p>}
              </div>
              <div>
                <label className="form-label">종료 예정일</label>
                <input {...register("work_end_date")} type="date" className="form-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">연령 하한</label>
                <input {...register("age_min")} type="number" className="form-input" placeholder="20" inputMode="numeric" />
              </div>
              <div>
                <label className="form-label">연령 상한</label>
                <input {...register("age_max")} type="number" className="form-input" placeholder="60" inputMode="numeric" />
              </div>
            </div>

            <div className="space-y-3">
              {[
                { field: "accommodation_provided" as const, label: "🏠 숙소 제공" },
                { field: "transportation_provided" as const, label: "🚌 교통 제공" },
                { field: "meal_provided" as const, label: "🍱 식사 제공" },
              ].map(({ field, label }) => (
                <label key={field} className="flex items-center justify-between card cursor-pointer py-3">
                  <span className="font-medium text-sm text-gray-800">{label}</span>
                  <div
                    className={`relative w-12 h-6 rounded-full transition-colors ${watch(field) ? "bg-blue-500" : "bg-gray-300"}`}
                    onClick={() => setValue(field, !watch(field))}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                      ${watch(field) ? "translate-x-6" : "translate-x-0.5"}`} />
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label className="form-label">필요 서류 (복수 선택)</label>
              <div className="grid grid-cols-2 gap-2">
                {REQUIRED_DOCS.map(doc => (
                  <label key={doc} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiredDocs.includes(doc)}
                      onChange={() => toggleDoc(doc)}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-gray-700">{doc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">현장 특이사항 (선택)</label>
              <textarea
                {...register("description")}
                className="form-input"
                rows={3}
                placeholder="예: 야간작업 있음, 안전화 지참 필수 등"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}
          </>
        )}

        {/* 하단 버튼 */}
        <div className="pt-2 space-y-3">
          {step < 2 ? (
            <button type="button" onClick={nextStep}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors">
              다음 단계 →
            </button>
          ) : (
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors">
              {loading ? "접수 중..." : "공고 접수 + 자동 매칭 시작 ✓"}
            </button>
          )}
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="w-full text-gray-500 text-sm py-2">
              ← 이전으로
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
