"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { t as tFn, translate, pageTitle, dirFor, type Dict, type Lang, type UiCopyKey } from "@/lib/i18n";

const LangCtx = createContext<{
  lang: Lang;
  t: Dict;
  dir: "rtl" | "ltr";
  tr: (source: UiCopyKey) => string;
  setLanguage: (lang: Lang) => void;
}>({
  lang: "ar",
  t: tFn("ar"),
  dir: "rtl",
  tr: (source) => translate("ar", source),
  setLanguage: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [lang, setLang] = useState<Lang>("ar");

  useEffect(() => {
    const stored = localStorage.getItem("malooky.lang");
    setLang(stored === "en" || stored === "zh" ? stored : "ar");
  }, []);

  const setLanguage = useCallback((next: Lang) => {
    localStorage.setItem("malooky.lang", next);
    document.documentElement.lang = next;
    document.documentElement.dir = dirFor(next);
    document.documentElement.dataset.lang = next;
    setLang(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirFor(lang);
    document.documentElement.dataset.lang = lang;
    document.title = pageTitle(lang, pathname);
  }, [lang, pathname]);

  const value = useMemo(
    () => ({ lang, t: tFn(lang), dir: dirFor(lang), tr: (source: UiCopyKey) => translate(lang, source), setLanguage }),
    [lang, setLanguage],
  );

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
