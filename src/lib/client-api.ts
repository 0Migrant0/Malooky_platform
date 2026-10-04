export type ApiObject = Record<string, unknown>;

export type ApiResult<T extends ApiObject = ApiObject> =
  | { ok: true; data: T }
  | { ok: false; error: unknown };

/** Read API JSON without mistaking malformed or non-object replies for success. */
export async function readApiResponse<T extends ApiObject = ApiObject>(
  response: Response,
  isValidSuccess: (data: ApiObject) => boolean = () => true,
): Promise<ApiResult<T>> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, error: undefined };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: undefined };
  }

  const data = body as ApiObject;
  if (!response.ok || !isValidSuccess(data)) return { ok: false, error: data.error };
  return { ok: true, data: data as T };
}
