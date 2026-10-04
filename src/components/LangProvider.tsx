"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { t as tFn, translate, pageMetadata, dirFor, type Dict, type Lang } from "@/lib/i18n";

type LanguageContextValue = {
  lang: Lang;
  t: Dict;
  dir: "rtl" | "ltr";
  tr: (source: string) => string;
  setLanguage: (lang: Lang) => void;
};

function updateMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function applyLanguageToDocument(lang: Lang, pathname: string) {
  const metadata = pageMetadata(lang, pathname);
  document.documentElement.lang = lang;
  document.documentElement.dir = dirFor(lang);
  document.documentElement.dataset.lang = lang;
  document.title = metadata.title;
  updateMeta("name", "description", metadata.description);
  updateMeta("property", "og:title", metadata.title);
  updateMeta("property", "og:description", metadata.description);
  updateMeta("property", "og:locale", metadata.locale);
}

const LangCtx = createContext<LanguageContextValue>({
  lang: "ar",
  t: tFn("ar"),
  dir: "rtl",
  tr: (source) => translate("ar", source),
  setLanguage: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [lang, setLang] = useState<Lang>("ar");

  const setLanguage = useCallback((next: Lang) => {
    localStorage.setItem("malooky.lang", next);
    applyLanguageToDocument(next, pathname);
    setLang(next);
  }, [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem("malooky.lang");
    setLang(stored === "en" || stored === "zh" ? stored : "ar");
  }, []);

  useEffect(() => {
    const expectedTitle = pageMetadata(lang, pathname).title;
    applyLanguageToDocument(lang, pathname);
    const observer = new MutationObserver(() => {
      if (document.title !== expectedTitle) document.title = expectedTitle;
    });
    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [lang, pathname]);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, t: tFn(lang), dir: dirFor(lang), tr: (source) => translate(lang, source), setLanguage }),
    [lang, setLanguage],
  );

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
