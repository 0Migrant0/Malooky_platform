"use client";

import { useState } from "react";
export default function ConsultPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/consult", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setBusy(false);
    if (res.ok) setDone(true);
  }

  return <div className="container" style={{ maxWidth: 560, padding: "70px 20px" }}>
    <h1 className="section-title">احجز استشارة خاصة</h1>
    <p className="muted" style={{ marginTop: 4 }}>أرسل طلبك وسيتواصل معك الأستاذ لتحديد الموعد وطريقة الجلسة.</p>
    {done ? <div className="card pad" style={{ marginTop: 22, textAlign: "center" }}><div style={{ fontSize: 36 }}>✅</div><p style={{ fontWeight: 600 }}>تم حفظ طلبك بنجاح — شكراً لك!</p><button className="btn btn-outline" onClick={() => { setDone(false); setForm({ name: "", email: "", phone: "", message: "" }); }}>إرسال طلب آخر</button></div> : <form onSubmit={submit} className="card pad" style={{ display: "grid", gap: 14, marginTop: 22 }}>
      <div><label className="label">الاسم</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><label className="label">البريد الإلكتروني</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div><label className="label">رقم الجوال / واتساب</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+966…" /></div>
      <div><label className="label">رسالتك</label><textarea className="textarea" rows={4} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
      <button className="btn btn-primary" disabled={busy}>{busy ? "جارٍ الإرسال…" : "إرسال الطلب"}</button>
    </form>}
  </div>;
}
