import { supabaseAdmin } from "@/lib/supabase";
import type { VipConfig } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "دورة VIP" };

export default async function VipPage() {
  let vip: VipConfig | null = null;
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("vip_config").select("*").eq("id", 1).maybeSingle();
    vip = (data as VipConfig) || null;
  } catch {
    vip = null;
  }

  if (!vip?.enabled) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 44 }}>🔒</div>
        <h1 className="section-title" style={{ marginTop: 10 }}>الدورة المباشرة غير مفعّلة حالياً</h1>
        <p className="muted">تابعنا لمعرفة موعد الدورة القادمة.</p>
      </div>
    );
  }
  const starts = vip.starts_at ? new Date(vip.starts_at).toLocaleString("ar", { dateStyle: "full", timeStyle: "short" }) : null;
  return (
    <div className="container" style={{ padding: "70px 20px", maxWidth: 820 }}>
      <div className="card pad" style={{ background: "linear-gradient(130deg, var(--primary), var(--primary-dark))", color: "#fff" }}>
        <span className="chip chip-accent">● مباشر الآن</span>
        <h1 className="section-title" style={{ marginTop: 14 }}>{vip.title_ar || "دورة VIP المباشرة"}</h1>
        {vip.description_ar && <p style={{ opacity: 0.92 }}>{vip.description_ar}</p>}
        {starts && <p style={{ fontWeight: 600 }}>🕒 {starts}</p>}
        {vip.join_url && <a className="btn btn-accent" style={{ marginTop: 12 }} href={vip.join_url} target="_blank" rel="noreferrer">انضم للجلسة الآن ←</a>}
      </div>
      <p className="muted" style={{ fontSize: 13.5, marginTop: 14 }}>رابط الجلسة خاص بكل مشترك — لا تشاركه، وسيتم تتبع الدخول.</p>
    </div>
  );
}
