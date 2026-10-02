"use client";

import { useState } from "react";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      window.location.href = data.role === "admin" ? "/dash" : "/my";
    } else {
      setErr(data.error || "بيانات الدخول غير صحيحة");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 440, padding: "70px 20px" }}>
      <div className="card pad">
        <h1 className="section-title">الدخول إلى ملوكي</h1>
        <p className="muted" style={{ marginTop: 4 }}>
          الحسابات تُنشأ من إدارة الأكاديمية أو بعد الشراء.
        </p>
        <form onSubmit={submit} style={{ display: "grid", gap: 14, marginTop: 20 }}>
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {err && <div style={{ color: "var(--danger)", fontSize: 14 }}>{err}</div>}
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? "جارٍ الدخول…" : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
