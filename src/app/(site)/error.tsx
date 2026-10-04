"use client";

import { useEffect, useState } from "react";
import { translate, type Lang } from "@/lib/i18n";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [lang, setLang] = useState<Lang>("ar");

  useEffect(() => {
    const stored = window.localStorage.getItem("malooky.lang");
    if (stored === "en" || stored === "zh") setLang(stored);
    console.error("[page:site-boundary] unexpected-render-failure");
  }, [error]);
  const tr = (source: string) => translate(lang, source);

  return (
    <section className="container" role="alert" aria-live="assertive" style={{ padding: "80px 20px", textAlign: "center" }}>
      <p className="muted">{tr("تعذّر تحميل هذه الصفحة، حاول مرة أخرى.")}</p>
      <button className="btn btn-primary" type="button" onClick={reset}>{tr("إعادة المحاولة")}</button>
    </section>
  );
}
