"use client";

import SectionHeading from "@/components/SectionHeading";
import { useLang } from "@/components/LangProvider";

export default function LocalizedPageSection({ kind }: { kind: "courses-heading" | "no-courses" }) {
  const { tr } = useLang();
  if (kind === "no-courses") return <p className="muted">{tr("لا توجد كورسات منشورة بعد.")}</p>;
  return <SectionHeading kicker={tr("التعلم")} title={tr("الكورسات")} sub={tr("كورسات متدرجة بمستويات مفتوحة بالتتابع — أكمل كل مستوى 100% لتفتح التالي.")} />;
}
