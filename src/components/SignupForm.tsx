"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/components/LangProvider";
import { localizeApiError } from "@/lib/i18n";
import { readApiResponse } from "@/lib/client-api";

type SignupResult = { ok: true; role: "student"; confirmationRequired?: true };

export default function SignupForm() {
  const { tr, lang } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setConfirmationRequired(false);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await readApiResponse<SignupResult>(
        response,
        (data) => data.ok === true && data.role === "student"
          && (data.confirmationRequired === undefined || data.confirmationRequired === true),
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.data.confirmationRequired) {
        setConfirmationRequired(true);
        return;
      }
      window.location.href = "/my";
    } catch {
      setError(undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card pad">
      <h1 className="section-title">{tr("إنشاء حساب")}</h1>
      <p className="muted" style={{ marginTop: 4 }}>{tr("أنشئ حساباً للبدء في التعلم.")}</p>
      {confirmationRequired ? (
        <p role="status" className="muted" style={{ marginTop: 20 }}>
          {tr("تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيده قبل تسجيل الدخول.")}
        </p>
      ) : <form onSubmit={submit} style={{ display: "grid", gap: 14, marginTop: 20 }}>
        <div>
          <label className="label" htmlFor="signup-email">{tr("البريد الإلكتروني")}</label>
          <input
            id="signup-email"
            className="input"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={email}
            onChange={(event) => { setEmail(event.target.value); setError(null); }}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="signup-password">{tr("كلمة المرور")}</label>
          <input
            id="signup-password"
            className="input"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            value={password}
            onChange={(event) => { setPassword(event.target.value); setError(null); }}
            placeholder="••••••••"
          />
          <small className="muted">{tr("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.")}</small>
        </div>
        {error !== null && <div role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>{localizeApiError(lang, error, "signup")}</div>}
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy ? tr("إنشاء الحساب…") : tr("إنشاء الحساب")}
        </button>
      </form>}
      <p className="muted" style={{ marginTop: 18, marginBottom: 0 }}>
        {tr("لديك حساب بالفعل؟ سجّل الدخول.")} <Link href="/login">{tr("دخول")}</Link>
      </p>
    </div>
  );
}
