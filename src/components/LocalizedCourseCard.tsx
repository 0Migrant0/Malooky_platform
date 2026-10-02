"use client";

import Link from "next/link";
import type { Course } from "@/lib/types";
import { money } from "@/lib/ui";
import { useLang } from "@/components/LangProvider";
import { localizedField } from "@/lib/i18n";

export default function LocalizedCourseCard({
  course,
  levelsCount,
}: {
  course: Course;
  levelsCount: number;
}) {
  const { lang } = useLang();
  const title = localizedField(lang, { ar: course.title_ar, en: course.title_en });
  const subtitle = localizedField(lang, { ar: course.subtitle_ar, en: course.subtitle_en });
  const labels = {
    ar: ["جديد", "مستويات", "مجاني"],
    en: ["New", "levels", "Free"],
    zh: ["新课", "个阶段", "免费"],
  }[lang];

  return (
    <Link href={`/courses/${course.slug}`} className="card" style={{ overflow: "hidden", display: "block", transition: "transform .18s ease" }}>
      <div style={{ position: "relative", aspectRatio: "16/9", background: "var(--primary-soft)" }}>
        {course.cover_url && <img src={course.cover_url} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        {course.is_new && <span className="chip chip-accent" style={{ position: "absolute", top: 10, insetInlineEnd: 10 }}>{labels[0]}</span>}
      </div>
      <div style={{ padding: 18 }}>
        <div className="font-head" style={{ fontSize: 19, fontWeight: 600, marginBottom: 4 }}>{title}</div>
        <p className="muted" style={{ fontSize: 14, margin: 0, minHeight: 42 }}>{subtitle}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <span className="chip">{levelsCount} {labels[1]}</span>
          <span style={{ flex: 1 }} />
          {course.is_free ? <span className="chip chip-gold">{labels[2]}</span> : course.price_cents != null ? <strong>{money(course.price_cents)}</strong> : null}
        </div>
      </div>
    </Link>
  );
}
