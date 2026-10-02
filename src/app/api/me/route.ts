import { NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUserFromCookies().catch(() => null);
  return NextResponse.json({ user });
}
