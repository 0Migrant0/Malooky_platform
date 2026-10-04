import { supabaseAdmin } from "@/lib/supabase";
import type { Course, Faq, StudentWork, Testimonial, TopStudent } from "@/lib/types";
import LocalizedHomePage from "@/components/LocalizedHomePage";
import LocalizedPageFailure from "@/components/LocalizedPageFailure";
import { loadPageData } from "@/lib/page-data";
import { loadRequiredPageQueries } from "@/lib/server-page-queries";

export const dynamic = "force-dynamic";

async function getData() {
  const db = supabaseAdmin();
  const [coursesRes, levelsRes, testimonialsRes, worksRes, faqRes, topRes] = await loadRequiredPageQueries(() => Promise.all([
    db.from("courses").select("*").eq("is_published", true).order("sort"),
    db.from("levels").select("id,course_id").order("sort"),
    db.from("testimonials").select("*").eq("approved", true).limit(6),
    db.from("student_works").select("*").eq("approved", true).limit(8),
    db.from("faqs").select("*").order("sort").limit(6),
    db.from("top_students").select("*").order("sort").limit(6),
  ]));
  return {
    courses: (coursesRes.data || []) as Course[],
    levels: (levelsRes.data || []) as { id: string; course_id: string }[],
    testimonials: (testimonialsRes.data || []) as Testimonial[],
    works: (worksRes.data || []) as StudentWork[],
    faqs: (faqRes.data || []) as Faq[],
    topStudents: (topRes.data || []) as TopStudent[],
  };
}

export default async function HomePage() {
  const result = await loadPageData("home", getData);
  return result.ok ? <LocalizedHomePage data={result.data} /> : <LocalizedPageFailure reason={result.reason} />;
}
