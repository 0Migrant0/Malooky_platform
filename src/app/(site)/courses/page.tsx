import { supabaseAdmin } from "@/lib/supabase";
import type { Course } from "@/lib/types";
import LocalizedPageFailure from "@/components/LocalizedPageFailure";
import { loadPageData } from "@/lib/page-data";
import { loadRequiredPageQueries } from "@/lib/server-page-queries";
import LocalizedCourseCard from "@/components/LocalizedCourseCard";
import LocalizedPageSection from "@/components/LocalizedPageSection";

export const dynamic = "force-dynamic";
export const metadata = { title: "الكورسات" };

export default async function CoursesPage() {
  const result = await loadPageData("courses", async () => {
    const db = supabaseAdmin();
    const [coursesRes, levelsRes] = await loadRequiredPageQueries(() => Promise.all([
      db.from("courses").select("*").eq("is_published", true).eq("kind", "main").order("sort"),
      db.from("levels").select("id,course_id").order("sort"),
    ]));
    return {
      courses: (coursesRes.data || []) as Course[],
      levels: (levelsRes.data || []) as { id: string; course_id: string }[],
    };
  });
  if (!result.ok) return <LocalizedPageFailure reason={result.reason} />;
  const { courses, levels } = result.data;

  return (
    <div className="container" style={{ padding: "56px 20px" }}>
      <LocalizedPageSection kind="courses-heading" />
      {courses.length === 0 ? <LocalizedPageSection kind="no-courses" /> : <div className="grid grid-3">{courses.map((course) => <LocalizedCourseCard key={course.id} course={course} levelsCount={levels.filter((level) => level.course_id === course.id).length} />)}</div>}
    </div>
  );
}
