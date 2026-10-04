import { SupabaseConfigurationError } from "@/lib/supabase";

export type PageDataFailure = "unconfigured" | "load-failed";
export type PageDataResult<T> = { ok: true; data: T } | { ok: false; reason: PageDataFailure };

export class PageQueryError extends Error {
  constructor() {
    super("Required page data query failed");
    this.name = "PageQueryError";
  }
}

export function requirePageQuery<T extends { error: unknown }>(result: T): T {
  if (result.error) throw new PageQueryError();
  return result;
}

export async function loadPageData<T>(route: string, load: () => Promise<T>): Promise<PageDataResult<T>> {
  try {
    return { ok: true, data: await load() };
  } catch (error) {
    const reason = error instanceof SupabaseConfigurationError ? "unconfigured" : "load-failed";
    console.error(`[page:${route}] ${reason}`);
    return { ok: false, reason };
  }
}
