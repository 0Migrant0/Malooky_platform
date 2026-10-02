import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { LangProvider } from "@/components/LangProvider";
import CalligraffitiAtmosphere from "@/components/CalligraffitiAtmosphere";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <CalligraffitiAtmosphere />
      <SiteHeader />
      <main style={{ minHeight: "70vh" }}>{children}</main>
      <SiteFooter />
    </LangProvider>
  );
}
