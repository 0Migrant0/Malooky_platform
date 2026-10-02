import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://malooky.com"),
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
