"use client";

import Link from "next/link";
import { useLang } from "@/components/LangProvider";
import LocalizedCourseCard from "@/components/LocalizedCourseCard";
import SectionHeading from "@/components/SectionHeading";

import { localizedField } from "@/lib/i18n";
import { stars } from "@/lib/ui";
import type { Course, Faq, StudentWork, Testimonial, TopStudent } from "@/lib/types";

export default function LocalizedHomeContent({
  courses,
  levels,
  testimonials,
  works,
  faqs,
  topStudents,
}: {
  courses: Course[];
  levels: { id: string; course_id: string }[];
  testimonials: Testimonial[];
  works: StudentWork[];
  faqs: Faq[];
  topStudents: TopStudent[];
}) {
  const { lang, tr } = useLang();
  const published = courses.filter((course) => course.kind === "main");
  const singleCourse = published.length === 1;
  const levelCount = (courseId: string) => levels.filter((level) => level.course_id === courseId).length;

  return (
    <>
      <section className="container" style={{ padding: "64px 20px 10px" }}>
        <SectionHeading
          kicker={tr("الكورسات")}
          title={singleCourse ? localizedField(lang, { ar: published[0].title_ar, en: published[0].title_en }) : tr("اختر كورسك")}
          sub={singleCourse ? localizedField(lang, { ar: published[0].subtitle_ar, en: published[0].subtitle_en }) || tr("رحلة متكاملة من التأسيس إلى الاحتراف") : undefined}
        />
        {published.length === 0 ? <p className="muted">{tr("لا توجد كورسات منشورة بعد.")}</p> : (
          <div className="grid grid-3">{published.map((course) => <LocalizedCourseCard key={course.id} course={course} levelsCount={levelCount(course.id)} />)}</div>
        )}
      </section>

      {testimonials.length > 0 && <section className="container" style={{ padding: "56px 20px" }}><SectionHeading kicker={tr("آراء الطلاب")} title={tr("أفضل التعليقات")} /><div className="grid grid-3">{testimonials.map((review) => <figure className="card pad" key={review.id}><div style={{ color: "var(--gold)" }}>{stars(review.rating)}</div><blockquote>“{localizedField(lang, { ar: review.body_ar, en: review.body_en })}”</blockquote><figcaption className="muted">— {review.student_name}</figcaption></figure>)}</div></section>}

      {topStudents.length > 0 && <section className="container" style={{ padding: "56px 20px" }}><SectionHeading kicker={tr("نفتخر بهم")} title={tr("أفضل الطلاب")} /><div className="grid grid-3">{topStudents.map((student) => <div className="card pad" key={student.id}><strong>{student.student_name}</strong><div className="muted">{localizedField(lang, { ar: student.reason_ar, en: student.reason_en })}</div></div>)}</div></section>}

      {works.length > 0 && <section className="container" style={{ padding: "56px 20px" }}><SectionHeading kicker={tr("من الميدان")} title={tr("أعمال الطلاب")} /><div className="grid grid-3">{works.map((work) => { const caption = localizedField(lang, { ar: work.caption_ar, en: work.caption_en }); return <figure className="card" key={work.id}><img src={work.image_url} alt={caption || work.student_name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} /><figcaption className="pad">{caption}</figcaption></figure>; })}</div></section>}

      {faqs.length > 0 && <section className="container" style={{ padding: "56px 20px" }}><SectionHeading kicker={tr("مساعدة")} title={tr("الأسئلة الأكثر شيوعاً")} /><div style={{ display: "grid", gap: 12, maxWidth: 780 }}>{faqs.map((faq) => <details className="card" key={faq.id} style={{ padding: 16 }}><summary>{localizedField(lang, { ar: faq.question_ar, en: faq.question_en })}</summary><p className="muted">{localizedField(lang, { ar: faq.answer_ar, en: faq.answer_en })}</p></details>)}</div></section>}

      <section className="container" style={{ padding: "56px 20px" }}><div className="card pad" style={{ textAlign: "center", background: "var(--accent-soft)" }}><div style={{ fontSize: 34 }}>🎁</div><h3 className="section-title">{tr("ادعم استمرار المحتوى")}</h3><p className="muted">{tr("تبرعك يساعدنا على إنتاج محتوى تعليمي مجاني بجودة عالية للجميع.")}</p><Link className="btn btn-accent" href="/donate">{tr("تبرع الآن")}</Link></div></section>
    </>
  );
}
