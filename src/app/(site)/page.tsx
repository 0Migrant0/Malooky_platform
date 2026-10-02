import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import type { Course, Faq, StudentWork, Testimonial, TopStudent } from "@/lib/types";
import LocalizedCourseCard from "@/components/LocalizedCourseCard";
import SectionHeading from "@/components/SectionHeading";
import { stars } from "@/lib/ui";
import HomeHero from "@/components/HomeHero";

export const dynamic = "force-dynamic";

async function getData() {
  const db = supabaseAdmin();
  const [coursesRes, levelsRes, testimonialsRes, worksRes, faqRes, topRes, vipRes] = await Promise.all([
    db.from("courses").select("*").eq("is_published", true).order("sort"),
    db.from("levels").select("id,course_id").order("sort"),
    db.from("testimonials").select("*").eq("approved", true).limit(6),
    db.from("student_works").select("*").eq("approved", true).limit(8),
    db.from("faqs").select("*").order("sort").limit(6),
    db.from("top_students").select("*").order("sort").limit(6),
    db.from("vip_config").select("enabled").eq("id", 1).maybeSingle(),
  ]);
  return {
    courses: (coursesRes.data || []) as Course[],
    levels: (levelsRes.data || []) as { id: string; course_id: string }[],
    testimonials: (testimonialsRes.data || []) as Testimonial[],
    works: (worksRes.data || []) as StudentWork[],
    faqs: (faqRes.data || []) as Faq[],
    topStudents: (topRes.data || []) as TopStudent[],
    vip: vipRes.data as { enabled: boolean } | null,
  };
}

export default async function HomePage() {
  const data = await getData().catch(() => null);
  if (!data) return <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}><p className="muted">قاعدة البيانات غير مهيأة بعد — شغّل <code>supabase/schema.sql</code> من لوحة Supabase ثم حدّث الصفحة.</p></div>;

  const { courses, levels, testimonials, works, faqs, topStudents, vip } = data;
  const published = courses.filter((course) => course.kind === "main");
  const singleCourse = published.length === 1;
  const levelCount = (courseId: string) => levels.filter((level) => level.course_id === courseId).length;
  return (
    <div>
      <HomeHero singleCourse={singleCourse} courseSlug={published[0]?.slug} />
      <section className="container" style={{ padding: "64px 20px 10px" }}><SectionHeading kicker="الكورسات" title={singleCourse ? published[0].title_ar : "اختر كورسك"} sub={singleCourse ? published[0].subtitle_ar || "رحلة متكاملة من التأسيس إلى الاحتراف" : undefined} />
        {published.length === 0 ? <p className="muted">لا توجد كورسات منشورة بعد.</p> : <div className="grid grid-3">{published.map((course) => <LocalizedCourseCard key={course.id} course={course} levelsCount={levelCount(course.id)} />)}</div>}
      </section>
      {vip?.enabled && <section className="container" style={{ padding: "40px 20px" }}><div className="card pad" style={{ background: "linear-gradient(120deg,var(--primary),var(--primary-dark))", color: "#fff", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}><div style={{ fontSize: 40 }}>🎥</div><div style={{ flex: 1 }}><div className="font-head" style={{ fontSize: 22 }}>دورة VIP مباشرة مفعّلة الآن</div><div>انضم للجلسة المباشرة مع الأستاذ — المقاعد محدودة.</div></div><Link className="btn btn-accent" href="/vip">التفاصيل والانضمام</Link></div></section>}
      {testimonials.length > 0 && <section className="container" style={{ padding: "56px 20px" }}><SectionHeading kicker="آراء الطلاب" title="أفضل التعليقات" /><div className="grid grid-3">{testimonials.map((review) => <figure className="card pad" key={review.id}><div style={{ color: "var(--gold)" }}>{stars(review.rating)}</div><blockquote>“{review.body_ar}”</blockquote><figcaption className="muted">— {review.student_name}</figcaption></figure>)}</div></section>}
      {topStudents.length > 0 && <section className="container" style={{ padding: "56px 20px" }}><SectionHeading kicker="نفتخر بهم" title="أفضل الطلاب" /><div className="grid grid-3">{topStudents.map((student) => <div className="card pad" key={student.id}><strong>{student.student_name}</strong><div className="muted">{student.reason_ar}</div></div>)}</div></section>}
      {works.length > 0 && <section className="container" style={{ padding: "56px 20px" }}><SectionHeading kicker="من الميدان" title="أعمال الطلاب" /><div className="grid grid-3">{works.map((work) => <figure className="card" key={work.id}><img src={work.image_url} alt={work.caption_ar || work.student_name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} /><figcaption className="pad">{work.caption_ar}</figcaption></figure>)}</div></section>}
      {faqs.length > 0 && <section className="container" style={{ padding: "56px 20px" }}><SectionHeading kicker="مساعدة" title="الأسئلة الأكثر شيوعاً" /><div style={{ display: "grid", gap: 12, maxWidth: 780 }}>{faqs.map((faq) => <details className="card" key={faq.id} style={{ padding: 16 }}><summary>{faq.question_ar}</summary><p className="muted">{faq.answer_ar}</p></details>)}</div></section>}
      <section className="container" style={{ padding: "56px 20px" }}><div className="card pad" style={{ textAlign: "center", background: "var(--accent-soft)" }}><div style={{ fontSize: 34 }}>🎁</div><h3 className="section-title">ادعم استمرار المحتوى</h3><p className="muted">تبرعك يساعدنا على إنتاج محتوى تعليمي مجاني بجودة عالية للجميع.</p><Link className="btn btn-accent" href="/donate">تبرع الآن</Link></div></section>
    </div>
  );
}
