"use client";

import { useLang } from "@/components/LangProvider";
import { localizedField } from "@/lib/i18n";
import { money } from "@/lib/ui";
import type { PublicCourse, PublicCourseLevel, PublicCourseLesson } from "@/lib/types";
import EnrollBox from "@/app/(site)/courses/[slug]/EnrollBox";

const SUBSECTION_COPY = {
  exercises: "تمارين (فيديوهات + درايف)",
  writing: "طريقة كتابة توضيحية",
  mistakes: "الأخطاء الشائعة",
  feedback: "الفيد باك",
  faq: "الأسئلة الأكثر شيوعاً",
} as const;

export default function LocalizedCourseDetail({
  course,
  levels,
  lessons,
  loggedIn,
}: {
  course: PublicCourse;
  levels: PublicCourseLevel[];
  lessons: PublicCourseLesson[];
  loggedIn: boolean;
}) {
  const { lang, tr } = useLang();
  return (
    <div>
      <section className="hero"><div className="hero-art user-select-none">ك</div><div className="container" style={{ padding: "56px 20px", display: "grid", gap: 30, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", alignItems: "center" }}><div><span className="kicker">{tr("كورس")}</span><h1 style={{ fontSize: "clamp(28px,4.4vw,46px)", marginTop: 16 }}>{localizedField(lang, { ar: course.title_ar, en: course.title_en })}</h1>{localizedField(lang, { ar: course.subtitle_ar, en: course.subtitle_en }) && <p className="muted" style={{ fontSize: 17, marginTop: 10 }}>{localizedField(lang, { ar: course.subtitle_ar, en: course.subtitle_en })}</p>}<div style={{ display: "flex", gap: 14, marginTop: 18, flexWrap: "wrap" }} className="muted"><span>📚 {levels.length} {tr("مستويات")}</span><span>🎬 {lessons.length}+ {tr("دروس")}</span><span>🔒 {tr("فيديوهات محمية")}</span></div></div><div className="card pad"><EnrollBox courseId={course.id} slug={course.slug} priceCents={course.price_cents} isFree={course.is_free} loggedIn={loggedIn} /></div></div></section>
      <section className="container" style={{ padding: "50px 20px" }}><h2 className="section-title">{tr("محتوى الكورس — المستويات")}</h2><p className="section-sub" style={{ marginBottom: 24 }}>{tr("المستويات متسلسلة: يُفتح المستوى التالي بعد إكمال السابق 100% (ما لم يمنحك الأستاذ استثناءً).")}</p><div style={{ display: "grid", gap: 16 }}>{levels.map((level, index) => { const items = lessons.filter((lesson) => lesson.level_id === level.id); return <div key={level.id} className="card pad"><div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}><span className="chip chip-accent" style={{ fontSize: 15, padding: "6px 16px" }}>{index + 1}</span><div style={{ flex: 1 }}><div className="font-head" style={{ fontSize: 20, fontWeight: 700 }}>{localizedField(lang, { ar: level.title_ar, en: level.title_en })}</div>{localizedField(lang, { ar: level.description_ar, en: level.description_en }) && <div className="muted" style={{ fontSize: 14 }}>{localizedField(lang, { ar: level.description_ar, en: level.description_en })}</div>}</div>{level.is_free ? <span className="chip chip-gold">{tr("مجاني")}</span> : level.price_cents != null ? <strong>{money(level.price_cents)}</strong> : null}</div><div style={{ display: "grid", gap: 8, marginTop: 16 }}>{(Object.keys(SUBSECTION_COPY) as Array<keyof typeof SUBSECTION_COPY>).map((subsection) => { const entries = items.filter((item) => item.subsection === subsection); return entries.length ? <div key={subsection} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 14.5, flexWrap: "wrap" }}><span className="chip" style={{ minWidth: 90, justifyContent: "center" }}>{tr(SUBSECTION_COPY[subsection])}</span><span className="muted">{entries.length} {tr("عنصر")}</span><span className="muted" style={{ fontSize: 13 }}>{entries.slice(0, 3).map((entry) => localizedField(lang, { ar: entry.title_ar, en: entry.title_en })).join(" · ")}</span></div> : null; })}</div></div>; })}</div></section>
    </div>
  );
}
