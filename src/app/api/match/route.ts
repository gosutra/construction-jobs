import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// 구직자 응답 처리
export async function PATCH(req: NextRequest) {
  try {
    const { matchId, response } = await req.json();
    if (!matchId || !["interested", "not_interested"].includes(response)) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { data: match, error: fetchError } = await supabase
      .from("matches")
      .select("*, job_postings(*), workers(*)")
      .eq("id", matchId)
      .single();
    if (fetchError || !match) {
      return NextResponse.json({ error: "매칭 정보를 찾을 수 없습니다" }, { status: 404 });
    }
    if (match.response !== "pending") {
      return NextResponse.json({ error: "이미 응답하셨습니다", response: match.response }, { status: 409 });
    }
    const { error: updateError } = await supabase
      .from("matches")
      .update({ response, responded_at: new Date().toISOString() })
      .eq("id", matchId);
    if (updateError) throw updateError;

    if (response === "interested" && match.job_postings && match.workers) {
      const job = match.job_postings;
      const worker = match.workers;
      const message = `[지원자 알림] ${worker.name}님이 지원 의향을 밝혔습니다.\n연락처: ${worker.phone}\n직종: ${worker.job_category} (${worker.skill_level})\n거주: ${worker.city} / 경력: ${worker.experience_years}년`;
      try {
        const { sendSMS } = await import("@/lib/notifications");
        await sendSMS(job.contact_phone, message);
      } catch { /* SMS 실패해도 계속 */ }
    }
    return NextResponse.json({ success: true, response });
  } catch (err) {
    console.error("Match response error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 매칭 현황 조회 (관리자 목록 또는 단건)
export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");
  const jobId = searchParams.get("jobId");

  // 단건 조회 (구직자 응답 페이지용)
  if (matchId) {
    const { data, error } = await supabase
      .from("matches")
      .select("response, notified_at, responded_at, job_postings(*), workers(name)")
      .eq("id", matchId)
      .single();
    if (error || !data) return NextResponse.json({ match: null });
    return NextResponse.json({
      match: {
        response: data.response,
        job: data.job_postings,
        worker: data.workers,
      },
    });
  }

  // 목록 조회 (관리자용)
  let query = supabase
    .from("matches")
    .select("*, workers(name, phone, job_category, skill_level, city, experience_years), job_postings(company_name, job_category, daily_wage, work_start_date)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (jobId) query = query.eq("job_posting_id", jobId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ matches: data, count: data?.length });
}