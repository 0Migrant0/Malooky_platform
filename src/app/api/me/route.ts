import { NextResponse } from "next/server";
import type { ResolvedSession } from "@/lib/supabase";
import { apiRoute } from "@/lib/api-error";
import { withSession } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

async function getMe(_req: Request, session: ResolvedSession) {
  return NextResponse.json({ user: session.user });
}

export const GET = apiRoute("/api/me", withSession(getMe));
