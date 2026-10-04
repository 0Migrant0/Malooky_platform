"use client";

import { useLang } from "@/components/LangProvider";
import type { PageDataFailure } from "@/lib/page-data";

export default function LocalizedPageFailure({ reason }: { reason: PageDataFailure }) {
  const { tr } = useLang();
  const message = reason === "unconfigured"
    ? "الخدمة غير مهيأة حالياً، حاول مرة أخرى لاحقاً."
    : "تعذّر تحميل هذه الصفحة، حاول مرة أخرى.";

  return (
    <section className="container" role="alert" aria-live="assertive" style={{ padding: "80px 20px", textAlign: "center" }}>
      <p className="muted">{tr(message)}</p>
      <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
        {tr("إعادة المحاولة")}
      </button>
    </section>
  );
}
