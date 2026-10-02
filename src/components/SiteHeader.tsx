"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { languages } from "@/lib/i18n";
import Image from "next/image";

export default function SiteHeader() {
  const [liveMe, setLiveMe] = useState<{ email: string; role: string } | null>(null);
  const [menu, setMenu] = useState(false);
  const { lang, setLanguage } = useLang();
  const me = liveMe;

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user && setLiveMe(d.user))
      .catch(() => {});
  }, []);

  const L = lang === "ar" ? {
    home: "الرئيسية", courses: "الكورسات", vip: "دورة VIP", consult: "استشارة", donate: "تبرع",
    login: "تسجيل الدخول", dash: "اللوحة", my: "كورساتي", logout: "خروج",
  } : lang === "zh" ? {
    home: "首页", courses: "课程", vip: "VIP 直播", consult: "咨询", donate: "支持我们",
    login: "登录", dash: "管理面板", my: "我的课程", logout: "退出",
  } : {
    home: "Home", courses: "Courses", vip: "VIP", consult: "Consult", donate: "Donate",
    login: "Sign in", dash: "Dashboard", my: "My courses", logout: "Sign out",
  };

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function switchLang(next: (typeof languages)[number]["code"]) {
    setLanguage(next);
  }

  const links = (
    <>
      <Link className="btn btn-ghost btn-sm" href="/" onClick={() => setMenu(false)}>{L.home}</Link>
      <Link className="btn btn-ghost btn-sm" href="/courses" onClick={() => setMenu(false)}>{L.courses}</Link>
      <Link className="btn btn-ghost btn-sm" href="/vip" onClick={() => setMenu(false)}>{L.vip}</Link>
      <Link className="btn btn-ghost btn-sm" href="/consult" onClick={() => setMenu(false)}>{L.consult}</Link>
      <Link className="btn btn-ghost btn-sm" href="/donate" onClick={() => setMenu(false)}>{L.donate}</Link>
    </>
  );

  return (
    <header
      className="no-print"
      style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
    >
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 10, height: 64 }}>
        <Link href="/" className="brand-lockup" aria-label={lang === "zh" ? "马卢基 首页" : lang === "ar" ? "ملوكي — الرئيسية" : "Malooky home"}>
          <Image className="brand-logo" src="/malooky-logo.jpg" alt="" width={44} height={44} priority />
          <span className="brand-wordmark"><strong>{lang === "zh" ? "马卢基" : lang === "ar" ? "ملوكي" : "Malooky"}</strong></span>
        </Link>
        <div className="nav-desktop" style={{ display: "flex", gap: 2 }}>{links}</div>
        <div style={{ flex: 1 }} />
        <select
          className="select language-select"
          style={{ width: 112, minWidth: 112, flex: "0 0 112px" }}
          aria-label="Choose language / اختر اللغة / 选择语言"
          value={lang}
          onChange={(event) => switchLang(event.target.value as (typeof languages)[number]["code"])}
        >
          {languages.map((language) => <option key={language.code} value={language.code}>{language.labelNative}</option>)}
        </select>
        {me ? (
          <>
            {me.role === "admin" && (
              <Link className="btn btn-outline btn-sm" href="/dash">{L.dash}</Link>
            )}
            <Link className="btn btn-primary btn-sm" href="/my">{L.my}</Link>
            <button className="btn btn-ghost btn-sm" onClick={logout}>{L.logout}</button>
          </>
        ) : (
          <Link className="btn btn-primary btn-sm" href="/login">{L.login}</Link>
        )}
        <button
          className="btn btn-ghost btn-sm nav-mobile-btn"
          aria-label="menu"
          onClick={() => setMenu((v) => !v)}
        >
          ☰
        </button>
      </div>
      {menu && (
        <div className="nav-mobile" style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 20px 14px" }}>
          {links}
        </div>
      )}
      <style>{`
        @media (min-width: 900px) { .nav-mobile-btn, .nav-mobile { display: none !important; } }
        @media (max-width: 899px) { .nav-desktop { display: none !important; } }
      `}</style>
    </header>
  );
}
