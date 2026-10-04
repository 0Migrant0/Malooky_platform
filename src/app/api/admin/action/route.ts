import { NextResponse } from "next/server";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import { slugify } from "@/lib/ui";
import { captureAdminAuditContext, writeAdminAuditLog } from "@/lib/admin-audit";
import { apiErrorResponse, apiRoute, failedApiOperation, logApiError, unexpectedApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

/**
 * نقطة إجراءات الأدمن — كل طلب يتحقق من دور admin قبل التنفيذ.
 * (بديل عملي عن إنشاء عشرات ملفات API — نفس النمط، حماية موحدة.)
 */
async function postAdminAction(req: Request) {
  const me = await getUserFromCookies({ throwOnError: true });
  if (!me || me.role !== "admin") {
    return apiErrorResponse(403, "صلاحيات غير كافية");
  }

  let body: Record<string, unknown> | null;
  try {
    const parsed: unknown = await req.json();
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return apiErrorResponse(400, "بيانات الإجراء غير صالحة");
  }
  if (!body) return apiErrorResponse(400, "بيانات الإجراء غير صالحة");
  const action = String(body.action || "");
  const payload: unknown = body.payload ?? {};
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return apiErrorResponse(400, "بيانات الإجراء غير صالحة");
  }
  const p = payload as Record<string, any>;
  if (action === "setVip") return apiErrorResponse(400, "إجراء غير معروف");
  if (action === "upsertCourse" && p.kind === "vip") return apiErrorResponse(400, "نوع غير معروف");

  try {
    const db = supabaseAdmin();
    const auditContext = await captureAdminAuditContext(db, action, p);
    const respond = async (result: Record<string, unknown>) => {
      if (auditContext) {
        try {
          await writeAdminAuditLog(db, me, action, auditContext, result, p);
        } catch (error) {
          if (action !== "approveOrder") return failedApiOperation("/api/admin/action", error);
          logApiError("/api/admin/action", error);
          return NextResponse.json({ ...result, auditWarning: true });
        }
      }
      return NextResponse.json(result);
    };

    switch (action) {
      /* ---------- المستخدمون ---------- */
      case "createUser": {
        const email = String(p.email || "").toLowerCase().trim();
        const password = String(p.password || "").slice(0, 72);
        if (!email || password.length < 6) return apiErrorResponse(400, "بيانات غير صالحة");
        const { data, error } = await db.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: p.fullName || "" },
        });
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: data.user?.id });
      }
      case "setRole": {
        const { error } = await db.from("profiles").update({ role: p.role === "admin" ? "admin" : "student" }).eq("id", p.userId);
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: p.userId });
      }
      case "grant": {
        // منح وصول (كورس/مستوى) مع مصدر manual/grant/free/vip
        const { error } = await db.from("access").upsert(
          {
            user_id: p.userId,
            course_id: p.courseId || null,
            level_id: p.levelId || null,
            source: String(p.source || "grant"),
          },
          { onConflict: "user_id,course_id,level_id" },
        );
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: p.userId });
      }
      case "revoke": {
        let q = db.from("access").delete().eq("user_id", p.userId);
        if (p.courseId) q = q.eq("course_id", p.courseId);
        if (p.levelId) q = q.eq("level_id", p.levelId);
        const { error } = await q;
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: p.userId });
      }

      /* ---------- الكورسات ---------- */
      case "upsertCourse": {
        let existingPublished = false;
        if (p.id) {
          const { data: existing, error: existingError } = await db.from("courses").select("is_published,kind").eq("id", p.id).maybeSingle();
          if (existingError) return failedApiOperation("/api/admin/action", existingError);
          if (!existing) return apiErrorResponse(404, "الكورس غير موجود");
          if (existing.kind === "vip") return apiErrorResponse(400, "نوع غير معروف");
          existingPublished = Boolean(existing.is_published);
        }
        const row = {
          id: p.id || undefined,
          slug: p.slug || slugify(String(p.title_ar || "course")),
          title_ar: String(p.title_ar || "بدون عنوان"),
          title_en: p.title_en || null,
          subtitle_ar: p.subtitle_ar || null,
          subtitle_en: p.subtitle_en || null,
          kind: ["main", "vip", "consult"].includes(p.kind) ? p.kind : "main",
          sort: Number(p.sort || 0),
          cover_url: p.cover_url || null,
          is_new: Boolean(p.is_new),
          is_published: existingPublished,
          relation: p.relation === "unrelated" ? "unrelated" : "sequential",
          price_cents: p.price_cents == null || p.price_cents === "" ? null : Math.round(Number(p.price_cents)),
          is_free: Boolean(p.is_free),
        };
        const { data, error } = await db.from("courses").upsert(row).select().maybeSingle();
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, course: data });
      }
      case "setCoursePublished": {
        if (typeof p.is_published !== "boolean" || !p.id) {
          return apiErrorResponse(400, "معرّف الكورس وحالة النشر مطلوبان");
        }
        const { data: course, error: readError } = await db.from("courses").select("id,title_ar,slug,price_cents,is_free,is_published,kind").eq("id", p.id).maybeSingle();
        if (readError) return failedApiOperation("/api/admin/action", readError);
        if (!course) return apiErrorResponse(404, "الكورس غير موجود");
        if (p.is_published && course.kind === "vip") return apiErrorResponse(400, "نوع غير معروف");
        if (p.is_published) {
          if (!course.title_ar?.trim() || !course.slug?.trim()) {
            return apiErrorResponse(400, "أضف عنواناً ورابطاً صالحين قبل نشر الكورس");
          }
          if (!course.is_free && (!Number.isInteger(course.price_cents) || course.price_cents <= 0)) {
            return apiErrorResponse(400, "أضف سعراً صالحاً أو اجعل الكورس مجانياً قبل النشر");
          }
          const { data: courseLevels, error: levelError } = await db.from("levels").select("id").eq("course_id", p.id);
          if (levelError) return failedApiOperation("/api/admin/action", levelError);
          if (!courseLevels?.length) return apiErrorResponse(400, "أضف مستوى واحداً على الأقل قبل نشر الكورس");
          const { count: lessonCount, error: lessonError } = await db.from("lessons").select("id", { count: "exact", head: true }).in("level_id", courseLevels.map((level) => level.id));
          if (lessonError) return failedApiOperation("/api/admin/action", lessonError);
          if (!lessonCount) return apiErrorResponse(400, "أضف درساً واحداً على الأقل قبل نشر الكورس");
        }
        const { data, error } = await db.from("courses").update({ is_published: p.is_published }).eq("id", p.id).select().maybeSingle();
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, course: data, id: p.id });
      }
      case "deleteCourse": {
        return apiErrorResponse(409, "حذف الكورس نهائياً متوقف. استخدم إلغاء النشر لحفظه واستعادته لاحقاً.");
      }
      case "upsertLevel": {
        const row = {
          id: p.id || undefined,
          course_id: p.courseId,
          title_ar: String(p.title_ar || "مستوى"),
          title_en: p.title_en || null,
          description_ar: p.description_ar || null,
          description_en: p.description_en || null,
          sort: Number(p.sort || 0),
          relation: p.relation === "unrelated" ? "unrelated" : "sequential",
          price_cents: p.price_cents == null || p.price_cents === "" ? null : Math.round(Number(p.price_cents)),
          is_free: Boolean(p.is_free),
        };
        const { data, error } = await db.from("levels").upsert(row).select().maybeSingle();
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, level: data });
      }
      case "deleteLevel": {
        const { error } = await db.from("levels").delete().eq("id", p.id);
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: p.id });
      }
      case "upsertLesson": {
        const row = {
          id: p.id || undefined,
          level_id: p.levelId,
          subsection: ["exercises", "writing", "mistakes", "feedback", "faq"].includes(p.subsection) ? p.subsection : "exercises",
          title_ar: String(p.title_ar || "درس"),
          title_en: p.title_en || null,
          kind: ["video", "drive", "text"].includes(p.kind) ? p.kind : "video",
          sort: Number(p.sort || 0),
          drive_url: p.drive_url || null,
          body_ar: p.body_ar || null,
          body_en: p.body_en || null,
          is_free_preview: Boolean(p.is_free_preview),
          langs: Array.isArray(p.langs) ? p.langs : null,
        };
        const { data, error } = await db.from("lessons").upsert(row).select().maybeSingle();
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, lesson: data });
      }
      case "deleteLesson": {
        const { error } = await db.from("lessons").delete().eq("id", p.id);
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: p.id });
      }

      /* ---------- الطلبات اليدوية ---------- */
      case "approveOrder": {
        // موافقة: أنشئ المستخدم إن لم يوجد + فعّل الوصول
        const { data: order, error: orderError } = await db.from("manual_orders").select("*").eq("id", p.id).maybeSingle();
        if (orderError) return failedApiOperation("/api/admin/action", orderError);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const o = order as any;
        if (!o) return apiErrorResponse(404, "الطلب غير موجود");
        let userId = o.user_id as string | null;
        if (!userId) {
          const email = String(o.email || "").trim().toLowerCase();
          const { data: profile, error: profileError } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
          if (profileError) return failedApiOperation("/api/admin/action", profileError);
          userId = (profile?.id as string | undefined) || null;
          if (!userId) {
            const tempPassword = crypto.randomUUID().slice(0, 10) + "Aa1";
            const { data: created, error: createError } = await db.auth.admin.createUser({
              email,
              password: tempPassword,
              email_confirm: true,
              user_metadata: { full_name: o.full_name || "" },
            });
            if (createError) return failedApiOperation("/api/admin/action", createError);
            userId = created.user?.id || null;
            if (!userId) return failedApiOperation("/api/admin/action", new Error("User creation returned no id"));
          }

          // Link first: failed access writes can then be retried without creating another account.
          const { error: linkError } = await db.from("manual_orders").update({ user_id: userId }).eq("id", p.id);
          if (linkError) return failedApiOperation("/api/admin/action", linkError);
        }
        const { error: accessError } = await db.from("access").upsert(
          { user_id: userId, course_id: o.course_id, level_id: o.level_id, source: "manual" },
          { onConflict: "user_id,course_id,level_id" },
        );
        if (accessError) return failedApiOperation("/api/admin/action", accessError);
        const { error: updateError } = await db.from("manual_orders").update({ status: "approved", note: p.note || null }).eq("id", p.id);
        if (updateError) return failedApiOperation("/api/admin/action", updateError);
        return respond({ ok: true, userId, id: p.id });
      }
      case "rejectOrder": {
        const { error } = await db.from("manual_orders").update({ status: "rejected", note: p.note || null }).eq("id", p.id);
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: p.id });
      }

      /* ---------- الباقات والكوبونات ---------- */
      case "upsertPackage": {
        const row = {
          id: p.id || undefined,
          title_ar: String(p.title_ar || "باقة"),
          title_en: p.title_en || null,
          description_ar: p.description_ar || null,
          description_en: p.description_en || null,
          price_cents: Math.round(Number(p.price_cents || 0)),
          all_courses: Boolean(p.all_courses),
          course_ids: p.all_courses ? null : Array.isArray(p.course_ids) ? p.course_ids : [],
          is_active: Boolean(p.is_active),
          sort: Number(p.sort || 0),
        };
        const { data, error } = await db.from("packages").upsert(row).select().maybeSingle();
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: data?.id });
      }
      case "deletePackage": {
        const { error } = await db.from("packages").delete().eq("id", p.id);
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: p.id });
      }
      case "upsertCoupon": {
        const { error } = await db.from("coupons").upsert({
          code: String(p.code || "").toUpperCase().trim(),
          percent_off: Math.max(1, Math.min(100, Math.round(Number(p.percent_off || 10)))),
          active: Boolean(p.active),
          expires_at: p.expires_at || null,
        });
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, code: String(p.code || "").toUpperCase() });
      }
      case "deleteCoupon": {
        const { error } = await db.from("coupons").delete().eq("code", p.code);
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, code: p.code });
      }

      /* ---------- طرق الدفع ---------- */
      case "togglePaymentMethod": {
        const { error } = await db.from("payment_methods").update({ enabled: Boolean(p.enabled) }).eq("key", p.key);
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, key: p.key });
      }
      case "savePaymentInstructions": {
        const { error } = await db
          .from("payment_methods")
          .update({ instructions_ar: p.instructions_ar || null, instructions_en: p.instructions_en || null })
          .eq("key", p.key);
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, key: p.key });
      }

      /* ---------- المحتوى التشويقي ---------- */
      case "upsertTestimonial": {
        const { data, error } = await db.from("testimonials").upsert({
          id: p.id || undefined,
          student_name: String(p.student_name || "طالب"),
          avatar_url: p.avatar_url || null,
          rating: Math.max(1, Math.min(5, Math.round(Number(p.rating || 5)))),
          body_ar: String(p.body_ar || ""),
          body_en: p.body_en || null,
          approved: Boolean(p.approved),
        }).select("id").maybeSingle();
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: data?.id });
      }
      case "deleteTestimonial": {
        const { error } = await db.from("testimonials").delete().eq("id", p.id);
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: p.id });
      }
      case "upsertTopStudent": {
        const { data, error } = await db.from("top_students").upsert({
          id: p.id || undefined,
          student_name: String(p.student_name || ""),
          avatar_url: p.avatar_url || null,
          reason_ar: p.reason_ar || null,
          reason_en: p.reason_en || null,
          sort: Number(p.sort || 0),
        }).select("id").maybeSingle();
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: data?.id });
      }
      case "deleteTopStudent": {
        const { error } = await db.from("top_students").delete().eq("id", p.id);
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: p.id });
      }
      case "upsertWork": {
        const { data, error } = await db.from("student_works").upsert({
          id: p.id || undefined,
          student_name: String(p.student_name || ""),
          image_url: String(p.image_url || ""),
          caption_ar: p.caption_ar || null,
          caption_en: p.caption_en || null,
          approved: Boolean(p.approved),
        }).select("id").maybeSingle();
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: data?.id });
      }
      case "deleteWork": {
        const { error } = await db.from("student_works").delete().eq("id", p.id);
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: p.id });
      }
      case "upsertFaq": {
        const { data, error } = await db.from("faqs").upsert({
          id: p.id || undefined,
          question_ar: String(p.question_ar || ""),
          question_en: p.question_en || null,
          answer_ar: String(p.answer_ar || ""),
          answer_en: p.answer_en || null,
          video_lesson_id: p.video_lesson_id || null,
          sort: Number(p.sort || 0),
        }).select("id").maybeSingle();
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: data?.id });
      }
      case "deleteFaq": {
        const { error } = await db.from("faqs").delete().eq("id", p.id);
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: p.id });
      }

      /* ---------- الاستشارات و VIP والتبرعات ---------- */
      case "setConsultStatus": {
        const { error } = await db.from("consult_requests").update({ status: String(p.status || "contacted") }).eq("id", p.id);
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: p.id });
      }
      case "setVip": {
        const { error } = await db.from("vip_config").upsert({
          id: 1,
          enabled: Boolean(p.enabled),
          title_ar: p.title_ar || null,
          title_en: p.title_en || null,
          starts_at: p.starts_at || null,
          join_url: p.join_url || null,
          description_ar: p.description_ar || null,
          description_en: p.description_en || null,
        });
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, id: 1 });
      }

      /* ---------- رفع الفيديو (دبلجة لكل لغة) ---------- */
      case "attachVideo": {
        // يربط bunny_video_id بدرس + لغة (كل لغة فيديو منفصل)
        const { error } = await db.from("lesson_videos").upsert(
          { lesson_id: p.lessonId, lang: p.lang === "en" ? "en" : "ar", bunny_video_id: String(p.bunnyVideoId || ""), duration_seconds: p.durationSeconds || null },
          { onConflict: "lesson_id,lang" },
        );
        if (error) return failedApiOperation("/api/admin/action", error);
        return respond({ ok: true, lessonId: p.lessonId });
      }

      default:
        return apiErrorResponse(400, "إجراء غير معروف");
    }
  } catch (e) {
    return unexpectedApiError("/api/admin/action", e);
  }
}

export const POST = apiRoute("/api/admin/action", postAdminAction);
