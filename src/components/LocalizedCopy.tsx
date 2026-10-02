"use client";

import { useLang } from "@/components/LangProvider";
import type { UiCopyKey } from "@/lib/i18n";

export default function LocalizedCopy({ source }: { source: UiCopyKey }) {
  const { tr } = useLang();
  return <>{tr(source)}</>;
}
