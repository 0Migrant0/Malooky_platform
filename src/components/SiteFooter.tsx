"use client";

import Link from "next/link";
import { useLang } from "@/components/LangProvider";
import LocalizedText from "@/components/LocalizedText";
import LocalizedCopy from "@/components/LocalizedCopy";

export default function SiteFooter() {
  const { lang } = useLang();
  return (
    <footer className="footer no-print">
      <div className="container" style={{ display: "grid", gap: 26, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div>
          <div className="font-head" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}><LocalizedCopy source="ملوكي" /></div>
          <p className="muted" style={{ color: "#b9cbcb", fontSize: 14, maxWidth: 300 }}><LocalizedText id="footer_brand" /></p>
        </div>
        <div>
          <div className="font-head" style={{ fontWeight: 600, marginBottom: 10 }}><LocalizedText id="footer_links" /></div>
          <div style={{ display: "grid", gap: 6, fontSize: 14.5 }}>
            <Link href="/courses"><LocalizedText id="footer_courses" /></Link>
            <Link href="/vip"><LocalizedText id="footer_vip" /></Link>
            <Link href="/consult"><LocalizedText id="footer_consult" /></Link>
            <Link href="/donate"><LocalizedText id="footer_donate" /></Link>
            <Link href="/login"><LocalizedText id="footer_login" /></Link>
          </div>
        </div>
        <div>
          <div className="font-head" style={{ fontWeight: 600, marginBottom: 10 }}><LocalizedText id="footer_security" /></div>
          <p style={{ fontSize: 13.5, color: "#b9cbcb" }}><LocalizedText id="footer_security_copy" /></p>
        </div>
      </div>
      <div className="container" style={{ marginTop: 30, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.12)", fontSize: 13, color: "#9db3b4", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span>© {new Date().getFullYear()} <LocalizedCopy source="ملوكي" /> — <LocalizedText id="footer_rights" /></span>
        <span>malooky.com</span>
      </div>
    </footer>
  );
}
