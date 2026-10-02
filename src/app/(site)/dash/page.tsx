import { redirect } from "next/navigation";
import { supabaseAdmin, getUserFromCookies } from "@/lib/supabase";
import DashClient from "./DashClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة التحكم" };

export default async function DashPage() {
  const me = await getUserFromCookies();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/my");

  const db = supabaseAdmin();
  const [profiles, courses, levels, lessons, lessonVideos, packages, coupons, orders, methods, testimonials, topStudents, works, faqs, consults, donations, vip, accessRows, progressRows, auditLogs] =
    await Promise.all([
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
      db.from("vip_config").select("*").eq("id", 1).maybeSingle(),
      db.from("access").select("*").limit(2000),
      db.from("progress").select("*").limit(5000),
      db.from("admin_audit_logs").select("id,actor_email,action,entity_type,entity_id,before_data,after_data,created_at").order("created_at", { ascending: false }).limit(100),
    ]);

  return (
    <DashClient
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
        vip: vip.data || null,
        access: accessRows.data || [],
        progress: progressRows.data || [],
        auditLogs: auditLogs.data || [],
        auditLogsReady: !auditLogs.error,
      }}
    />
  );
}
