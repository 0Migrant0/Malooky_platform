import Link from "next/link";
import type { Course } from "@/lib/types";
import { money } from "@/lib/ui";

export default function CourseCard({
  course,
  levelsCount,
  newLabel = "جديد",
  levelsLabel = "مستويات",
}: {
  course: Course;
  levelsCount: number;
  newLabel?: string;
  levelsLabel?: string;
}) {
  const ar = true;
  const title = course.title_ar;
  const subtitle = course.subtitle_ar || "";
  return (
    <Link href={`/courses/${course.slug}`} className="card" style={{ overflow: "hidden", display: "block", transition: "transform .18s ease" }}>
      <div style={{ position: "relative", aspectRatio: "16/9", background: "var(--primary-soft)" }}>
        {course.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.cover_url} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div className="font-head" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, color: "var(--primary)", opacity: 0.35 }}>
            م
          </div>
        )}
        {course.is_new && (
          <span className="chip chip-accent" style={{ position: "absolute", top: 10, insetInlineEnd: 10 }}>{newLabel}</span>
        )}
      </div>
      <div style={{ padding: 18 }}>
        <div className="font-head" style={{ fontSize: 19, fontWeight: 600, marginBottom: 4 }}>{title}</div>
        <p className="muted" style={{ fontSize: 14, margin: 0, minHeight: 42 }}>{subtitle}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <span className="chip">{levelsCount} {levelsLabel}</span>
          <span style={{ flex: 1 }} />
          {course.is_free ? (
            <span className="chip chip-gold">{ar ? "مجاني" : "Free"}</span>
          ) : course.price_cents != null ? (
            <strong>{money(course.price_cents)}</strong>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
