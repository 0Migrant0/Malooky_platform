import crypto from "crypto";
import { videoSecurity } from "./tokens";

/**
 * Bunny Stream — تشغيل موقّع قصير الأجل قابل للترقية إلى DRM.
 *
 * الأمان:
 *  - الرابط لا يُخزَّن أبداً؛ يُنشأ لكل طلب مشاهدة بصلاحية قصيرة.
 *  - التوقيع HMAC/SHA-256 بـ Token Authentication Key من لوحة Bunny.
 *  - تفعيل HLS AES-128 (File DRM) من إعدادات المكتبة + DRM اختياري لاحقاً.
 *  - البث من نطاقات Bunny وليس من مزودنا، ولا روابط دائمة إطلاقاً.
 */

export function bunnyConfigured(): boolean {
  return Boolean(
    process.env.BUNNY_LIBRARY_ID &&
      process.env.BUNNY_STREAM_KEY &&
      process.env.BUNNY_TOKEN_AUTH_KEY,
  );
}

function libId(): string {
  return process.env.BUNNY_LIBRARY_ID || "";
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** توكن Bunny Token Authentication — SHA256(key + videoId + expires) */
export function signPlaybackToken(
  videoId: string,
  ttlSeconds: number = videoSecurity.tokenTtlSeconds,
): { token: string; expires: number } {
  const key = process.env.BUNNY_TOKEN_AUTH_KEY;
  if (!key) throw new Error("BUNNY_TOKEN_AUTH_KEY missing");
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${key}${videoId}${expires}`;
  const token = b64url(crypto.createHash("sha256").update(payload).digest());
  return { token, expires };
}

export interface PlaybackInfo {
  embedUrl: string;
  expiresAt: number;
}

/** رابط تشغيل موقّع قصير الأجل — يُنشأ لكل طلب ولا يُعاد استخدامه */
export function buildPlayback(
  videoId: string,
  opts?: { ttl?: number; lang?: string },
): PlaybackInfo {
  const ttl = opts?.ttl ?? videoSecurity.tokenTtlSeconds;
  const { token, expires } = signPlaybackToken(videoId, ttl);
  const params = new URLSearchParams({
    token,
    expires: String(expires),
    autoplay: "0",
    preload: "metadata",
  });
  if (opts?.lang) params.set("lang", opts.lang);
  const embedUrl = `https://iframe.mediadelivery.net/embed/${libId()}/${videoId}?${params.toString()}`;
  return { embedUrl, expiresAt: expires * 1000 };
}

export async function createVideo(title: string): Promise<{ id: string }> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${libId()}/videos`,
    {
      method: "POST",
      headers: {
        AccessKey: process.env.BUNNY_STREAM_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    },
  );
  if (!res.ok) throw new Error(`Bunny createVideo failed: ${res.status}`);
  return (await res.json()) as { id: string };
}

/** رفع ملف الفيديو إلى Bunny (من السيرفر — رفع الأدمن) */
export async function uploadVideo(
  videoId: string,
  file: ArrayBuffer | Buffer,
): Promise<void> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${libId()}/videos/${videoId}`,
    {
      method: "PUT",
      headers: { AccessKey: process.env.BUNNY_STREAM_KEY || "" },
      body: file as unknown as BodyInit,
    },
  );
  if (!res.ok) throw new Error(`Bunny upload failed: ${res.status}`);
}

export async function deleteVideo(videoId: string): Promise<void> {
  await fetch(
    `https://video.bunnycdn.com/library/${libId()}/videos/${videoId}`,
    {
      method: "DELETE",
      headers: { AccessKey: process.env.BUNNY_STREAM_KEY || "" },
    },
  );
}
