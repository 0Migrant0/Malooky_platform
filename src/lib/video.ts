/**
 * Helpers for turning what an admin pastes into a Bunny Stream video id.
 *
 * Admins paste whatever they have: the raw GUID, an embed URL, a player URL
 * with the id in the query string, or a CDN path. The `attachVideo` action
 * only stores the id, so parsing happens here — client-side, unit-tested.
 */

const RAW_ID = /^[A-Za-z0-9_-]{6,}$/;

/** Path patterns seen across Bunny player/CDN/embed URLs. */
const PATH_PATTERNS: RegExp[] = [
  /\/videos\/([A-Za-z0-9_-]+)/, // .../videos/{id}
  /\/video\/([A-Za-z0-9_-]+)/, // .../video/{id}
  /\/embed\/([A-Za-z0-9_-]+)/, // .../embed/{id}
  /\/playlist\/[^/]+\/video\/([A-Za-z0-9_-]+)/, // videojs.bunnycdn.com/playlist/{account}/video/{id}
];

/** Query parameters Bunny players use for the video id. */
const QUERY_KEYS = ["videoId", "videoGuid", "guid"];

/**
 * Extracts a Bunny video id from a raw id or any common player/CDN URL.
 * Returns null when the input contains no recognizable id.
 */
export function parseBunnyVideoId(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return RAW_ID.test(value) ? value : null;
  try {
    const url = new URL(value);
    for (const key of QUERY_KEYS) {
      const fromQuery = url.searchParams.get(key);
      if (fromQuery && RAW_ID.test(fromQuery)) return fromQuery;
    }
    for (const pattern of PATH_PATTERNS) {
      const match = url.pathname.match(pattern);
      if (match && RAW_ID.test(match[1])) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}
