import { supabaseAdmin } from "@/lib/supabase";
import type { Course } from "@/lib/types";
import SectionHeading from "@/components/SectionHeading";
import LocalizedCourseCard from "@/components/LocalizedCourseCard";
import LocalizedPageSection from "@/components/LocalizedPageSection";

export const dynamic = "force-dynamic";
export const metadata = { title: "الكورسات" };

export default async function CoursesPage() {
  let courses: Course[] = [];
  let levels: { id: string; course_id: string }[] = [];
  try {
    const db = supabaseAdmin();
    const [coursesRes, levelsRes] = await Promise.all([
      db.from("courses").select("*").eq("is_published", true).eq("kind", "main").order("sort"),
      db.from("levels").select("id,course_id").order("sort"),
    ]);
    courses = (coursesRes.data || []) as Course[];
    levels = (levelsRes.data || []) as { id: string; course_id: string }[];
  } catch { /* render empty-state gracefully */ }

  return (
    <div className="container" style={{ padding: "56px 20px" }}>
      <LocalizedPageSection kind="courses-heading" />
      {courses.length === 0 ? <LocalizedPageSection kind="no-courses" /> : <div className="grid grid-3">{courses.map((course) => <LocalizedCourseCard key={course.id} course={course} levelsCount={levels.filter((level) => level.course_id === course.id).length}  />)}</div>}
    </div>
  );
}
