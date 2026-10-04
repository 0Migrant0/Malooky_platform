import { notFound, redirect } from "next/navigation";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import type { Access, Course, Lesson, Level, Progress } from "@/lib/types";
import { lessonsOfLevel, levelUnlocked } from "@/lib/access";
import LocalizedLearnClient from "@/components/LocalizedLearnClient";
import LocalizedLearnMessage from "@/components/LocalizedLearnMessage";
import LocalizedPageFailure from "@/components/LocalizedPageFailure";
import { loadPageData, requirePageQuery } from "@/lib/page-data";
import { loadRequiredPageQueries } from "@/lib/server-page-queries";

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
  const session = await loadPageData("learning-session", () => getUserFromCookies({ throwOnError: true }));
  if (!session.ok) return <LocalizedPageFailure reason={session.reason} />;
  const me = session.data;
  if (!me) redirect("/login");

  const result = await loadPageData("learning", async () => {
    const db = supabaseAdmin();
    const courseRes = await db.from("courses").select("*").eq("slug", slug).maybeSingle();
    requirePageQuery(courseRes);
    const course = courseRes.data as Course | null;
    if (!course || !course.is_published) return null;

    const [levelsRes, lessonsRes, accessRes, progressRes] = await loadRequiredPageQueries(() => Promise.all([
      db.from("levels").select("*").eq("course_id", course.id).order("sort"),
      db.from("lessons").select("*").order("sort"),
      db.from("access").select("course_id,level_id,source").eq("user_id", me.id),
      db.from("progress").select("lesson_id,completed").eq("user_id", me.id),
    ]));
    const levels = (levelsRes.data || []) as Level[];
    const allLessons = (lessonsRes.data || []) as Lesson[];
    return {
      course,
      levels,
      lessons: allLessons.filter((lesson) => levels.some((level) => level.id === lesson.level_id)),
      access: (accessRes.data || []) as Access[],
      progress: (progressRes.data || []) as Progress[],
    };
  });
  if (!result.ok) return <LocalizedPageFailure reason={result.reason} />;
  if (!result.data) notFound();
  const { course: c, levels, lessons, access, progress } = result.data;

  // المستوى الابتدائي: من الرابط أو أول مستوى مفتوح
  let level = levels.find((lv) => lv.id === sp.level) || null;
  if (!level) {
    level =
      levels.find((lv, i) => levelUnlocked(levels, i, access, progress, lessons)) || levels[0] || null;
  }
  const levelLessons = level ? lessonsOfLevel(level.id, lessons) : [];
  const lesson = levelLessons.find((l) => l.id === sp.lesson) || levelLessons[0] || null;

  if (!level || !lesson) {
    return <LocalizedLearnMessage kind="empty" slug={slug} />;
  }

  const unlocked = levelUnlocked(levels, levels.indexOf(level), access, progress, lessons);
  if (!unlocked) {
    return <LocalizedLearnMessage kind="locked" slug={slug} />;
  }

  return (
    <LocalizedLearnClient
      course={c}
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
