import { supabaseAdmin } from "@/lib/supabase";
import type { Course } from "@/lib/types";
import SectionHeading from "@/components/SectionHeading";
import LocalizedCourseCard from "@/components/LocalizedCourseCard";

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
      <SectionHeading kicker="التعلم" title="الكورسات" sub="كورسات متدرجة بمستويات مفتوحة بالتتابع — أكمل كل مستوى 100% لتفتح التالي." />
      {courses.length === 0 ? <p className="muted">لا توجد كورسات منشورة بعد.</p> : <div className="grid grid-3">{courses.map((course) => <LocalizedCourseCard key={course.id} course={course} levelsCount={levels.filter((level) => level.course_id === course.id).length}  />)}</div>}
    </div>
  );
}
