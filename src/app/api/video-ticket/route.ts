import { NextResponse } from "next/server";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import { buildPlayback, bunnyConfigured } from "@/lib/bunny";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { videoSecurity } from "@/lib/tokens";
import { lessonAccessible, pickLang } from "@/lib/access";
import type { Access, Lesson, Level } from "@/lib/types";
import type { VideoLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/**
 * تذكرة تشغيل آمنة:
 *  1) مصادقة إلزامية
 *  2) تحقق وصول: معاينة مجانية أو مستوى مفتوح (تسلسل/شراء/استثناء)
 *  3) حد معدل
 *  4) إصدار رابط موقّع قصير الأجل — لا روابط دائمة
 */
export async function POST(req: Request) {
  const me = await getUserFromCookies().catch(() => null);
  if (!me) return NextResponse.json({ error: "تسجيل الدخول مطلوب" }, { status: 401 });

  const rl = rateLimit(`vt:${me.id}:${clientIp(req)}`, videoSecurity.tokenRateLimit.limit, videoSecurity.tokenRateLimit.windowMs);
  if (!rl.ok) return NextResponse.json({ error: "طلبات كثيرة جداً" }, { status: 429 });

  if (!bunnyConfigured()) {
    return NextResponse.json(
      { error: "إعدادات Bunny غير مكتملة — أضف مفاتيح البيئة (BUNNY_LIBRARY_ID, BUNNY_STREAM_KEY, BUNNY_TOKEN_AUTH_KEY)" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const lessonId = String(body?.lessonId || "");
  const requestedLang = String(body?.lang || "ar");
  const lang: VideoLang = requestedLang === "en" ? "en" : "ar";
  if (!lessonId) return NextResponse.json({ error: "lessonId مطلوب" }, { status: 400 });

  const db = supabaseAdmin();

  // Resolve entitlement before looking up any video identifiers or playback metadata.
  const { data: lesson } = await db.from("lessons")
    .select("id,level_id,is_free_preview,langs")
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

  const [{ data: siblings }, { data: access }] = await Promise.all([
    db.from("levels").select("id,course_id,relation,is_free,sort")
      .eq("course_id", level.course_id).order("sort"),
    db.from("access").select("course_id,level_id,source").eq("user_id", me.id),
  ]);
  const levels = (siblings || []) as Level[];
  const levelIds = levels.map((row) => row.id);
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
    levels,
    (access || []) as Access[],
    progress || [],
    lessonRows,
  )) {
    return NextResponse.json({ error: "غير مصرّح — أكمل المستوى السابق أو سجّل في الكورس" }, { status: 403 });
  }

  const { data: videoRow } = await db
    .from("lesson_videos")
    .select("bunny_video_id")
    .eq("lesson_id", lessonId)
    .eq("lang", pickLang(lesson as Lesson, lang))
    .maybeSingle();

  // Backward compatibility for lessons that store a single video ID directly.
  const { data: legacyVideo } = videoRow?.bunny_video_id
    ? { data: null }
    : await db.from("lessons").select("bunny_video_id").eq("id", lessonId).maybeSingle();
  const videoId = videoRow?.bunny_video_id || legacyVideo?.bunny_video_id;
  if (!videoId) return NextResponse.json({ error: "لا يوجد فيديو مرفوع لهذه اللغة بعد" }, { status: 404 });

  // 3) إصدار الرابط الموقّع
  const pb = buildPlayback(videoId, { lang });
  return NextResponse.json({ embedUrl: pb.embedUrl, expiresAt: pb.expiresAt });
}
