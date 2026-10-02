import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import type { Access, Course, Lesson, Level, Progress } from "@/lib/types";
import { courseProgress, levelProgress, levelUnlocked, hasCourseRow } from "@/lib/access";
import ProgressRing from "@/components/ProgressRing";

export const dynamic = "force-dynamic";
export const metadata = { title: "كورساتي" };

export default async function MyCoursesPage() {
  const me = await getUserFromCookies();
  if (!me) redirect("/login");

  let access: Access[] = [];
  let courses: Course[] = [];
  let levels: Level[] = [];
  let lessons: Lesson[] = [];
  let progress: Progress[] = [];
  try {
    const db = supabaseAdmin();
    const [accessRes, coursesRes, levelsRes, lessonsRes, progressRes] = await Promise.all([
      db.from("access").select("course_id,level_id,source").eq("user_id", me.id),
      db.from("courses").select("*").eq("is_published", true).order("sort"),
      db.from("levels").select("*").order("sort"),
      db.from("lessons").select("id,level_id,kind").order("sort"),
      db.from("progress").select("lesson_id,completed").eq("user_id", me.id),
    ]);
    access = (accessRes.data || []) as Access[];
    courses = (coursesRes.data || []) as Course[];
    levels = (levelsRes.data || []) as Level[];
    lessons = (lessonsRes.data || []) as Lesson[];
    progress = (progressRes.data || []) as Progress[];
  } catch {
    // قاعدة البيانات غير مهيأة — تُعرض الحالة الفارغة
  }

  const myCourseIds = new Set<string>();
  for (const a of access) {
    if (a.course_id) myCourseIds.add(a.course_id);
    if (a.level_id) {
      const lv = levels.find((l) => l.id === a.level_id);
      if (lv) myCourseIds.add(lv.course_id);
    }
  }
  const myCourses = courses.filter((c) => myCourseIds.has(c.id));

  return (
    <div className="container" style={{ padding: "50px 20px" }}>
      <h1 className="section-title">كورساتي</h1>
      <p className="section-sub">تابع تقدمك وكمّل من حيث توقفت.</p>
      {myCourses.length === 0 ? (
        <div className="card pad" style={{ marginTop: 24, textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>🎨</div>
          <p style={{ fontWeight: 600, marginTop: 8 }}>لم تُسجّل في أي كورس بعد</p>
          <Link className="btn btn-primary" style={{ marginTop: 14 }} href="/courses">تصفح الكورسات</Link>
        </div>
      ) : (
        <div className="grid grid-3" style={{ marginTop: 26 }}>
          {myCourses.map((c) => {
            const cLevels = levels.filter((l) => l.course_id === c.id);
            const cp = courseProgress(cLevels, lessons, progress);
            const owned = hasCourseRow(c.id, access);
            const nextLevel = cLevels.find((lv, i) => levelUnlocked(cLevels, i, access, progress, lessons) && levelProgress(lv, lessons, progress) < 100);
            return (
              <div key={c.id} className="card" style={{ overflow: "hidden" }}>
                <div style={{ position: "relative", aspectRatio: "16/8", background: "var(--primary-soft)" }}>
                  {c.cover_url ? <img src={c.cover_url} alt={c.title_ar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div className="font-head" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 54, color: "var(--primary)", opacity: 0.3 }}>م</div>}
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}><ProgressRing value={cp} /><div><div className="font-head" style={{ fontWeight: 700, fontSize: 17 }}>{c.title_ar}</div><div className="muted" style={{ fontSize: 13 }}>{cLevels.filter((lv) => levelProgress(lv, lessons, progress) >= 100).length}/{cLevels.length} مستويات مكتملة</div></div></div>
                  <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}><Link className="btn btn-primary btn-sm" href={`/learn/${c.slug}${nextLevel ? `?level=${nextLevel.id}` : ""}`}>{cp === 0 ? "ابدأ الكورس" : "متابعة التعلم"} ←</Link>{!owned && <span className="chip chip-lock">وصول جزئي</span>}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
