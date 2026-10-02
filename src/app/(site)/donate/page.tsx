"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
const presets = [5, 10, 25, 50, 100];

export default function DonatePage() {
  const { tr } = useLang();
  const [amount, setAmount] = useState(10);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(new URLSearchParams(window.location.search).get("thanks") === "1");
  }, []);

  async function donate() {
    const value = custom ? Number(custom) : amount;
    if (!value || value <= 0) { setErr(tr("أدخل مبلغاً صحيحاً")); return; }
    setBusy(true);
    setErr("");
    const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "donation", amountCents: Math.round(value * 100), name, email }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && data.url) window.location.href = data.url;
    else setErr(data.error || tr("تعذّر بدء عملية التبرع — تأكد من إعداد Stripe أو استخدم التحويل اليدوي."));
  }

  return <div className="container" style={{ maxWidth: 560, padding: "70px 20px" }}>
    <h1 className="section-title">{tr("ادعم المنصة 🎁")}</h1><p className="muted" style={{ marginTop: 4 }}>{tr("تبرعك يساعدنا على إنتاج محتوى تعليمي مجاني بجودة عالية.")}</p>
    {done ? <div className="card pad" style={{ marginTop: 22, textAlign: "center" }}><div style={{ fontSize: 36 }}>✅</div><p>{tr("تم استلام تأكيد التبرع، شكراً لدعمك.")}</p><button className="btn btn-outline" onClick={() => setDone(false)}>{tr("تبرع آخر")}</button></div> : <div className="card pad" style={{ marginTop: 22, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{presets.map((item) => <button key={item} className={`btn btn-sm ${amount === item && !custom ? "btn-primary" : "btn-outline"}`} onClick={() => { setAmount(item); setCustom(""); }}>${item}</button>)}<input className="input" style={{ maxWidth: 120 }} type="number" min={1} placeholder={tr("مبلغ آخر")} value={custom} onChange={(e) => setCustom(e.target.value)} /></div>
      <div><label className="label">{tr("الاسم (اختياري)")}</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><label className="label">{tr("البريد (اختياري)")}</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      {err && <div style={{ color: "var(--danger)" }}>{err}</div>}
      <button className="btn btn-accent" disabled={busy} onClick={donate}>{busy ? tr("جارٍ التحويل…") : tr("تبرع الآن")}</button>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>{tr("الدفع الآمن عبر Stripe.")}</p>
    </div>}
  </div>;
}
