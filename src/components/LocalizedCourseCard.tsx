"use client";

import Link from "next/link";
import type { Course } from "@/lib/types";
import { money } from "@/lib/ui";
import { useLang } from "@/components/LangProvider";


export default function LocalizedCourseCard({
  course,
  levelsCount,
}: {
  course: Course;
  levelsCount: number;
}) {
  const { lang } = useLang();
  const chineseTitles: Record<string, string> = {
    calligraffiti: "阿拉伯书法涂鸦：从字母到墙面",
    "arabic-mural-art": "墙上的阿拉伯字母",
    "letter-composition": "字母与词语构图",
  };
  const chineseSubtitles: Record<string, string> = {
    calligraffiti: "从第一笔到第一件作品，完整体验当代阿拉伯字母艺术。",
    "arabic-mural-art": "将宽阔空间变成充满字母与韵律的艺术画面。",
    "letter-composition": "创作平衡的构图，塑造独特的视觉表达。",
  };
  const title = lang === "en" ? course.title_en || course.title_ar
    : lang === "zh" ? chineseTitles[course.slug] || course.title_en || course.title_ar
    : course.title_ar;
  const subtitle = lang === "en" ? course.subtitle_en || course.subtitle_ar
    : lang === "zh" ? chineseSubtitles[course.slug] || course.subtitle_en || course.subtitle_ar
    : course.subtitle_ar;
  const labels = {
    ar: ["جديد", "مستويات", "مجاني"],
    en: ["New", "levels", "Free"],
    zh: ["新课", "个阶段", "免费"],
  }[lang];

  return (
    <Link href={`/courses/${course.slug}`} className="card" style={{ overflow: "hidden", display: "block", transition: "transform .18s ease" }}>
      <div style={{ position: "relative", aspectRatio: "16/9", background: "var(--primary-soft)" }}>
        {course.cover_url && <img src={course.cover_url} alt={typeof course.title_ar === "string" ? course.title_ar : "Malooky Calligraffiti course"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
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
