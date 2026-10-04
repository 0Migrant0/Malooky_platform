"use client";

import { useLang } from "@/components/LangProvider";
import { formatDate, localizedField } from "@/lib/i18n";
import type { VipConfig } from "@/lib/types";

export default function LocalizedVipPage({ vip }: { vip: VipConfig | null }) {
  const { lang, tr } = useLang();
  if (!vip?.enabled) {
    return <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}><div style={{ fontSize: 44 }}>🔒</div><h1 className="section-title" style={{ marginTop: 10 }}>{tr("الدورة المباشرة غير مفعّلة حالياً")}</h1><p className="muted">{tr("تابعنا لمعرفة موعد الدورة القادمة.")}</p></div>;
  }
  const starts = vip.starts_at ? formatDate(lang, new Date(vip.starts_at)) : null;
  return (
    <div className="container" style={{ padding: "70px 20px", maxWidth: 820 }}>
      <div className="card pad" style={{ background: "linear-gradient(130deg, var(--primary), var(--primary-dark))", color: "#fff" }}>
        <span className="chip chip-accent">{tr("● مباشر الآن")}</span>
        <h1 className="section-title" style={{ marginTop: 14 }}>{localizedField(lang, { ar: vip.title_ar, en: vip.title_en }) || tr("دورة VIP المباشرة")}</h1>
        {localizedField(lang, { ar: vip.description_ar, en: vip.description_en }) && <p style={{ opacity: 0.92 }}>{localizedField(lang, { ar: vip.description_ar, en: vip.description_en })}</p>}
        {starts && <p style={{ fontWeight: 600 }}>🕒 {starts}</p>}
        {vip.join_url && <a className="btn btn-accent" style={{ marginTop: 12 }} href={vip.join_url} target="_blank" rel="noreferrer">{tr("انضم للجلسة الآن ←")}</a>}
      </div>
      <p className="muted" style={{ fontSize: 13.5, marginTop: 14 }}>{tr("رابط الجلسة خاص بكل مشترك — لا تشاركه، وسيتم تتبع الدخول.")}</p>
    </div>
  );
}
