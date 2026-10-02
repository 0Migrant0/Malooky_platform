"use client";

import { useLang } from "@/components/LangProvider";
import { localizedField } from "@/lib/i18n";

export default function LocalizedData({
  ar,
  en,
  zh,
}: {
  ar?: string | null;
  en?: string | null;
  zh?: string | null;
}) {
  const { lang } = useLang();
  return <>{localizedField(lang, { ar, en, zh })}</>;
}
