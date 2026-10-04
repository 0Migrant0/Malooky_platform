import { NextResponse } from "next/server";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import { lessonAccessible } from "@/lib/access";
import type { Access, Lesson, Level } from "@/lib/types";
import { apiErrorResponse, apiRoute, failedApiOperation } from "@/lib/api-error";

export const dynamic = "force-dynamic";

async function postProgress(req: Request) {
  const me = await getUserFromCookies({ throwOnError: true });
  if (!me) return apiErrorResponse(401, "تسجيل الدخول مطلوب");

  let body: Record<string, unknown> | null;
  try {
    const parsed: unknown = await req.json();
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return apiErrorResponse(400, "lessonId مطلوب");
  }
  if (!body) return apiErrorResponse(400, "lessonId مطلوب");
  const lessonId = String(body.lessonId || "");
  const completed = Boolean(body.completed);
  if (!lessonId) return apiErrorResponse(400, "lessonId مطلوب");

  const db = supabaseAdmin();
  const { data: lesson, error: lessonError } = await db.from("lessons")
    .select("id,level_id,is_free_preview")
    .eq("id", lessonId)
    .maybeSingle();
  if (lessonError) return failedApiOperation("/api/progress", lessonError);
  if (!lesson) return apiErrorResponse(404, "الدرس غير موجود");

  const { data: level, error: levelError } = await db.from("levels")
    .select("id,course_id,relation,is_free,sort")
    .eq("id", lesson.level_id)
    .maybeSingle();
  if (levelError) return failedApiOperation("/api/progress", levelError);
  if (!level) return apiErrorResponse(404, "المستوى غير موجود");

  const { data: course, error: courseError } = await db.from("courses").select("is_published")
    .eq("id", level.course_id).maybeSingle();
  if (courseError) return failedApiOperation("/api/progress", courseError);
  if (!course?.is_published) return apiErrorResponse(404, "الكورس غير متاح");

  const [levelsResult, accessResult] = await Promise.all([
    db.from("levels").select("id,course_id,relation,is_free,sort")
      .eq("course_id", level.course_id).order("sort"),
    db.from("access").select("course_id,level_id,source").eq("user_id", me.id),
  ]);
  if (levelsResult.error) return failedApiOperation("/api/progress", levelsResult.error);
  if (accessResult.error) return failedApiOperation("/api/progress", accessResult.error);
  const { data: levels } = levelsResult;
  const { data: access } = accessResult;
  const courseLevels = (levels || []) as Level[];
  const levelIds = courseLevels.map((row) => row.id);
  const lessonsResult = levelIds.length
    ? await db.from("lessons").select("id,level_id,is_free_preview,sort")
      .in("level_id", levelIds).order("sort")
    : { data: [], error: null };
  if (lessonsResult.error) return failedApiOperation("/api/progress", lessonsResult.error);
  const { data: lessons } = lessonsResult;
  const lessonRows = (lessons || []) as Lesson[];
  const lessonIds = lessonRows.map((row) => row.id);
  const progressResult = lessonIds.length
    ? await db.from("progress").select("lesson_id,completed")
      .eq("user_id", me.id).in("lesson_id", lessonIds)
    : { data: [], error: null };
  if (progressResult.error) return failedApiOperation("/api/progress", progressResult.error);
  const { data: progress } = progressResult;

  if (!lessonAccessible(
    lesson as Lesson,
    courseLevels,
    (access || []) as Access[],
    progress || [],
    lessonRows,
  )) {
    return apiErrorResponse(403, "غير مصرّح بهذا الدرس");
  }

  const { error } = await db
    .from("progress")
    .upsert(
      { user_id: me.id, lesson_id: lessonId, completed, updated_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" },
    );
  if (error) return failedApiOperation("/api/progress", error);
  return NextResponse.json({ ok: true });
}

export const POST = apiRoute("/api/progress", postProgress);
