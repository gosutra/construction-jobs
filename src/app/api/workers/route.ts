import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { calcAgeFromBirthDate } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();

    // birth_date(YYMMDD) → age 계산
    const age = body.birth_date ? calcAgeFromBirthDate(body.birth_date) : (body.age ?? null);

    const { error } = await supabase.from("workers").insert({
      name: body.name,
      phone: body.phone,
      birth_date: body.birth_date || null,
      age,
      gender: body.gender || null,
      city: body.city,
      district: body.district || null,
      job_category: body.job_category,
      skill_level: body.skill_level,
      experience_years: body.experience_years || 0,
      available_from: body.available_from || null,
      preferred_wage: body.preferred_wage || null,
      need_accommodation: body.need_accommodation || false,
      need_transportation: body.need_transportation || false,
      has_car: body.has_car || false,
      certifications: body.certifications?.length ? body.certifications : null,
      notes: body.notes || null,
      is_active: true,
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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });

    const supabase = createServiceClient();
    if (fields.birth_date) {
      fields.age = calcAgeFromBirthDate(fields.birth_date);
    }
    const { error } = await supabase.from("workers").update(fields).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Worker update error:", err);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  const isAdmin = searchParams.get("admin") === "true";
  let query = isAdmin
    ? supabase.from("workers").select("*")
    : supabase.from("workers").select("*").eq("is_active", true);

  if (searchParams.get("city")) query = query.eq("city", searchParams.get("city")!);
  if (searchParams.get("job_category")) query = query.eq("job_category", searchParams.get("job_category")!);
  if (searchParams.get("skill_level")) query = query.eq("skill_level", searchParams.get("skill_level")!);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ workers: data, count: data?.length });
}
