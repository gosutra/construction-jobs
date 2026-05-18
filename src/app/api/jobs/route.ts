import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { findMatchingWorkers, filterAlreadyNotified } from "@/lib/matching";
import { notifyWorker } from "@/lib/notifications";
import type { JobPosting, Worker } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();

    // 1. 구인 공고 저장
    const { data: job, error: jobError } = await supabase
      .from("job_postings")
      .insert({
        company_name: body.company_name,
        contact_name: body.contact_name,
        contact_phone: body.contact_phone,
        location_city: body.location_city,
        location_district: body.location_district || null,
        location_address: body.location_address,
        job_category: body.job_category,
        skill_level_required: body.skill_level_required,
        workers_needed: body.workers_needed,
        daily_wage: body.daily_wage,
        work_start_date: body.work_start_date,
        work_end_date: body.work_end_date || null,
        age_min: body.age_min || null,
        age_max: body.age_max || null,
        accommodation_provided: body.accommodation_provided || false,
        transportation_provided: body.transportation_provided || false,
        required_documents: body.required_documents?.length ? body.required_documents : null,
        description: body.description || null,
        status: "open",
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // 2. 매칭 대상 구직자 자동 추출
    const candidates = await findMatchingWorkers(job as JobPosting);
    const workers = await filterAlreadyNotified(job.id, candidates);

    if (workers.length === 0) {
      return NextResponse.json({ success: true, matchCount: 0, jobId: job.id });
    }

    // 3. 매칭 레코드 생성
    const matchInserts = workers.map((w: Worker) => ({
      job_posting_id: job.id,
      worker_id: w.id,
    }));

    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .insert(matchInserts)
      .select();

    if (matchError) throw matchError;

    // 4. 알림 발송 (비동기 — 응답 속도 우선)
    const notifyPromises = (matches || []).map(async (match: { id: string; worker_id: string }) => {
      const worker = workers.find((w: Worker) => w.id === match.worker_id);
      if (!worker) return;

      const { method, success } = await notifyWorker(match as Parameters<typeof notifyWorker>[0], worker, job as JobPosting);

      // 알림 로그 저장
      await supabase.from("notification_logs").insert({
        match_id: match.id,
        method,
        recipient: worker.phone,
        status: success ? "sent" : "failed",
      });

      if (success) {
        await supabase.from("matches").update({ notified_at: new Date().toISOString() }).eq("id", match.id);
      }
    });

    // 백그라운드 발송 (응답은 즉시 반환)
    Promise.allSettled(notifyPromises).then(() => {
      supabase.from("job_postings").update({ notify_sent_at: new Date().toISOString() }).eq("id", job.id);
    });

    return NextResponse.json({ success: true, matchCount: workers.length, jobId: job.id });
  } catch (err) {
    console.error("Job posting error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

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
