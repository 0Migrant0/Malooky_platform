import { NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/supabase";
import { apiRoute } from "@/lib/api-error";

export const dynamic = "force-dynamic";

async function getMe() {
  const user = await getUserFromCookies({ throwOnError: true });
  return NextResponse.json({ user });
}

export const GET = apiRoute("/api/me", getMe);
