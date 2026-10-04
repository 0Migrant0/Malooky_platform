"use client";

import { useLang } from "@/components/LangProvider";
import { buildTrainerWhatsAppUrl } from "@/lib/whatsapp";

export default function ConsultPage() {
  const { tr } = useLang();
  const whatsappUrl = buildTrainerWhatsAppUrl(
    process.env.NEXT_PUBLIC_TRAINER_WHATSAPP_NUMBER,
    tr("مرحباً، أود الاستفسار عن حجز درس خاص."),
  );

  return <div className="container" style={{ maxWidth: 560, padding: "70px 20px" }}>
    <h1 className="section-title">{tr("دروس خاصة مباشرة عبر واتساب")}</h1>
    {whatsappUrl && <p className="muted" style={{ marginTop: 4 }}>{tr("راسل الأستاذ مباشرة على واتساب لترتيب درس خاص.")}</p>}
    <div className="card pad" style={{ display: "grid", gap: 14, marginTop: 22, textAlign: "center" }}>
      {whatsappUrl ? (
        <a className="btn btn-primary" href={whatsappUrl} target="_blank" rel="noreferrer">
          {tr("تواصل عبر واتساب")}
        </a>
      ) : (
        <p role="status" className="muted" style={{ margin: 0 }}>
          {tr("نعتذر، خدمة حجز الدروس الخاصة عبر واتساب غير متاحة حالياً. يُرجى المحاولة لاحقاً.")}
        </p>
      )}
    </div>
  </div>;
}
