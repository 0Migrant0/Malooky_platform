export function configuredSiteOrigin(value: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string | null {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) return null;
    return url.origin;
  } catch {
    return null;
  }
}
