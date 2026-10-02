import type { VideoLang } from "./i18n";

export type CourseKind = "main" | "vip" | "consult";
/** sequential: يُفتح بعد إكمال السابق — unrelated: مستقل يُفتح مباشرة */
export type CourseRelation = "sequential" | "unrelated";
export type LessonKind = "video" | "drive" | "text";
/** الأقسام الفرعية لكل مستوى */
export type SubsectionKey =
  | "exercises" // تمارين: فيديوهات + روابط درايف
  | "writing" // طريقة كتابة توضيحية
  | "mistakes" // الأخطاء الشائعة
  | "feedback" // الفيد باك: فيديو + بروفايل + نجوم
  | "faq"; // الأسئلة الأكثر شيوعاً: فيديو + كتابة

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "student";
  whatsapp: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string | null;
  subtitle_ar: string | null;
  subtitle_en: string | null;
  kind: CourseKind;
  sort: number;
  cover_url: string | null;
  /** شارة «جديد» — تُستخدم عند تعدد الكورسات */
  is_new: boolean;
  is_published: boolean;
  /** علاقة الكورس: متسلسل أو مستقل */
  relation: CourseRelation;
  price_cents: number | null;
  stripe_price_id: string | null;
  is_free: boolean;
  created_at: string;
}

export interface Level {
  id: string;
  course_id: string;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  sort: number;
  /** علاقة المستوى داخل الكورس */
  relation: CourseRelation;
  price_cents: number | null;
  is_free: boolean;
}

export interface Lesson {
  id: string;
  level_id: string;
  subsection: SubsectionKey;
  title_ar: string;
  title_en: string | null;
  kind: LessonKind;
  sort: number;
  duration_seconds: number | null;
  bunny_video_id: string | null;
  drive_url: string | null;
  body_ar: string | null;
  body_en: string | null;
  is_free_preview: boolean;
  /** اللغات المتوفرة لهذا الدرس (كل لغة = فيديو مرفوع منفصل) */
  langs: VideoLang[] | null;
}

export interface Progress {
  user_id?: string;
  lesson_id: string;
  completed: boolean;
  updated_at: string;
}

export interface Access {
  id: string;
  user_id: string;
  course_id: string | null;
  level_id: string | null;
  /** purchase | manual | grant | free | vip */
  source: string;
  granted_at: string;
}

export interface Package {
  id: string;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  price_cents: number;
  /** null = كل الكورسات */
  course_ids: string[] | null;
  all_courses: boolean;
  stripe_price_id: string | null;
  is_active: boolean;
  sort: number;
}

export interface Coupon {
  code: string;
  percent_off: number;
  active: boolean;
  expires_at: string | null;
}

export interface ManualOrder {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  package_id: string | null;
  course_id: string | null;
  level_id: string | null;
  amount: number | null;
  proof_url: string;
  whatsapp: string;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  created_at: string;
}

export interface PaymentMethodRow {
  id: string;
  key: string;
  enabled: boolean;
  instructions_ar: string | null;
  instructions_en: string | null;
}

export interface Testimonial {
  id: string;
  student_name: string;
  avatar_url: string | null;
  rating: number;
  body_ar: string;
  body_en: string | null;
  approved: boolean;
  created_at: string;
}

export interface TopStudent {
  id: string;
  student_name: string;
  avatar_url: string | null;
  reason_ar: string | null;
  reason_en: string | null;
  sort: number;
}

export interface StudentWork {
  id: string;
  student_name: string;
  image_url: string;
  caption_ar: string | null;
  caption_en: string | null;
  approved: boolean;
  created_at: string;
}

export interface Faq {
  id: string;
  question_ar: string;
  question_en: string | null;
  answer_ar: string;
  answer_en: string | null;
  video_lesson_id: string | null;
  sort: number;
}

export interface ConsultRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
}

export interface Donation {
  id: string;
  name: string | null;
  email: string | null;
  amount_cents: number;
  source: "stripe" | "manual";
  created_at: string;
}

export interface VipConfig {
  enabled: boolean;
  title_ar: string | null;
  title_en: string | null;
  starts_at: string | null;
  join_url: string | null;
  description_ar: string | null;
  description_en: string | null;
}
