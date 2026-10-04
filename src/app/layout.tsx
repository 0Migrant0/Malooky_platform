import type { Metadata, Viewport } from "next";
import { configuredSiteOrigin } from "@/lib/site-origin";
import "./globals.css";

const siteOrigin = configuredSiteOrigin();

export const metadata: Metadata = {
  ...(siteOrigin ? { metadataBase: new URL(siteOrigin) } : {}),
  title: {
    default: "ملوكي | أكاديمية الكاليجرافيتي العربي",
    template: "%s | ملوكي",
  },
  description:
    "منصة ملوكي التعليمية لتعلم فن الكاليجرافيتي العربي — كورسات مصورة باحترافية مع متابعة وتقييم مباشر.",
  openGraph: {
    title: "ملوكي | أكاديمية الكاليجرافيتي العربي",
    description: "تعلّم فن الكاليجرافيتي بأسلوب عربي عصري، خطوة بخطوة.",
    type: "website",
    locale: "ar",
  },
};

export const viewport: Viewport = {
  themeColor: "#403b3c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
