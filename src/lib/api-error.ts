import { NextResponse } from "next/server";
import { dict, localizeApiError, type ApiErrorContext } from "./i18n";

export type ApiErrorClassification =
  | "validation"
  | "authentication"
  | "authorization"
  | "not_found"
  | "conflict"
  | "rate_limit"
  | "unavailable"
  | "unexpected"
  | "request_error";

export function classifyApiErrorStatus(status: number): ApiErrorClassification {
  if (status === 400 || status === 422) return "validation";
  if (status === 401) return "authentication";
  if (status === 403) return "authorization";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limit";
  if (status === 503) return "unavailable";
  if (status >= 500) return "unexpected";
  return "request_error";
}

/** رسالة عامة آمنة عند غياب إعدادات Supabase على الخادم (مطابقة لنسخة صفحات الفشل). */
const CONFIGURATION_ERROR_MESSAGE = "الخدمة غير مهيأة حالياً، حاول مرة أخرى لاحقاً.";

/* رسائل واضحة (4xx) لأخطاء قيود القاعدة بدل رسالة عامة 500 — قراءة منفصلة عن نص الخطأ. */
const DUPLICATE_VALUE_MESSAGE = "قيمة مكررة — هذا الرابط أو المعرّف مستخدم مسبقاً. اختر قيمة أخرى.";
const MISSING_RELATED_RECORD_MESSAGE = "أحد السجلات المرتبطة غير موجود. حدّث الصفحة ثم أعد المحاولة.";
const MISSING_REQUIRED_FIELD_MESSAGE = "حقل مطلوب مفقود. أكمل جميع الحقول المطلوبة.";
const INVALID_FIELD_VALUE_MESSAGE = "قيمة غير صالحة في أحد الحقول. راجع البيانات ثم أعد المحاولة.";
const EMAIL_ALREADY_TAKEN_MESSAGE = "البريد الإلكتروني مستخدم مسبقاً.";

const SAFE_API_MESSAGES = new Set([
  "صلاحيات غير كافية", "بيانات الإجراء غير صالحة", "بيانات غير صالحة", "Invalid request",
  "معرّف الكورس وحالة النشر مطلوبان", "أضف عنواناً ورابطاً صالحين قبل نشر الكورس",
  "أضف سعراً صالحاً أو اجعل الكورس مجانياً قبل النشر", "أضف مستوى واحداً على الأقل قبل نشر الكورس",
  "أضف درساً واحداً على الأقل قبل نشر الكورس", "حذف الكورس نهائياً متوقف. استخدم إلغاء النشر لحفظه واستعادته لاحقاً.",
  "إجراء غير معروف", "تسجيل الدخول مطلوب", "lessonId مطلوب", "الدرس غير موجود", "المستوى غير موجود", "الكورس غير موجود",
  "الكورس غير متاح", "غير مصرّح بهذا الدرس", "طلبات كثيرة جداً", "طلبات كثيرة", "طلبات كثيرة، انتظر قليلاً",
  "محاولات كثيرة، انتظر قليلاً", "الحقول مطلوبة", "البريد وكلمة المرور مطلوبان", "بيانات الدخول غير صحيحة",
  "الحقول والإثبات مطلوبة", "حجم الصورة كبير (الحد 8MB)", "الباقة غير موجودة", "الطلب غير موجود",
  "نوع غير معروف", "مبلغ غير صالح", "لا يوجد فيديو مرفوع لهذه اللغة بعد", "invalid signature", "not configured",
  "غير مصرّح — أكمل المستوى السابق أو سجّل في الكورس",
  "إعدادات Bunny غير مكتملة — أضف مفاتيح البيئة (BUNNY_LIBRARY_ID, BUNNY_STREAM_KEY, BUNNY_TOKEN_AUTH_KEY)",
  "الدفع غير متاح حالياً، حاول مرة أخرى لاحقاً.",
  "تعذّر حفظ التقدم، حاول مرة أخرى.",
  "بيانات التسجيل غير صالحة", "تعذّر إنشاء الحساب. تحقق من البيانات وحاول مجدداً.",
  CONFIGURATION_ERROR_MESSAGE,
  DUPLICATE_VALUE_MESSAGE, MISSING_RELATED_RECORD_MESSAGE, MISSING_REQUIRED_FIELD_MESSAGE,
  INVALID_FIELD_VALUE_MESSAGE, EMAIL_ALREADY_TAKEN_MESSAGE,
]);

function isKnownPublicMessage(message: string): boolean {
  return SAFE_API_MESSAGES.has(message);
}

function safePublicMessage(error: unknown, context?: ApiErrorContext): string {
  if (typeof error === "string" && isKnownPublicMessage(error)) return error;
  return context ? localizeApiError("ar", undefined, context) : dict.ar.error_generic;
}

/** Creates the established `{ error }` JSON shape without exposing unknown details. */
export function apiErrorResponse(
  status: number,
  error: unknown,
  context?: ApiErrorContext,
): NextResponse<{ error: string }> {
  return NextResponse.json({ error: safePublicMessage(error, context) }, { status });
}

/** Logs only a route path and coarse classification, never exception or query details. */
export function logApiError(route: string, _error: unknown, status = 500): void {
  const routePath = route.split(/[?#]/, 1)[0].slice(0, 200);
  console.error("[api-error]", {
    route: routePath,
    classification: classifyApiErrorStatus(status),
  });
}

type ConstraintMapping = { status: number; message: string };

/** SQLSTATE أخطاء القيود (PostgrestError.code) → ردّ 4xx واضح برسالة آمنة. */
const SQLSTATE_CONSTRAINTS: Record<string, ConstraintMapping> = {
  "23505": { status: 409, message: DUPLICATE_VALUE_MESSAGE }, // unique_violation (slug مكرر، كود كوبون…)
  "23503": { status: 400, message: MISSING_RELATED_RECORD_MESSAGE }, // foreign_key_violation
  "23502": { status: 400, message: MISSING_REQUIRED_FIELD_MESSAGE }, // not_null_violation
  "23514": { status: 400, message: INVALID_FIELD_VALUE_MESSAGE }, // check_violation
};

/** احتياطي حين لا يصل رمز SQLSTATE (طبقة وسيطة قد تحذفه) — مطابقة على نص الخطأ. */
const CONSTRAINT_MESSAGE_PATTERNS: Array<{ pattern: RegExp; mapping: ConstraintMapping }> = [
  { pattern: /duplicate key value violates unique constraint/i, mapping: SQLSTATE_CONSTRAINTS["23505"] },
  { pattern: /violates foreign key constraint/i, mapping: SQLSTATE_CONSTRAINTS["23503"] },
  { pattern: /violates not-null constraint/i, mapping: SQLSTATE_CONSTRAINTS["23502"] },
  { pattern: /violates check constraint/i, mapping: SQLSTATE_CONSTRAINTS["23514"] },
];

/**
 * يحوّل أخطاء القيود في القاعدة (ورفض البريد المكرر لدى GoTrue) إلى 4xx
 * برسالة عامة آمنة، ويسجّلها بتصنيفها الحقيقي. يُعيد null لبقية الأخطاء.
 */
function constraintErrorResponse(
  route: string,
  error: unknown,
  context?: ApiErrorContext,
): NextResponse<{ error: string }> | null {
  if (!error || typeof error !== "object") return null;
  const { code, message } = error as { code?: unknown; message?: unknown };
  const codeText = typeof code === "string" ? code : "";
  const messageText = typeof message === "string" ? message : "";

  let mapping: ConstraintMapping | undefined = SQLSTATE_CONSTRAINTS[codeText];
  if (!mapping && (codeText === "email_exists" || messageText === "User already registered")) {
    mapping = { status: 409, message: EMAIL_ALREADY_TAKEN_MESSAGE };
  }
  if (!mapping) mapping = CONSTRAINT_MESSAGE_PATTERNS.find((entry) => entry.pattern.test(messageText))?.mapping;
  if (!mapping) return null;

  logApiError(route, error, mapping.status);
  return apiErrorResponse(mapping.status, mapping.message, context);
}

/** Handles unexpected route failures using a sanitized message and route-only log. */
export function unexpectedApiError(route: string, error: unknown, context?: ApiErrorContext): NextResponse<{ error: string }> {
  // SupabaseConfigurationError يُتعرف عليه عبر اسمه (استيراد الصنف نفسه يخلق دورة في الاختبارات المزوّقة).
  if (error instanceof Error && error.name === "SupabaseConfigurationError") {
    logApiError(route, error, 503);
    return apiErrorResponse(503, CONFIGURATION_ERROR_MESSAGE, context);
  }
  const constraint = constraintErrorResponse(route, error, context);
  if (constraint) return constraint;
  logApiError(route, error, 500);
  return apiErrorResponse(500, undefined, context);
}

/** Handles required provider/database results without forwarding their error text. */
export function failedApiOperation(route: string, error: unknown, context?: ApiErrorContext): NextResponse<{ error: string }> {
  return unexpectedApiError(route, error, context);
}

/** Wraps a route entry point so parsing/config/provider throws retain the API shape. */
export function apiRoute<TArgs extends unknown[]>(
  route: string,
  handler: (...args: TArgs) => Promise<Response>,
  context?: ApiErrorContext,
): (...args: TArgs) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return unexpectedApiError(route, error, context);
    }
  };
}
