import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase";
import { findMatchingWorkers, filterAlreadyNotified } from "@/lib/matching";
import { notifyWorker } from "@/lib/notifications";
import { requireAdmin } from "@/lib/apiAuth";
import type { JobPosting, Worker } from "@/types";

/* ── 허용된 업데이트 필드 화이트리스트 (Mass Assignment 방어) ── */
const ALLOWED_UPDATE_FIELDS = new Set([
  "company_name", "contact_name", "contact_phone",
  "location_city", "location_district", "location_address",
  "job_category", "skill_level_required", "workers_needed", "daily_wage",
  "work_start_date", "work_end_date", "age_min", "age_max",
  "gender_preference", "pay_day",
  "accommodation_provided", "transportation_provided", "meal_provided",
  "required_documents", "document_deadline", "description", "status",
]);

/* ── 서버측 입력 검증 스키마 ── */
const SKILL_LEVELS = ["조공", "준기공", "기공"] as const;

const jobInsertSchema = z.object({
  company_name:           z.string().min(1, "업체명 필수").max(100),
  contact_name:           z.string().min(1, "담당자명 필수").max(20),
  contact_phone:          z.string().regex(/^010\d{8}$/, "올바른 전화번호 형식 (010XXXXXXXX)"),
  location_city:          z.string().min(1, "지역 필수"),
  location_district:      z.string().optional().nullable(),
  location_address:       z.string().optional().nullable(),
  job_category:           z.string().min(1, "직종 필수"),
  skill_level_required:   z.enum(SKILL_LEVELS),
  workers_needed:         z.coerce.number().min(1).max(100),
  daily_wage:             z.coerce.number().min(10000, "일당은 10,000원 이상").max(10_000_000),
  work_start_date:        z.string().min(1, "시작일 필수"),
  work_end_date:          z.string().optional().nullable(),
  age_min:                z.coerce.number().min(18).max(80).optional().nullable(),
  age_max:                z.coerce.number().min(18).max(80).optional().nullable(),
  gender_preference:      z.enum(["남", "여", "성별무관"]).optional().nullable(),
  pay_day:                z.string().optional().nullable(),
  accommodation_provided: z.boolean(),
  transportation_provided: z.boolean(),
  meal_provided:          z.boolean(),
  required_documents:     z.array(z.string()).optional().nullable(),
  document_deadline:      z.string().optional().nullable(),
  description:            z.string().max(1000).optional().nullable(),
});

/* ── POST: 구인 공고 등록 ── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 서버측 유효성 검사
    const parsed = jobInsertSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "입력값 오류";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const supabase = createServiceClient();

    // 구인 공고 저장
    const { data: job, error: jobError } = await supabase
      .from("job_postings")
      .insert({
        company_name:           data.company_name,
        contact_name:           data.contact_name,
        contact_phone:          data.contact_phone,
        location_city:          data.location_city,
        location_district:      data.location_district ?? null,
        location_address:       data.location_address ?? null,
        job_category:           data.job_category,
        skill_level_required:   data.skill_level_required,
        workers_needed:         data.workers_needed,
        daily_wage:             data.daily_wage,
        work_start_date:        data.work_start_date,
        work_end_date:          data.work_end_date ?? null,
        age_min:                data.age_min ?? null,
        age_max:                data.age_max ?? null,
        gender_preference:      data.gender_preference ?? "성별무관",
        pay_day:                data.pay_day ?? null,
        accommodation_provided: data.accommodation_provided,
        transportation_provided: data.transportation_provided,
        meal_provided:          data.meal_provided,
        required_documents:     data.required_documents?.length ? data.required_documents : null,
        document_deadline:      data.document_deadline ?? null,
        description:            data.description ?? null,
        status:                 "open",
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // 매칭 대상 구직자 자동 추출
    const candidates = await findMatchingWorkers(job as JobPosting);
    const workers    = await filterAlreadyNotified(job.id, candidates);

    if (workers.length === 0) {
      return NextResponse.json({ success: true, matchCount: 0, jobId: job.id });
    }

    // 매칭 레코드 생성
    const matchInserts = workers.map((w: Worker) => ({
      job_posting_id: job.id,
      worker_id: w.id,
    }));

    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .insert(matchInserts)
      .select();

    if (matchError) throw matchError;

    // 알림 발송 (비동기 백그라운드)
    const notifyPromises = (matches || []).map(async (match: { id: string; worker_id: string }) => {
      const worker = workers.find((w: Worker) => w.id === match.worker_id);
      if (!worker) return;

      const { method, success } = await notifyWorker(
        match as Parameters<typeof notifyWorker>[0],
        worker,
        job as JobPosting
      );

      await supabase.from("notification_logs").insert({
        match_id:  match.id,
        method,
        recipient: worker.phone,
        status:    success ? "sent" : "failed",
      });

      if (success) {
        await supabase.from("matches").update({ notified_at: new Date().toISOString() }).eq("id", match.id);
      }
    });

    Promise.allSettled(notifyPromises).then(() => {
      supabase.from("job_postings")
        .update({ notify_sent_at: new Date().toISOString() })
        .eq("id", job.id);
    });

    return NextResponse.json({ success: true, matchCount: workers.length, jobId: job.id });
  } catch (err) {
    console.error("Job posting error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

/* ── PUT: 구인 공고 수정 (관리자 전용) ── */
export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, ...rawFields } = body;
    if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

    // 화이트리스트 필터링
    const safeFields = Object.fromEntries(
      Object.entries(rawFields).filter(([k]) => ALLOWED_UPDATE_FIELDS.has(k))
    );

    if (Object.keys(safeFields).length === 0) {
      return NextResponse.json({ error: "수정 가능한 필드가 없습니다" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from("job_postings").update(safeFields).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Job update error:", err);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

/* ── DELETE: 구인 공고 삭제 (관리자 전용) ── */
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase.from("job_postings").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Job delete error:", err);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}

/* ── GET: 구인 공고 목록 조회 ── */
export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("job_postings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data, count: data?.length });
}
