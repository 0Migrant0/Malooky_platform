"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/components/LangProvider";
import { localizeApiError } from "@/lib/i18n";
import { readApiResponse } from "@/lib/client-api";

export default function LoginPage() {
  const { tr, lang } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setRequestId((id) => id + 1);
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await readApiResponse(res, (data) => data.ok === true && (data.role === "admin" || data.role === "student"));
      if (!result.ok) {
        setErr(result.error);
        return;
      }
      window.location.href = result.data.role === "admin" ? "/dash" : "/my";
    } catch {
      setErr(undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 440, padding: "70px 20px" }}>
      <div className="card pad">
        <h1 className="section-title">{tr("الدخول إلى ملوكي")}</h1>
        <p className="muted" style={{ marginTop: 4 }}>
          {tr("تابع تقدمك وكمّل من حيث توقفت.")}
        </p>
        <form onSubmit={submit} style={{ display: "grid", gap: 14, marginTop: 20 }}>
          <div>
            <label className="label">{tr("البريد الإلكتروني")}</label>
            <input className="input" type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setErr(null); setRequestId((id) => id + 1); }} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">{tr("كلمة المرور")}</label>
            <input className="input" type="password" required value={password} onChange={(e) => { setPassword(e.target.value); setErr(null); setRequestId((id) => id + 1); }} placeholder="••••••••" />
          </div>
          {err !== null && <div role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>{localizeApiError(lang, err, "login")}</div>}
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? tr("جارٍ الدخول…") : tr("دخول")}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 18, marginBottom: 0 }}>
          {tr("ليس لديك حساب؟ أنشئ حساباً جديداً.")} <Link href="/signup">{tr("إنشاء حساب")}</Link>
        </p>
      </div>
    </div>
  );
}
