"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { languages, localizeApiError } from "@/lib/i18n";
import { readApiResponse } from "@/lib/client-api";
import Image from "next/image";
import LocalizedCopy from "@/components/LocalizedCopy";

export default function SiteHeader() {
  const [liveMe, setLiveMe] = useState<{ email: string; role: string } | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [menu, setMenu] = useState(false);
  const { lang, tr, setLanguage } = useLang();
  const me = liveMe;

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const response = await fetch("/api/me");
        const result = await readApiResponse(response, (data) => Object.hasOwn(data, "user"));
        if (!alive) return;
        if (!result.ok) {
          setSessionError(true);
          return;
        }
        const user = result.data.user;
        if (user && typeof user === "object" && "email" in user && "role" in user) {
          setLiveMe(user as { email: string; role: string });
        }
      } catch {
        if (alive) setSessionError(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const L = {
    home: tr("الرئيسية"), courses: tr("الكورسات"), consult: tr("دروس خاصة"), donate: tr("تبرع"),
    login: tr("تسجيل الدخول"), dash: tr("اللوحة"), my: tr("كورساتي"), logout: tr("خروج"),
  };

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const result = await readApiResponse(response, (data) => data.ok === true);
      if (result.ok) window.location.href = "/";
      else setSessionError(true);
    } catch {
      setSessionError(true);
    }
  }

  function switchLang(next: (typeof languages)[number]["code"]) {
    setLanguage(next);
  }

  const links = (
    <>
      <Link className="btn btn-ghost btn-sm" href="/" onClick={() => setMenu(false)}>{L.home}</Link>
      <Link className="btn btn-ghost btn-sm" href="/courses" onClick={() => setMenu(false)}>{L.courses}</Link>
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
        <Link href="/" className="brand-lockup" aria-label={`${tr("ملوكي")} — ${L.home}`}>
          <Image className="brand-logo" src="/malooky-logo.jpg" alt="" width={44} height={44} priority />
          <span className="brand-wordmark"><strong><LocalizedCopy source="ملوكي" /></strong></span>
        </Link>
        <div className="nav-desktop" style={{ display: "flex", gap: 2 }}>{links}</div>
        <div style={{ flex: 1 }} />
        <select
          className="select language-select"
          style={{ width: 112, minWidth: 112, flex: "0 0 112px" }}
          aria-label={tr("اختر اللغة")}
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
        {sessionError && <span role="alert" className="muted" style={{ fontSize: 12 }}>{localizeApiError(lang, undefined, "session")}</span>}
        <button
          className="btn btn-ghost btn-sm nav-mobile-btn"
          aria-label={tr("القائمة")}
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
