import type { SupabaseClient } from "@supabase/supabase-js";
import { logApiError } from "@/lib/api-error";

export type AuditActor = { id: string; email: string };
export type AuditContext = {
  table: string;
  entityType: string;
  filters: Array<[string, string | null]>;
  before: unknown;
};

const TARGETS: Record<string, (payload: Record<string, unknown>) => Omit<AuditContext, "before"> | null> = {
  setRole: (p) => ({ table: "profiles", entityType: "profile", filters: p.userId ? [["id", String(p.userId)]] : [] }),
  grant: (p) => ({ table: "access", entityType: "access", filters: p.userId ? [["user_id", String(p.userId)], ["course_id", p.courseId ? String(p.courseId) : null], ["level_id", p.levelId ? String(p.levelId) : null]] : [] }),
  revoke: (p) => ({ table: "access", entityType: "access", filters: p.userId ? [["user_id", String(p.userId)], ...(Object.hasOwn(p, "courseId") ? [["course_id", p.courseId ? String(p.courseId) : null] as [string, string | null]] : []), ...(Object.hasOwn(p, "levelId") ? [["level_id", p.levelId ? String(p.levelId) : null] as [string, string | null]] : [])] : [] }),
  upsertCourse: (p) => ({ table: "courses", entityType: "course", filters: p.id ? [["id", String(p.id)]] : [] }),
  setCoursePublished: (p) => ({ table: "courses", entityType: "course", filters: p.id ? [["id", String(p.id)]] : [] }),
  upsertLevel: (p) => ({ table: "levels", entityType: "level", filters: p.id ? [["id", String(p.id)]] : [] }),
  deleteLevel: (p) => ({ table: "levels", entityType: "level", filters: p.id ? [["id", String(p.id)]] : [] }),
  upsertLesson: (p) => ({ table: "lessons", entityType: "lesson", filters: p.id ? [["id", String(p.id)]] : [] }),
  deleteLesson: (p) => ({ table: "lessons", entityType: "lesson", filters: p.id ? [["id", String(p.id)]] : [] }),
  approveOrder: (p) => ({ table: "manual_orders", entityType: "manual_order", filters: p.id ? [["id", String(p.id)]] : [] }),
  rejectOrder: (p) => ({ table: "manual_orders", entityType: "manual_order", filters: p.id ? [["id", String(p.id)]] : [] }),
  upsertPackage: (p) => ({ table: "packages", entityType: "package", filters: p.id ? [["id", String(p.id)]] : [] }),
  deletePackage: (p) => ({ table: "packages", entityType: "package", filters: p.id ? [["id", String(p.id)]] : [] }),
  upsertCoupon: (p) => ({ table: "coupons", entityType: "coupon", filters: p.code ? [["code", String(p.code).toUpperCase()]] : [] }),
  deleteCoupon: (p) => ({ table: "coupons", entityType: "coupon", filters: p.code ? [["code", String(p.code).toUpperCase()]] : [] }),
  togglePaymentMethod: (p) => ({ table: "payment_methods", entityType: "payment_method", filters: p.key ? [["key", String(p.key)]] : [] }),
  savePaymentInstructions: (p) => ({ table: "payment_methods", entityType: "payment_method", filters: p.key ? [["key", String(p.key)]] : [] }),
  upsertTestimonial: (p) => ({ table: "testimonials", entityType: "testimonial", filters: p.id ? [["id", String(p.id)]] : [] }),
  deleteTestimonial: (p) => ({ table: "testimonials", entityType: "testimonial", filters: p.id ? [["id", String(p.id)]] : [] }),
  upsertTopStudent: (p) => ({ table: "top_students", entityType: "top_student", filters: p.id ? [["id", String(p.id)]] : [] }),
  deleteTopStudent: (p) => ({ table: "top_students", entityType: "top_student", filters: p.id ? [["id", String(p.id)]] : [] }),
  upsertWork: (p) => ({ table: "student_works", entityType: "student_work", filters: p.id ? [["id", String(p.id)]] : [] }),
  deleteWork: (p) => ({ table: "student_works", entityType: "student_work", filters: p.id ? [["id", String(p.id)]] : [] }),
  upsertFaq: (p) => ({ table: "faqs", entityType: "faq", filters: p.id ? [["id", String(p.id)]] : [] }),
  deleteFaq: (p) => ({ table: "faqs", entityType: "faq", filters: p.id ? [["id", String(p.id)]] : [] }),
  setConsultStatus: (p) => ({ table: "consult_requests", entityType: "consult_request", filters: p.id ? [["id", String(p.id)]] : [] }),
  setVip: () => ({ table: "vip_config", entityType: "vip_config", filters: [["id", "1"]] }),
  attachVideo: (p) => ({ table: "lesson_videos", entityType: "lesson_video", filters: p.lessonId ? [["lesson_id", String(p.lessonId)], ["lang", p.lang === "en" ? "en" : "ar"]] : [] }),
  createUser: () => ({ table: "profiles", entityType: "profile", filters: [] }),
};

const sensitiveField = /password|token|secret|email|phone|whatsapp|proof|join_url|instructions|full_name|student_name/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.slice(0, 30).map(redact);
  if (!value || typeof value !== "object") {
    return typeof value === "string" && value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !sensitiveField.test(key))
      .map(([key, item]) => [key, redact(item)]),
  );
}

async function readSnapshot(db: SupabaseClient, table: string, filters: Array<[string, string | null]>): Promise<unknown> {
  if (filters.length === 0) return null;
  // يجب استدعاء db.from عبر الكائن نفسه: النداء المنفصل يفقد this.rest ويرمي TypeError.
  let query = db.from(table).select("*");
  for (const [key, value] of filters) query = value === null ? query.is(key, null) : query.eq(key, value);
  const { data, error } = await query.limit(30);
  if (error) throw new Error(`Could not read ${table} audit snapshot: ${error.message}`);
  return data;
}

export async function captureAdminAuditContext(
  db: SupabaseClient,
  action: string,
  payload: Record<string, unknown>,
): Promise<AuditContext | null> {
  const target = TARGETS[action]?.(payload);
  if (!target) return null;
  let before: unknown = null;
  try {
    before = await readSnapshot(db, target.table, target.filters);
  } catch (error) {
    // لقطة «قبل» اختيارية: فشل قراءتها لا يُفشل الإجراء، ويُبلَّغ عنه هنا فقط.
    logApiError("/api/admin/action", error);
  }
  return { ...target, before };
}

export async function writeAdminAuditLog(
  db: SupabaseClient,
  actor: AuditActor,
  action: string,
  context: AuditContext,
  result: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<void> {
  const returnedId = result.id
    || (result.course as Record<string, unknown> | undefined)?.id
    || (result.level as Record<string, unknown> | undefined)?.id
    || (result.lesson as Record<string, unknown> | undefined)?.id;
  const filters = context.filters.length
    ? context.filters
    : returnedId ? [["id", String(returnedId)] as [string, string | null]] : [];
  const after = await readSnapshot(db, context.table, filters);
  const entityId = returnedId || payload.id || payload.userId || payload.courseId || payload.levelId || payload.lessonId || payload.code || null;
  const { error } = await db.from("admin_audit_logs").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    action,
    entity_type: context.entityType,
    entity_id: entityId == null ? null : String(entityId),
    before_data: redact(context.before),
    after_data: redact(after ?? result),
  });
  if (error) throw new Error(`Admin change completed, but audit logging failed: ${error.message}`);
}
