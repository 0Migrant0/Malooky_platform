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

let cachedAdmin: SupabaseClient | null = null;

/** عميل الخدمة — فقط على السيرفر (API routes / server components) */
export function supabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env missing: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  cachedAdmin = createClient(url, key, { auth: { persistSession: false } });
  return cachedAdmin;
}

/** استخرج المستخدم الحالي من كوكي الطلب (server side) */
export async function getUserFromCookies(): Promise<{
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
  if (error || !data.user) return null;
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  return {
    id: data.user.id,
    email: data.user.email || "",
    role: profile?.role === "admin" ? "admin" : "student",
  };
}
