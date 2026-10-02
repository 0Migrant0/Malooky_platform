"use client";

import { useState } from "react";
import { money } from "@/lib/ui";
import { useLang } from "@/components/LangProvider";

export default function EnrollBox({
  courseId,
  slug,
  priceCents,
  isFree,
  loggedIn,
}: {
  courseId: string;
  slug: string;
  priceCents: number | null;
  isFree: boolean;
  loggedIn: boolean;
}) {
  const { tr } = useLang();
  const signedIn = loggedIn;
  const [mode, setMode] = useState<"stripe" | "whatsapp">("stripe");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [wa, setWa] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const price = priceCents != null ? money(priceCents) : null;

  async function goStripe() {
    if (!signedIn) {
      window.location.href = `/login?next=/courses/${slug}`;
      return;
    }
    setBusy(true);
    setErr("");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "course", courseId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && data.url) window.location.href = data.url;
    else setErr(data.error || tr("تعذّر بدء الدفع"));
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!proof || !wa.trim()) {
      setErr(tr("ارفع صورة إثبات التحويل واكتب رقم واتساب"));
      return;
    }
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.set("courseId", courseId);
    fd.set("whatsapp", wa);
    fd.set("fullName", fullName);
    fd.set("email", email);
    fd.set("proof", proof);
    const res = await fetch("/api/manual-order", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setSubmitted(true);
    else setErr(data.error || tr("تعذّر إرسال الطلب"));
  }

  if (submitted) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 34 }}>✅</div>
        <p style={{ fontWeight: 600, marginTop: 8 }}>{tr("تم استلام طلبك!")}</p>
        <p className="muted" style={{ fontSize: 14 }}>
          {tr("سيتم تفعيل وصولك بعد مراجعة الإدارة — وسنتواصل معك على واتساب.")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span className="font-head" style={{ fontSize: 34, fontWeight: 700, color: "var(--primary)" }}>
          {isFree ? tr("مجاني") : price || "—"}
        </span>
        {!isFree && <span className="muted" style={{ fontSize: 13 }}>{tr("دفعة واحدة — وصول دائم")}</span>}
      </div>

      {isFree ? (
        <button className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} disabled={busy} onClick={goStripe}>
          {signedIn ? tr("سجّل الآن مجاناً") : tr("سجّل للدخول أولاً")}
        </button>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className={`btn btn-sm ${mode === "stripe" ? "btn-primary" : "btn-outline"}`} style={{ flex: 1 }} onClick={() => setMode("stripe")}>
              {tr("بطاقة / Stripe")}
            </button>
            <button className={`btn btn-sm ${mode === "whatsapp" ? "btn-primary" : "btn-outline"}`} style={{ flex: 1 }} onClick={() => setMode("whatsapp")}>
              {tr("تحويل + واتساب")}
            </button>
          </div>

          {mode === "stripe" ? (
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 14 }} disabled={busy} onClick={goStripe}>
              {busy ? "…" : signedIn ? tr("اشترك الآن") : tr("سجّل للدخول أولاً")}
            </button>
          ) : (
            <form onSubmit={submitManual} style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                {tr("حوّل المبلغ على الحساب الموضح، ثم ارفع صورة الإيصال وسنتواصل معك على واتساب لتفعيل الوصول.")}
              </p>
              <input className="input" placeholder={tr("الاسم")} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <input className="input" type="email" placeholder={tr("البريد الإلكتروني")} value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className="input" placeholder={tr("رقم الواتساب")} value={wa} onChange={(e) => setWa(e.target.value)} required />
              <input
                type="file"
                accept="image/*"
                className="input"
                onChange={(e) => setProof(e.target.files?.[0] || null)}
                required
              />
              {err && <div style={{ color: "var(--danger)", fontSize: 13.5 }}>{err}</div>}
              <button className="btn btn-accent" disabled={busy} type="submit">
                {busy ? tr("جارٍ الإرسال…") : tr("إرسال الطلب مع الإثبات")}
              </button>
            </form>
          )}
        </>
      )}
      <hr className="hr" />
      <div className="muted" style={{ fontSize: 13, display: "grid", gap: 6 }}>
        <div>{tr("🔒 فيديوهات مشفّرة — لا يمكن تحميلها")}</div>
        <div>{tr("⭐ فيد باك شخصي")}</div>
        <div>{tr("♾️ وصول دائم للمحتوى")}</div>
      </div>
    </div>
  );
}
