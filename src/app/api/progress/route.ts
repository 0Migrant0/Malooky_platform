import { NextResponse } from "next/server";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import { lessonAccessible } from "@/lib/access";
import type { Access, Lesson, Level } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getUserFromCookies().catch(() => null);
  if (!me) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const lessonId = String(body?.lessonId || "");
  const completed = Boolean(body?.completed);
  if (!lessonId) return NextResponse.json({ error: "lessonId مطلوب" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: lesson } = await db.from("lessons")
    .select("id,level_id,is_free_preview")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });

  const { data: level } = await db.from("levels")
    .select("id,course_id,relation,is_free,sort")
    .eq("id", lesson.level_id)
    .maybeSingle();
  if (!level) return NextResponse.json({ error: "المستوى غير موجود" }, { status: 404 });

  const { data: course } = await db.from("courses").select("is_published")
    .eq("id", level.course_id).maybeSingle();
  if (!course?.is_published) return NextResponse.json({ error: "الكورس غير متاح" }, { status: 404 });

  const [{ data: levels }, { data: access }] = await Promise.all([
    db.from("levels").select("id,course_id,relation,is_free,sort")
      .eq("course_id", level.course_id).order("sort"),
    db.from("access").select("course_id,level_id,source").eq("user_id", me.id),
  ]);
  const courseLevels = (levels || []) as Level[];
  const levelIds = courseLevels.map((row) => row.id);
  const { data: lessons } = levelIds.length
    ? await db.from("lessons").select("id,level_id,is_free_preview,sort")
      .in("level_id", levelIds).order("sort")
    : { data: [] };
  const lessonRows = (lessons || []) as Lesson[];
  const lessonIds = lessonRows.map((row) => row.id);
  const { data: progress } = lessonIds.length
    ? await db.from("progress").select("lesson_id,completed")
      .eq("user_id", me.id).in("lesson_id", lessonIds)
    : { data: [] };

  if (!lessonAccessible(
    lesson as Lesson,
    courseLevels,
    (access || []) as Access[],
    progress || [],
    lessonRows,
  )) {
    return NextResponse.json({ error: "غير مصرّح بهذا الدرس" }, { status: 403 });
  }

  const { error } = await db
    .from("progress")
    .upsert(
      { user_id: me.id, lesson_id: lessonId, completed, updated_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
