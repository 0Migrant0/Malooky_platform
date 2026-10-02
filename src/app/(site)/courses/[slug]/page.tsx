import { notFound } from "next/navigation";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import type { Course, Level, Lesson } from "@/lib/types";
import { money } from "@/lib/ui";
import EnrollBox from "./EnrollBox";

export const dynamic = "force-dynamic";

const SUB_AR: Record<string, string> = { exercises: "تمارين (فيديوهات + درايف)", writing: "طريقة كتابة توضيحية", mistakes: "الأخطاء الشائعة", feedback: "الفيد باك", faq: "الأسئلة الأكثر شيوعاً" };

export default async function CourseDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = supabaseAdmin();
  let course: Course | null = null;
  try { const { data } = await db.from("courses").select("*").eq("slug", slug).eq("is_published", true).maybeSingle(); course = (data as Course) || null; } catch { course = null; }
  if (!course) notFound();

  let levels: Level[] = [];
  let courseLessons: Lesson[] = [];
  try {
    const levelsRes = await db.from("levels").select("*").eq("course_id", course.id).order("sort");
    levels = (levelsRes.data || []) as Level[];
    if (levels.length) {
      const lessonsRes = await db.from("lessons").select("id,level_id,subsection,title_ar,kind,duration_seconds,is_free_preview").in("level_id", levels.map((level) => level.id)).order("sort");
      courseLessons = (lessonsRes.data || []) as Lesson[];
    }
  } catch { /* database not configured */ }

  let me: { id: string; email: string; role: string } | null = null;
  try { me = await getUserFromCookies(); } catch { me = null; }
  return (
    <div>
      <section className="hero"><div className="hero-art user-select-none">ك</div><div className="container" style={{ padding: "56px 20px", display: "grid", gap: 30, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", alignItems: "center" }}><div><span className="kicker">كورس</span><h1 style={{ fontSize: "clamp(28px,4.4vw,46px)", marginTop: 16 }}>{course.title_ar}</h1>{course.subtitle_ar && <p className="muted" style={{ fontSize: 17, marginTop: 10 }}>{course.subtitle_ar}</p>}<div style={{ display: "flex", gap: 14, marginTop: 18, flexWrap: "wrap" }} className="muted"><span>📚 {levels.length} مستويات</span><span>🎬 {courseLessons.length}+ درس</span><span>🔒 فيديوهات محمية</span></div></div><div className="card pad"><EnrollBox courseId={course.id} slug={course.slug} priceCents={course.price_cents} isFree={course.is_free} loggedIn={Boolean(me)} /></div></div></section>
      <section className="container" style={{ padding: "50px 20px" }}><h2 className="section-title">محتوى الكورس — المستويات</h2><p className="section-sub" style={{ marginBottom: 24 }}>المستويات متسلسلة: يُفتح المستوى التالي بعد إكمال السابق 100% (ما لم يمنحك الأستاذ استثناءً).</p><div style={{ display: "grid", gap: 16 }}>{levels.map((level, index) => { const items = courseLessons.filter((lesson) => lesson.level_id === level.id); return <div key={level.id} className="card pad"><div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}><span className="chip chip-accent" style={{ fontSize: 15, padding: "6px 16px" }}>{index + 1}</span><div style={{ flex: 1 }}><div className="font-head" style={{ fontSize: 20, fontWeight: 700 }}>{level.title_ar}</div>{level.description_ar && <div className="muted" style={{ fontSize: 14 }}>{level.description_ar}</div>}</div>{level.is_free ? <span className="chip chip-gold">مجاني</span> : level.price_cents != null ? <strong>{money(level.price_cents)}</strong> : null}</div><div style={{ display: "grid", gap: 8, marginTop: 16 }}>{(["exercises", "writing", "mistakes", "feedback", "faq"] as const).map((subsection) => { const entries = items.filter((item) => item.subsection === subsection); return entries.length ? <div key={subsection} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 14.5, flexWrap: "wrap" }}><span className="chip" style={{ minWidth: 90, justifyContent: "center" }}>{SUB_AR[subsection]}</span><span className="muted">{entries.length} عنصر</span><span className="muted" style={{ fontSize: 13 }}>{entries.slice(0, 3).map((entry) => entry.title_ar).join(" · ")}</span></div> : null; })}</div></div>; })}</div></section>
    </div>
  );
}
