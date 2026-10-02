import type { Lesson, Level } from "./types";
import type { VideoLang } from "./i18n";

export interface AccessRow {
  course_id: string | null;
  level_id: string | null;
  source: string;
}

export interface ProgressRow {
  lesson_id: string;
  completed: boolean;
}

/**
 * منطق الوصول والفتح:
 *  - relation = "sequential": المستوى يُفتح عند إكمال 100% من السابق،
 *    أو بوجود منحة استثناء/شراء مباشر للمستوى نفسه.
 *  - relation = "unrelated": يتطلب وصولاً للكورس نفسه أو منحة مباشرة للمستوى.
 *  - المستوى المجاني متاح للجميع، والدرس التمهيدي مجاني.
 */

export function courseAccess(
  courseId: string,
  access: AccessRow[],
): boolean {
  return hasCourseRow(courseId, access);
}

export function hasCourseRow(courseId: string, access: AccessRow[]): boolean {
  return access.some((a) => a.course_id === courseId);
}

export function hasLevelRow(levelId: string, access: AccessRow[]): boolean {
  return access.some((a) => a.level_id === levelId);
}

export function lessonsOfLevel(levelId: string, lessons: Lesson[]): Lesson[] {
  return lessons
    .filter((l) => l.level_id === levelId)
    .sort((a, b) => a.sort - b.sort);
}

export function levelProgress(
  level: Level,
  lessons: Lesson[],
  progress: ProgressRow[],
): number {
  const ids = new Set(lessons.filter((l) => l.level_id === level.id).map((l) => l.id));
  if (ids.size === 0) return 0;
  let done = 0;
  for (const p of progress) {
    if (p.completed && ids.has(p.lesson_id)) done += 1;
  }
  return Math.round((done / ids.size) * 100);
}

export function courseProgress(
  levels: Level[],
  lessons: Lesson[],
  progress: ProgressRow[],
): number {
  if (levels.length === 0) return 0;
  const total = levels.reduce((acc, lv) => acc + levelProgress(lv, lessons, progress), 0);
  return Math.round(total / levels.length);
}

/** المستوى مفتوح؟ (تسلسل + استثناء + شراء مباشر + مجاني) */
export function levelUnlocked(
  levels: Level[],
  index: number,
  access: AccessRow[],
  progress: ProgressRow[],
  lessons: Lesson[],
): boolean {
  const lv = levels[index];
  if (!lv) return false;
  if (lv.is_free) return true;
  if (lv.relation === "unrelated") {
    return hasCourseRow(lv.course_id, access) || hasLevelRow(lv.id, access);
  }
  if (hasLevelRow(lv.id, access)) return true; // شراء/منحة مباشرة للمستوى
  if (index === 0) return true;
  const prev = levels[index - 1];
  return levelProgress(prev, lessons, progress) >= 100;
}

/** Server/API policy: free content or an entitlement scoped to this course/level. */
export function lessonAccessible(
  lesson: Lesson,
  levels: Level[],
  access: AccessRow[],
  progress: ProgressRow[],
  lessons: Lesson[],
): boolean {
  if (lesson.is_free_preview) return true;
  const index = levels.findIndex((level) => level.id === lesson.level_id);
  const level = levels[index];
  if (!level) return false;
  if (level.is_free || hasLevelRow(level.id, access)) return true;
  if (level.relation === "unrelated") return hasCourseRow(level.course_id, access);
  // Sequential completion only unlocks content for an enrolled course.
  return hasCourseRow(level.course_id, access)
    && levelUnlocked(levels, index, access, progress, lessons);
}

/** الدرس قابل للمشاهدة؟ (معاينة مجانية أو مستوى مفتوح) */
export function lessonPlayable(
  lesson: Lesson,
  levels: Level[],
  access: AccessRow[],
  progress: ProgressRow[],
  lessons: Lesson[],
): boolean {
  if (lesson.is_free_preview) return true;
  const idx = levels.findIndex((lv) => lv.id === lesson.level_id);
  return levelUnlocked(levels, idx, access, progress, lessons);
}

/** اللغة المطلوبة متوفرة للدرس؟ وإلا أقرب لغة متاحة */
export function pickLang(lesson: Lesson, wanted: VideoLang): VideoLang {
  const list = lesson.langs && lesson.langs.length ? lesson.langs : (["ar"] as VideoLang[]);
  return list.includes(wanted) ? wanted : list[0];
}
