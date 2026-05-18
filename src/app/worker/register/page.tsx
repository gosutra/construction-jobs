"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  JOB_CATEGORIES, SKILL_LEVELS, CITIES, CERTIFICATIONS,
  type WorkerFormData,
} from "@/types";

const schema = z.object({
  // 필수 항목 (8개)
  name: z.string().min(2, "이름을 입력해주세요"),
  phone: z.string().regex(/^010\d{8}$/, "010으로 시작하는 11자리 숫자"),
  city: z.string().min(1, "거주 지역을 선택해주세요"),
  job_category: z.string().min(1, "직종을 선택해주세요"),
  skill_level: z.string().min(1, "숙련도를 선택해주세요"),
  experience_years: z.coerce.number().min(0).max(50),
  available_from: z.string().min(1, "근무 가능일을 선택해주세요"),
  age: z.coerce.number().min(18, "18세 이상").max(80, "80세 이하"),
  // 선택 항목 (7개)
  district: z.string().optional(),
  preferred_wage: z.coerce.number().optional(),
  need_accommodation: z.boolean().default(false),
  need_transportation: z.boolean().default(false),
  has_car: z.boolean().default(false),
  certifications: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEP_LABELS = ["기본 정보", "경력 정보", "근무 조건"];

export default function WorkerRegisterPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      need_accommodation: false,
      need_transportation: false,
      has_car: false,
      certifications: [],
      experience_years: 0,
    },
  });

  const certifications = watch("certifications") || [];

  const toggleCert = (cert: string) => {
    const updated = certifications.includes(cert)
      ? certifications.filter((c) => c !== cert)
      : [...certifications, cert];
    setValue("certifications", updated);
  };

  const nextStep = async () => {
    const fields: Record<number, (keyof FormData)[]> = {
      0: ["name", "phone", "age", "city"],
      1: ["job_category", "skill_level", "experience_years"],
    };
    const valid = await trigger(fields[step]);
    if (valid) setStep(s => s + 1);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "등록 실패");
      }
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
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">등록 완료!</h1>
        <p className="text-gray-600 text-center leading-relaxed mb-6">
          조건에 맞는 현장이 생기면<br />
          카카오 알림톡 또는 문자로 알려드립니다.
        </p>
        <div className="card w-full max-w-sm text-center">
          <p className="text-sm text-gray-500">
            📱 알림을 받으려면 카카오톡에서<br />
            <strong>건설현장 인력 플랫폼</strong> 채널을 추가해주세요
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-orange-500 text-white px-5 pt-10 pb-6">
        <h1 className="text-xl font-bold mb-1">구직 등록</h1>
        <p className="text-orange-100 text-sm">3분이면 완료됩니다</p>
        {/* 진행 단계 */}
        <div className="flex gap-2 mt-4">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-white" : "bg-orange-300"}`} />
              <p className={`text-xs mt-1 ${i <= step ? "text-white" : "text-orange-300"}`}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-6 space-y-5 max-w-lg mx-auto">
        {/* ── STEP 0: 기본 정보 ── */}
        {step === 0 && (
          <>
            <div className="text-xs text-orange-600 font-semibold bg-orange-50 rounded-lg px-3 py-2">
              ✨ 필수 항목 4개 — 1분이면 됩니다
            </div>

            <div>
              <label className="form-label">이름 *</label>
              <input {...register("name")} className="form-input" placeholder="홍길동" />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            <div>
              <label className="form-label">휴대폰 번호 * (알림 수신)</label>
              <input
                {...register("phone")}
                className="form-input"
                placeholder="01012345678"
                inputMode="numeric"
                maxLength={11}
              />
              {errors.phone && <p className="form-error">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="form-label">나이 *</label>
              <input
                {...register("age")}
                type="number"
                className="form-input"
                placeholder="35"
                inputMode="numeric"
              />
              {errors.age && <p className="form-error">{errors.age.message}</p>}
            </div>

            <div>
              <label className="form-label">거주 지역 (시/도) *</label>
              <select {...register("city")} className="form-select">
                <option value="">선택해주세요</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.city && <p className="form-error">{errors.city.message}</p>}
            </div>

            <div>
              <label className="form-label">구/군 (선택)</label>
              <input {...register("district")} className="form-input" placeholder="예: 강남구" />
            </div>
          </>
        )}

        {/* ── STEP 1: 경력 정보 ── */}
        {step === 1 && (
          <>
            <div className="text-xs text-orange-600 font-semibold bg-orange-50 rounded-lg px-3 py-2">
              💼 경력 정보 — 매칭 정확도가 높아집니다
            </div>

            <div>
              <label className="form-label">직종 *</label>
              <select {...register("job_category")} className="form-select">
                <option value="">선택해주세요</option>
                {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.job_category && <p className="form-error">{errors.job_category.message}</p>}
            </div>

            <div>
              <label className="form-label">숙련도 *</label>
              <div className="grid grid-cols-4 gap-2">
                {SKILL_LEVELS.map(level => (
                  <label key={level} className="cursor-pointer">
                    <input type="radio" {...register("skill_level")} value={level} className="sr-only" />
                    <div className={`text-center py-3 rounded-xl border-2 font-semibold text-sm
                      transition-colors ${watch("skill_level") === level
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-gray-200 text-gray-600"}`}>
                      {level}
                    </div>
                  </label>
                ))}
              </div>
              {errors.skill_level && <p className="form-error">{errors.skill_level.message}</p>}
            </div>

            <div>
              <label className="form-label">경력 연수 *</label>
              <input
                {...register("experience_years")}
                type="number"
                className="form-input"
                placeholder="5"
                inputMode="numeric"
              />
            </div>

            <div>
              <label className="form-label">보유 자격증 (복수 선택 가능)</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {CERTIFICATIONS.map(cert => (
                  <label key={cert} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={certifications.includes(cert)}
                      onChange={() => toggleCert(cert)}
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-sm text-gray-700">{cert}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2: 근무 조건 ── */}
        {step === 2 && (
          <>
            <div className="text-xs text-orange-600 font-semibold bg-orange-50 rounded-lg px-3 py-2">
              🎯 근무 조건 — 딱 맞는 현장만 골라드립니다
            </div>

            <div>
              <label className="form-label">근무 가능 시작일 *</label>
              <input
                {...register("available_from")}
                type="date"
                className="form-input"
                min={new Date().toISOString().split("T")[0]}
              />
              {errors.available_from && <p className="form-error">{errors.available_from.message}</p>}
            </div>

            <div>
              <label className="form-label">희망 일당 (선택)</label>
              <div className="relative">
                <input
                  {...register("preferred_wage")}
                  type="number"
                  className="form-input pr-10"
                  placeholder="180000"
                  inputMode="numeric"
                />
                <span className="absolute right-3 top-3 text-gray-500 text-sm">원</span>
              </div>
            </div>

            {/* 조건 토글들 */}
            <div className="space-y-3">
              {[
                { field: "need_accommodation" as const, label: "🏠 숙소 제공 필요", desc: "현장 근처 숙소가 필요합니다" },
                { field: "need_transportation" as const, label: "🚌 교통 제공 필요", desc: "출퇴근 교통편이 필요합니다" },
                { field: "has_car" as const, label: "🚗 차량 보유", desc: "개인 차량으로 출퇴근 가능합니다" },
              ].map(({ field, label, desc }) => (
                <label key={field} className="flex items-center justify-between card cursor-pointer py-3">
                  <div>
                    <div className="font-medium text-sm text-gray-800">{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                  <div className={`relative w-12 h-6 rounded-full transition-colors
                    ${watch(field) ? "bg-orange-500" : "bg-gray-300"}`}
                    onClick={() => setValue(field, !watch(field))}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                      ${watch(field) ? "translate-x-6" : "translate-x-0.5"}`} />
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label className="form-label">특이사항 (선택)</label>
              <textarea
                {...register("notes")}
                className="form-input"
                rows={3}
                placeholder="예: 고소작업 불가, 야간작업 가능 등"
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
            <button type="button" onClick={nextStep} className="btn-primary">
              다음 단계 →
            </button>
          ) : (
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "등록 중..." : "구직 등록 완료 ✓"}
            </button>
          )}
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="w-full text-gray-500 text-sm py-2"
            >
              ← 이전으로
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
