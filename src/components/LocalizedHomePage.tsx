"use client";

import { useLang } from "@/components/LangProvider";
import HomeHero from "@/components/HomeHero";
import LocalizedHomeContent from "@/components/LocalizedHomeContent";
import type { Course, Faq, StudentWork, Testimonial, TopStudent } from "@/lib/types";

export interface HomeData {
  courses: Course[];
  levels: { id: string; course_id: string }[];
  testimonials: Testimonial[];
  works: StudentWork[];
  faqs: Faq[];
  topStudents: TopStudent[];
}

export default function LocalizedHomePage({ data }: { data: HomeData | null }) {
  const { tr } = useLang();
  if (!data) {
    return <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}><p className="muted">{tr("قاعدة البيانات غير مهيأة بعد — شغّل")} <code>supabase/schema.sql</code> {tr("من لوحة Supabase ثم حدّث الصفحة.")}</p></div>;
  }
  const published = data.courses.filter((course) => course.kind === "main");
  return (
    <div>
      <HomeHero singleCourse={published.length === 1} courseSlug={published[0]?.slug} />
      <LocalizedHomeContent
        courses={data.courses}
        levels={data.levels}
        testimonials={data.testimonials}
        works={data.works}
        faqs={data.faqs}
        topStudents={data.topStudents}
      />
    </div>
  );
}
