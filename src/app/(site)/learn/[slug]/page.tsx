import { notFound, redirect } from "next/navigation";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import type { Access, Course, Lesson, Level, Progress } from "@/lib/types";
import { lessonsOfLevel, levelUnlocked } from "@/lib/access";
import LearnClient from "./LearnClient";

export const dynamic = "force-dynamic";

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ level?: string; lesson?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const me = await getUserFromCookies();
  if (!me) redirect("/login");

  const db = supabaseAdmin();
  const { data: course } = await db.from("courses").select("*").eq("slug", slug).maybeSingle();
  if (!course || !(course as Course).is_published) notFound();
  const c = course as Course;

  const [levelsRes, lessonsRes, accessRes, progressRes] = await Promise.all([
    db.from("levels").select("*").eq("course_id", c.id).order("sort"),
    db.from("lessons").select("*").order("sort"),
    db.from("access").select("course_id,level_id,source").eq("user_id", me.id),
    db.from("progress").select("lesson_id,completed").eq("user_id", me.id),
  ]);

  const levels = (levelsRes.data || []) as Level[];
  const allLessons = (lessonsRes.data || []) as Lesson[];
  const lessons = allLessons.filter((l) => levels.some((lv) => lv.id === l.level_id));
  const access = (accessRes.data || []) as Access[];
  const progress = (progressRes.data || []) as Progress[];

  // المستوى الابتدائي: من الرابط أو أول مستوى مفتوح
  let level = levels.find((lv) => lv.id === sp.level) || null;
  if (!level) {
    level =
      levels.find((lv, i) => levelUnlocked(levels, i, access, progress, lessons)) || levels[0] || null;
  }
  const levelLessons = level ? lessonsOfLevel(level.id, lessons) : [];
  const lesson = levelLessons.find((l) => l.id === sp.lesson) || levelLessons[0] || null;

  if (!level || !lesson) {
    return (
      <div className="container" style={{ padding: 60, textAlign: "center" }}>
        <p className="muted">هذا الكورس لا يحتوي محتوى منشوراً بعد.</p>
      </div>
    );
  }

  const unlocked = levelUnlocked(levels, levels.indexOf(level), access, progress, lessons);
  if (!unlocked) {
    return (
      <div className="container" style={{ padding: 70, textAlign: "center" }}>
        <div style={{ fontSize: 42 }}>🔒</div>
        <h1 className="section-title" style={{ marginTop: 10 }}>هذا المستوى مقفل</h1>
        <p className="muted">أكمل المستوى السابق 100% لفتحه — أو تواصل مع الأستاذ لمنحك استثناءً.</p>
        <a className="btn btn-primary" style={{ marginTop: 16 }} href={`/learn/${slug}`}>رجوع</a>
      </div>
    );
  }

  return (
    <LearnClient
      courseTitle={c.title_ar}
      slug={slug}
      levels={JSON.parse(JSON.stringify(levels))}
      lessons={JSON.parse(JSON.stringify(lessons))}
      access={access}
      progress={progress}
      currentLevelId={level.id}
      currentLessonId={lesson.id}
      user={{ id: me.id, email: me.email, name: me.email.split("@")[0] }}
    />
  );
}
