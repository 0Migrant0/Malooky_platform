"use client";

import { useLang } from "@/components/LangProvider";

export default function LocalizedLearnMessage({ kind, slug }: { kind: "empty" | "locked"; slug: string }) {
  const { tr } = useLang();
  return kind === "empty" ? <div className="container" style={{ padding: 60, textAlign: "center" }}><p className="muted">{tr("هذا الكورس لا يحتوي محتوى منشوراً بعد.")}</p></div> : <div className="container" style={{ padding: 70, textAlign: "center" }}><div style={{ fontSize: 42 }}>🔒</div><h1 className="section-title" style={{ marginTop: 10 }}>{tr("هذا المستوى مقفل")}</h1><p className="muted">{tr("أكمل المستوى السابق 100% لفتحه — أو تواصل مع الأستاذ لمنحك استثناءً.")}</p><a className="btn btn-primary" style={{ marginTop: 16 }} href={`/learn/${slug}`}>{tr("رجوع")}</a></div>;
}
