import { redirect } from "next/navigation";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import LocalizedDashboard from "@/components/LocalizedDashboard";
import LocalizedPageFailure from "@/components/LocalizedPageFailure";
import { loadPageData } from "@/lib/page-data";
import { loadRequiredPageQueries } from "@/lib/server-page-queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة التحكم" };

export default async function DashPage() {
  const session = await loadPageData("dashboard-session", () => getUserFromCookies({ throwOnError: true }));
  if (!session.ok) return <LocalizedPageFailure reason={session.reason} />;
  const me = session.data;
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/my");

  const result = await loadPageData("dashboard", async () => {
    const db = supabaseAdmin();
    const loadAuditLogs = async () => {
      try {
        const result = await db.from("admin_audit_logs").select("id,actor_email,action,entity_type,entity_id,before_data,after_data,created_at").order("created_at", { ascending: false }).limit(100);
        return result.error ? { data: null, error: true } : result;
      } catch {
        return { data: null, error: true };
      }
    };
    const [responses, auditLogs] = await Promise.all([
      loadRequiredPageQueries(() => Promise.all([
        db.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
        db.from("courses").select("*").order("sort"),
        db.from("levels").select("*").order("sort"),
        db.from("lessons").select("*").order("sort"),
        db.from("lesson_videos").select("*"),
        db.from("packages").select("*").order("sort"),
        db.from("coupons").select("*"),
        db.from("manual_orders").select("*").order("created_at", { ascending: false }).limit(200),
        db.from("payment_methods").select("*"),
        db.from("testimonials").select("*").order("created_at", { ascending: false }).limit(100),
        db.from("top_students").select("*").order("sort"),
        db.from("student_works").select("*").order("created_at", { ascending: false }).limit(100),
        db.from("faqs").select("*").order("sort"),
        db.from("consult_requests").select("*").order("created_at", { ascending: false }).limit(200),
        db.from("donations").select("*").order("created_at", { ascending: false }).limit(200),
        db.from("access").select("*").limit(2000),
        db.from("progress").select("*").limit(5000),
      ])),
      loadAuditLogs(),
    ]);
    return { responses, auditLogs };
  });
  if (!result.ok) return <LocalizedPageFailure reason={result.reason} />;
  const { responses, auditLogs } = result.data;
  const [profiles, courses, levels, lessons, lessonVideos, packages, coupons, orders, methods, testimonials, topStudents, works, faqs, consults, donations, accessRows, progressRows] = responses;

  return (
    <LocalizedDashboard
      me={{ id: me.id, email: me.email }}
      data={{
        profiles: profiles.data || [],
        courses: courses.data || [],
        levels: levels.data || [],
        lessons: lessons.data || [],
        lessonVideos: lessonVideos.data || [],
        packages: packages.data || [],
        coupons: coupons.data || [],
        orders: orders.data || [],
        methods: methods.data || [],
        testimonials: testimonials.data || [],
        topStudents: topStudents.data || [],
        works: works.data || [],
        faqs: faqs.data || [],
        consults: consults.data || [],
        donations: donations.data || [],
        access: accessRows.data || [],
        progress: progressRows.data || [],
        auditLogs: auditLogs.data || [],
        auditLogsReady: !auditLogs.error,
      }}
    />
  );
}
