import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase";
import { calcAgeFromBirthDate } from "@/types";
import { requireAdmin } from "@/lib/apiAuth";

/* ── 허용된 업데이트 필드 화이트리스트 (Mass Assignment 방어) ── */
const ALLOWED_UPDATE_FIELDS = new Set([
  "name", "phone", "birth_date", "age", "gender", "city", "district",
  "job_category", "skill_level", "experience_years", "available_from",
  "preferred_wage", "need_accommodation", "need_transportation", "has_car",
  "certifications", "notes", "is_active",
]);

/* ── 서버측 입력 검증 스키마 ── */
const SKILL_LEVELS = ["조공", "준기공", "기공"] as const;

const workerInsertSchema = z.object({
  name:                z.string().min(2, "이름은 2자 이상").max(20),
  phone:               z.string().regex(/^010\d{8}$/, "올바른 전화번호 형식 (010XXXXXXXX)"),
  birth_date:          z.string().regex(/^\d{6}$/).optional().nullable(),
  gender:              z.enum(["남", "여"]).optional().nullable(),
  city:                z.string().min(1),
  district:            z.string().optional().nullable(),
  job_category:        z.string().min(1),
  skill_level:         z.enum(SKILL_LEVELS),
  experience_years:    z.coerce.number().min(0).max(50),
  available_from:      z.string().min(1),
  preferred_wage:      z.coerce.number().min(0).optional().nullable(),
  need_accommodation:  z.boolean(),
  need_transportation: z.boolean(),
  has_car:             z.boolean(),
  certifications:      z.array(z.string()).optional().nullable(),
  notes:               z.string().max(500).optional().nullable(),
  privacy_agreed:      z.boolean().optional(), // UI 전용, DB 저장 안 함
});

/* ── POST: 구직자 등록 ── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 서버측 유효성 검사
    const parsed = workerInsertSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "입력값 오류";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const supabase = createServiceClient();

    const age = data.birth_date ? calcAgeFromBirthDate(data.birth_date) : null;

    const { error } = await supabase.from("workers").insert({
      name:                data.name,
      phone:               data.phone,
      birth_date:          data.birth_date ?? null,
      age,
      gender:              data.gender ?? null,
      city:                data.city,
      district:            data.district ?? null,
      job_category:        data.job_category,
      skill_level:         data.skill_level,
      experience_years:    data.experience_years ?? 0,
      available_from:      data.available_from ?? null,
      preferred_wage:      data.preferred_wage ?? null,
      need_accommodation:  data.need_accommodation,
      need_transportation: data.need_transportation,
      has_car:             data.has_car,
      certifications:      data.certifications?.length ? data.certifications : null,
      notes:               data.notes ?? null,
      is_active:           true,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "이미 등록된 휴대폰 번호입니다" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Worker registration error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

/* ── PUT: 구직자 수정 (관리자 전용) ── */
export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, ...rawFields } = body;
    if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

    // 화이트리스트 필터링 (허용 필드만 업데이트)
    const safeFields = Object.fromEntries(
      Object.entries(rawFields).filter(([k]) => ALLOWED_UPDATE_FIELDS.has(k))
    );

    if (Object.keys(safeFields).length === 0) {
      return NextResponse.json({ error: "수정 가능한 필드가 없습니다" }, { status: 400 });
    }

    // birth_date 변경 시 age 재계산
    if (safeFields.birth_date) {
      safeFields.age = calcAgeFromBirthDate(String(safeFields.birth_date));
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from("workers").update(safeFields).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Worker update error:", err);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

/* ── DELETE: 구직자 삭제 (관리자 전용) ── */
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase.from("workers").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Worker delete error:", err);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}

/* ── GET: 구직자 목록 조회 ── */
export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const isAdmin = searchParams.get("admin") === "true";
  let query = isAdmin
    ? supabase.from("workers").select("*")
    : supabase.from("workers").select("*").eq("is_active", true);

  if (searchParams.get("city"))         query = query.eq("city", searchParams.get("city")!);
  if (searchParams.get("job_category")) query = query.eq("job_category", searchParams.get("job_category")!);
  if (searchParams.get("skill_level"))  query = query.eq("skill_level", searchParams.get("skill_level")!);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ workers: data, count: data?.length });
}
