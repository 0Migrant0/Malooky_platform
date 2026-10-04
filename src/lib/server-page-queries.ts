import { PageQueryError, requirePageQuery } from "@/lib/page-data";

type QueryResult<T> = { data: T; error: unknown };

export async function loadRequiredPageQueries<T extends readonly QueryResult<unknown>[]>(
  load: () => Promise<T>,
): Promise<T> {
  const results = await load();
  try {
    results.forEach(requirePageQuery);
  } catch {
    throw new PageQueryError();
  }
  return results;
}
