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

/** Handles unexpected route failures using a sanitized message and route-only log. */
export function unexpectedApiError(route: string, error: unknown, context?: ApiErrorContext): NextResponse<{ error: string }> {
  // SupabaseConfigurationError يُتعرف عليه عبر اسمه (استيراد الصنف نفسه يخلق دورة في الاختبارات المزوّقة).
  if (error instanceof Error && error.name === "SupabaseConfigurationError") {
    logApiError(route, error, 503);
    return apiErrorResponse(503, CONFIGURATION_ERROR_MESSAGE, context);
  }
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
