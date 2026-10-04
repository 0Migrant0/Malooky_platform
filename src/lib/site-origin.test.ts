import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { configuredSiteOrigin } from "./site-origin";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  vi.doUnmock("next/link");
  vi.doUnmock("@/components/LocalizedCopy");
  vi.resetModules();
});

async function renderFooter(siteUrl?: string): Promise<string> {
  vi.resetModules();
  if (siteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = siteUrl;

  vi.doMock("next/link", () => ({
    default: ({ href, children }: { href: string; children: ReactNode }) => createElement("a", { href }, children),
  }));
  vi.doMock("@/components/LocalizedCopy", () => ({
    default: ({ source }: { source: string }) => source,
  }));

  const { default: SiteFooter } = await import("@/components/SiteFooter");
  return renderToStaticMarkup(createElement(SiteFooter));
}

describe("configured canonical site origin", () => {
  it("reads the canonical origin from the configured environment variable", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://academy.example/path-is-not-an-origin";
    expect(configuredSiteOrigin()).toBeNull();

    process.env.NEXT_PUBLIC_SITE_URL = "https://academy.example";
    expect(configuredSiteOrigin()).toBe("https://academy.example");
  });

  it("uses only a configured HTTP(S) origin", () => {
    expect(configuredSiteOrigin(" https://academy.example/ ")).toBe("https://academy.example");
    expect(configuredSiteOrigin("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it.each([undefined, "", "   ", "academy.example", "ftp://academy.example", "https://user:pass@academy.example", "https://academy.example/path", "https://academy.example/?q=1", "https://academy.example/#section"])(
    "does not accept missing or non-origin configuration: %s",
    (value) => expect(configuredSiteOrigin(value)).toBeNull(),
  );

  it("renders the configured origin in the footer", async () => {
    const html = await renderFooter("https://academy.example/");
    expect(html).toContain('<a href="https://academy.example">academy.example</a>');
  });

  it.each([undefined, "", "not a url"])("omits the external footer link without a valid origin: %s", async (siteUrl) => {
    const html = await renderFooter(siteUrl);
    expect(html).not.toContain("malooky.com");
    expect(html).not.toContain("<a href=\"https://");
  });
});
