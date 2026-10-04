import { NextResponse } from "next/server";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import { buildPlayback, bunnyConfigured } from "@/lib/bunny";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { videoSecurity } from "@/lib/tokens";
import { lessonAccessible, pickLang } from "@/lib/access";
import type { Access, Lesson, Level } from "@/lib/types";
import type { VideoLang } from "@/lib/i18n";
import { apiErrorResponse, apiRoute, failedApiOperation } from "@/lib/api-error";

export const dynamic = "force-dynamic";

/**
 * تذكرة تشغيل آمنة:
 *  1) مصادقة إلزامية
 *  2) تحقق وصول: معاينة مجانية أو مستوى مفتوح (تسلسل/شراء/استثناء)
 *  3) حد معدل
 *  4) إصدار رابط موقّع قصير الأجل — لا روابط دائمة
 */
async function postVideoTicket(req: Request) {
  const me = await getUserFromCookies({ throwOnError: true });
  if (!me) return apiErrorResponse(401, "تسجيل الدخول مطلوب");

  const rl = rateLimit(`vt:${me.id}:${clientIp(req)}`, videoSecurity.tokenRateLimit.limit, videoSecurity.tokenRateLimit.windowMs);
  if (!rl.ok) return apiErrorResponse(429, "طلبات كثيرة جداً");

  if (!bunnyConfigured()) {
    return apiErrorResponse(503, "إعدادات Bunny غير مكتملة — أضف مفاتيح البيئة (BUNNY_LIBRARY_ID, BUNNY_STREAM_KEY, BUNNY_TOKEN_AUTH_KEY)");
  }

  let body: Record<string, unknown> | null;
  try {
    const parsed: unknown = await req.json();
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return apiErrorResponse(400, "lessonId مطلوب");
  }
  if (!body) return apiErrorResponse(400, "lessonId مطلوب");
  const lessonId = String(body.lessonId || "");
  const requestedLang = String(body.lang || "ar");
  const lang: VideoLang = requestedLang === "en" ? "en" : "ar";
  if (!lessonId) return apiErrorResponse(400, "lessonId مطلوب");

  const db = supabaseAdmin();

  // Resolve entitlement before looking up any video identifiers or playback metadata.
  const { data: lesson, error: lessonError } = await db.from("lessons")
    .select("id,level_id,is_free_preview,langs")
    .eq("id", lessonId)
    .maybeSingle();
  if (lessonError) return failedApiOperation("/api/video-ticket", lessonError, "video");
  if (!lesson) return apiErrorResponse(404, "الدرس غير موجود");

  const { data: level, error: levelError } = await db.from("levels")
    .select("id,course_id,relation,is_free,sort")
    .eq("id", lesson.level_id)
    .maybeSingle();
  if (levelError) return failedApiOperation("/api/video-ticket", levelError, "video");
  if (!level) return apiErrorResponse(404, "المستوى غير موجود");

  const { data: course, error: courseError } = await db.from("courses").select("is_published")
    .eq("id", level.course_id).maybeSingle();
  if (courseError) return failedApiOperation("/api/video-ticket", courseError, "video");
  if (!course?.is_published) return apiErrorResponse(404, "الكورس غير متاح");

  const [siblingsResult, accessResult] = await Promise.all([
    db.from("levels").select("id,course_id,relation,is_free,sort")
      .eq("course_id", level.course_id).order("sort"),
    db.from("access").select("course_id,level_id,source").eq("user_id", me.id),
  ]);
  if (siblingsResult.error) return failedApiOperation("/api/video-ticket", siblingsResult.error, "video");
  if (accessResult.error) return failedApiOperation("/api/video-ticket", accessResult.error, "video");
  const { data: siblings } = siblingsResult;
  const { data: access } = accessResult;
  const levels = (siblings || []) as Level[];
  const levelIds = levels.map((row) => row.id);
  const lessonsResult = levelIds.length
    ? await db.from("lessons").select("id,level_id,is_free_preview,sort")
      .in("level_id", levelIds).order("sort")
    : { data: [], error: null };
  if (lessonsResult.error) return failedApiOperation("/api/video-ticket", lessonsResult.error, "video");
  const { data: lessons } = lessonsResult;
  const lessonRows = (lessons || []) as Lesson[];
  const lessonIds = lessonRows.map((row) => row.id);
  const progressResult = lessonIds.length
    ? await db.from("progress").select("lesson_id,completed")
      .eq("user_id", me.id).in("lesson_id", lessonIds)
    : { data: [], error: null };
  if (progressResult.error) return failedApiOperation("/api/video-ticket", progressResult.error, "video");
  const { data: progress } = progressResult;

  if (!lessonAccessible(
    lesson as Lesson,
    levels,
    (access || []) as Access[],
    progress || [],
    lessonRows,
  )) {
    return apiErrorResponse(403, "غير مصرّح — أكمل المستوى السابق أو سجّل في الكورس");
  }

  const { data: videoRow, error: videoError } = await db
    .from("lesson_videos")
    .select("bunny_video_id")
    .eq("lesson_id", lessonId)
    .eq("lang", pickLang(lesson as Lesson, lang))
    .maybeSingle();
  if (videoError) return failedApiOperation("/api/video-ticket", videoError, "video");

  // Backward compatibility for lessons that store a single video ID directly.
  const legacyResult = videoRow?.bunny_video_id
    ? { data: null, error: null }
    : await db.from("lessons").select("bunny_video_id").eq("id", lessonId).maybeSingle();
  if (legacyResult.error) return failedApiOperation("/api/video-ticket", legacyResult.error, "video");
  const { data: legacyVideo } = legacyResult;
  const videoId = videoRow?.bunny_video_id || legacyVideo?.bunny_video_id;
  if (!videoId) return apiErrorResponse(404, "لا يوجد فيديو مرفوع لهذه اللغة بعد");

  // 3) إصدار الرابط الموقّع
  const pb = buildPlayback(videoId, { lang });
  return NextResponse.json({ embedUrl: pb.embedUrl, expiresAt: pb.expiresAt });
}

export const POST = apiRoute("/api/video-ticket", postVideoTicket, "video");
