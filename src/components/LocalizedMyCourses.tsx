"use client";

import Link from "next/link";
import { useLang } from "@/components/LangProvider";
import { localizedField } from "@/lib/i18n";
import { courseProgress, levelProgress, levelUnlocked, hasCourseRow } from "@/lib/access";
import type { Access, Course, Lesson, Level, Progress } from "@/lib/types";
import ProgressRing from "@/components/ProgressRing";

export default function LocalizedMyCourses({ courses, levels, lessons, access, progress }: {
  courses: Course[];
  levels: Level[];
  lessons: Lesson[];
  access: Access[];
  progress: Progress[];
}) {
  const { lang, tr } = useLang();
  return (
    <div className="container" style={{ padding: "50px 20px" }}>
      <h1 className="section-title">{tr("كورساتي")}</h1>
      <p className="section-sub">{tr("تابع تقدمك وكمّل من حيث توقفت.")}</p>
      {courses.length === 0 ? <div className="card pad" style={{ marginTop: 24, textAlign: "center" }}><div style={{ fontSize: 36 }}>🎨</div><p style={{ fontWeight: 600, marginTop: 8 }}>{tr("لم تُسجّل في أي كورس بعد")}</p><Link className="btn btn-primary" style={{ marginTop: 14 }} href="/courses">{tr("تصفح الكورسات")}</Link></div> : (
        <div className="grid grid-3" style={{ marginTop: 26 }}>
          {courses.map((course) => {
            const courseLevels = levels.filter((level) => level.course_id === course.id);
            const percent = courseProgress(courseLevels, lessons, progress);
            const owned = hasCourseRow(course.id, access);
            const nextLevel = courseLevels.find((level, index) => levelUnlocked(courseLevels, index, access, progress, lessons) && levelProgress(level, lessons, progress) < 100);
            const title = localizedField(lang, { ar: course.title_ar, en: course.title_en });
            const completeCount = courseLevels.filter((level) => levelProgress(level, lessons, progress) >= 100).length;
            return <div key={course.id} className="card" style={{ overflow: "hidden" }}><div style={{ position: "relative", aspectRatio: "16/8", background: "var(--primary-soft)" }}>{course.cover_url ? <img src={course.cover_url} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div className="font-head" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 54, color: "var(--primary)", opacity: 0.3 }}>م</div>}</div><div style={{ padding: 18 }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><ProgressRing value={percent} /><div><div className="font-head" style={{ fontWeight: 700, fontSize: 17 }}>{title}</div><div className="muted" style={{ fontSize: 13 }}>{completeCount}/{courseLevels.length} {tr("مستويات مكتملة")}</div></div></div><div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}><Link className="btn btn-primary btn-sm" href={`/learn/${course.slug}${nextLevel ? `?level=${nextLevel.id}` : ""}`}>{tr(percent === 0 ? "ابدأ الكورس" : "متابعة التعلم")} ←</Link>{!owned && <span className="chip chip-lock">{tr("وصول جزئي")}</span>}</div></div></div>;
          })}
        </div>
      )}
    </div>
  );
}
