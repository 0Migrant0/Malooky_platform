import { notFound } from "next/navigation";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import type { PublicCourse, PublicCourseLevel, PublicCourseLesson } from "@/lib/types";
import LocalizedCourseDetail from "@/components/LocalizedCourseDetail";
import LocalizedPageFailure from "@/components/LocalizedPageFailure";
import { loadPageData, requirePageQuery } from "@/lib/page-data";
import { loadRequiredPageQueries } from "@/lib/server-page-queries";

export const dynamic = "force-dynamic";


export default async function CourseDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await loadPageData("course-detail", async () => {
    const db = supabaseAdmin();
    const courseRes = await db.from("courses").select("id,slug,title_ar,title_en,subtitle_ar,subtitle_en,price_cents,is_free").eq("slug", slug).eq("is_published", true).maybeSingle();
    requirePageQuery(courseRes);
    const course = courseRes.data as PublicCourse | null;
    if (!course) return null;

    const [levelsRes] = await loadRequiredPageQueries(() => Promise.all([
      db.from("levels").select("id,course_id,title_ar,title_en,description_ar,description_en,sort,is_free,price_cents").eq("course_id", course.id).order("sort"),
    ]));
    const levels: PublicCourseLevel[] = ((levelsRes.data || []) as PublicCourseLevel[]).map((level) => ({
      id: level.id,
      course_id: level.course_id,
      title_ar: level.title_ar,
      title_en: level.title_en,
      description_ar: level.description_ar,
      description_en: level.description_en,
      sort: level.sort,
      is_free: level.is_free,
      price_cents: level.price_cents,
    }));
    let courseLessons: PublicCourseLesson[] = [];
    if (levels.length) {
      const [lessonsRes] = await loadRequiredPageQueries(() => Promise.all([
        db.from("lessons").select("id,level_id,subsection,title_ar,title_en,is_free_preview").in("level_id", levels.map((level) => level.id)).order("sort"),
      ]));
      courseLessons = ((lessonsRes.data || []) as PublicCourseLesson[]).map((lesson) => ({
        id: lesson.id,
        level_id: lesson.level_id,
        subsection: lesson.subsection,
        title_ar: lesson.title_ar,
        title_en: lesson.title_en,
        is_free_preview: lesson.is_free_preview,
      }));
    }
    return { course, levels, courseLessons };
  });
  if (!result.ok) return <LocalizedPageFailure reason={result.reason} />;
  if (!result.data) notFound();

  const session = await loadPageData("course-detail-session", () => getUserFromCookies({ throwOnError: true }));
  if (!session.ok) return <LocalizedPageFailure reason={session.reason} />;
  return <LocalizedCourseDetail course={result.data.course} levels={result.data.levels} lessons={result.data.courseLessons} loggedIn={Boolean(session.data)} />;
}
