import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedBrowser: SupabaseClient | null = null;

/** عميل المتصفح — يستخدم anon key وتُطبَّق عليه سياسات RLS */
export function supabaseBrowser(): SupabaseClient {
  if (cachedBrowser) return cachedBrowser;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Supabase env missing (public)");
  cachedBrowser = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cachedBrowser;
}

export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Supabase server configuration is incomplete");
    this.name = "SupabaseConfigurationError";
  }
}

let cachedAuth: SupabaseClient | null = null;

/** Server-side anon client for public authentication actions such as signup. */
export function supabaseAuth(): SupabaseClient {
  if (cachedAuth) return cachedAuth;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new SupabaseConfigurationError();
  cachedAuth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  return cachedAuth;
}

let cachedAdmin: SupabaseClient | null = null;
let cachedAdminAuth: SupabaseClient | null = null;

function serviceCredentials(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new SupabaseConfigurationError();
  }
  return { url, key };
}

/**
 * عميل الخدمة للقراءة والكتابة (API routes / صفحات الخادم).
 * لا تُستدعى عليه أي عملية مصادقة تُنشئ جلسة (دخول/تجديد): supabase-js يُرسل توكن
 * المستخدم في طلبات REST بعد حفظ الجلسة، فتفشل الكتابة بسياسات RLS
 * ("new row violates row-level security policy").
 */
export function supabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;
  const { url, key } = serviceCredentials();
  cachedAdmin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  return cachedAdmin;
}

/** عميل منفصل لعمليات المصادقة (الدخول وتجديد الجلسة) — لا يُستخدم لأي قراءة/كتابة بيانات. */
export function supabaseAdminAuth(): SupabaseClient {
  if (cachedAdminAuth) return cachedAdminAuth;
  const { url, key } = serviceCredentials();
  cachedAdminAuth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  return cachedAdminAuth;
}

export type SessionRole = "admin" | "student";
export type SessionUser = { id: string; email: string; role: SessionRole };
export type RefreshedSession = { access_token: string; refresh_token: string };
export type ResolvedSession = { user: SessionUser | null; refreshedSession: RefreshedSession | null };
export type SessionOptions = { throwOnError?: boolean; refresh?: boolean };

type AuthProbe = { user: { id: string; email: string } | null; unauthorized: boolean; error?: unknown };

async function probeUser(admin: SupabaseClient, token: string): Promise<AuthProbe> {
  const { data, error } = await admin.auth.getUser(token);
  if (error) {
    if (error.status === 401 || error.status === 403) return { user: null, unauthorized: true };
    return { user: null, unauthorized: false, error };
  }
  if (!data.user) return { user: null, unauthorized: false };
  return { user: { id: data.user.id, email: data.user.email || "" }, unauthorized: false };
}

async function readRole(admin: SupabaseClient, userId: string, throwOnError?: boolean): Promise<SessionRole> {
  const { data, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error && throwOnError) throw error;
  return data?.role === "admin" ? "admin" : "student";
}

/**
 * يقرأ جلسة الطلب من الكوكي. عند تمرير refresh:true، يُجدّد توكن الوصول المنتهي عبر
 * sb-refresh-token ويعيد التوكنات الجديدة ليحفظها المسار في كوكي الاستجابة.
 * (لا يُستخدم هذا المسار من صفحات الخادم: تجديد الجلسة دون حفظها يُبطل refresh token.)
 */
export async function resolveUserSession(options: SessionOptions = {}): Promise<ResolvedSession> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const token =
    store.get("sb-access-token")?.value ||
    store.get("sb:token")?.value ||
    null;
  if (!token) return { user: null, refreshedSession: null };

  const auth = supabaseAdminAuth();
  let probe = await probeUser(auth, token);
  let refreshedSession: RefreshedSession | null = null;

  if (probe.unauthorized && options.refresh) {
    const refreshToken = store.get("sb-refresh-token")?.value || null;
    if (refreshToken) {
      const { data, error } = await auth.auth.refreshSession({ refresh_token: refreshToken });
      if (!error && data.session) {
        refreshedSession = { access_token: data.session.access_token, refresh_token: data.session.refresh_token };
        probe = await probeUser(auth, data.session.access_token);
      }
    }
  }

  if (probe.error && options.throwOnError) throw probe.error;
  if (!probe.user) return { user: null, refreshedSession };
  const role = await readRole(supabaseAdmin(), probe.user.id, options.throwOnError);
  return { user: { ...probe.user, role }, refreshedSession };
}

/** استخرج المستخدم الحالي من كوكي الطلب (server side) — دون تجديد الجلسة. */
export async function getUserFromCookies(options: SessionOptions = {}): Promise<SessionUser | null> {
  const { user } = await resolveUserSession({ ...options, refresh: false });
  return user;
}
