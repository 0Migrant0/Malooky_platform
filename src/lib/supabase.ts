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

/** عميل الخدمة — فقط على السيرفر (API routes / server components) */
export function supabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new SupabaseConfigurationError();
  }
  cachedAdmin = createClient(url, key, { auth: { persistSession: false } });
  return cachedAdmin;
}

/** استخرج المستخدم الحالي من كوكي الطلب (server side) */
export async function getUserFromCookies(options: { throwOnError?: boolean } = {}): Promise<{
  id: string;
  email: string;
  role: "admin" | "student";
} | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const token =
    store.get("sb-access-token")?.value ||
    store.get("sb:token")?.value ||
    null;
  if (!token) return null;
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error) {
    if (error.status === 401 || error.status === 403) return null;
    if (options.throwOnError) throw error;
    return null;
  }
  if (!data.user) return null;
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError && options.throwOnError) throw profileError;
  return {
    id: data.user.id,
    email: data.user.email || "",
    role: profile?.role === "admin" ? "admin" : "student",
  };
}
