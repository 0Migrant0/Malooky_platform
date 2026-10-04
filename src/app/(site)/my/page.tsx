import { redirect } from "next/navigation";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import type { Access, Course, Lesson, Level, Progress } from "@/lib/types";
import LocalizedMyCourses from "@/components/LocalizedMyCourses";
import LocalizedPageFailure from "@/components/LocalizedPageFailure";
import { loadPageData } from "@/lib/page-data";
import { loadRequiredPageQueries } from "@/lib/server-page-queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "كورساتي" };

export default async function MyCoursesPage() {
  const session = await loadPageData("my-courses-session", () => getUserFromCookies({ throwOnError: true }));
  if (!session.ok) return <LocalizedPageFailure reason={session.reason} />;
  const me = session.data;
  if (!me) redirect("/login");

  const result = await loadPageData("my-courses", async () => {
    const db = supabaseAdmin();
    const responses = await loadRequiredPageQueries(() => Promise.all([
      db.from("access").select("course_id,level_id,source").eq("user_id", me.id),
      db.from("courses").select("*").eq("is_published", true).order("sort"),
      db.from("levels").select("*").order("sort"),
      db.from("lessons").select("id,level_id,kind").order("sort"),
      db.from("progress").select("lesson_id,completed").eq("user_id", me.id),
    ]));
    const [accessRes, coursesRes, levelsRes, lessonsRes, progressRes] = responses;
    return {
      access: (accessRes.data || []) as Access[],
      courses: (coursesRes.data || []) as Course[],
      levels: (levelsRes.data || []) as Level[],
      lessons: (lessonsRes.data || []) as Lesson[],
      progress: (progressRes.data || []) as Progress[],
    };
  });
  if (!result.ok) return <LocalizedPageFailure reason={result.reason} />;
  const { access, courses, levels, lessons, progress } = result.data;

  const myCourseIds = new Set<string>();
  for (const a of access) {
    if (a.course_id) myCourseIds.add(a.course_id);
    if (a.level_id) {
      const lv = levels.find((l) => l.id === a.level_id);
      if (lv) myCourseIds.add(lv.course_id);
    }
  }
  const myCourses = courses.filter((c) => myCourseIds.has(c.id));

  return <LocalizedMyCourses courses={myCourses} levels={levels} lessons={lessons} access={access} progress={progress} />;
}
