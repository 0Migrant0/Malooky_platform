"use client";

import Link from "next/link";
import LocalizedCopy from "@/components/LocalizedCopy";
import { configuredSiteOrigin } from "@/lib/site-origin";

const siteOrigin = configuredSiteOrigin();

export default function SiteFooter() {
  return (
    <footer className="footer no-print">
      <div className="container" style={{ display: "grid", gap: 26, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div>
          <div className="font-head" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}><LocalizedCopy source="ملوكي" /></div>
          <p className="muted" style={{ color: "#b9cbcb", fontSize: 14, maxWidth: 300 }}><LocalizedCopy source="أكاديمية الكاليجرافيتي العربي — نعلّم فن الحرف الحديث خطوة بخطوة، مع متابعة مباشرة من الأستاذ." /></p>
        </div>
        <div>
          <div className="font-head" style={{ fontWeight: 600, marginBottom: 10 }}><LocalizedCopy source="روابط" /></div>
          <div style={{ display: "grid", gap: 6, fontSize: 14.5 }}>
            <Link href="/courses"><LocalizedCopy source="الكورسات" /></Link>
            <Link href="/consult"><LocalizedCopy source="دروس خاصة" /></Link>
            <Link href="/donate"><LocalizedCopy source="تبرع" /></Link>
            <Link href="/login"><LocalizedCopy source="تسجيل الدخول" /></Link>
          </div>
        </div>
        <div>
          <div className="font-head" style={{ fontWeight: 600, marginBottom: 10 }}><LocalizedCopy source="ملاحظة أمان" /></div>
          <p style={{ fontSize: 13.5, color: "#b9cbcb" }}><LocalizedCopy source="جميع الفيديوهات مشفّرة ومحمية بعلامة مائية لكل مشاهد — التحميل وإعادة النشر ممنوع ومحفوظ الحقوق." /></p>
        </div>
      </div>
      <div className="container" style={{ marginTop: 30, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.12)", fontSize: 13, color: "#9db3b4", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span>© {new Date().getFullYear()} <LocalizedCopy source="ملوكي" /> — <LocalizedCopy source="جميع الحقوق محفوظة" /></span>
        {siteOrigin && <a href={siteOrigin}>{new URL(siteOrigin).host}</a>}
      </div>
    </footer>
  );
}
