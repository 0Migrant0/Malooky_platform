import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";

const mocks = vi.hoisted(() => ({
  db: null as FakeSupabase | null,
  user: { id: "student-1", email: "student@example.test", role: "student" } as { id: string; email: string; role: "student" } | null,
  buildPlayback: vi.fn(() => ({ embedUrl: "https://video.example/ticket", expiresAt: 1234 })),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: () => mocks.db,
  getUserFromCookies: () => Promise.resolve(mocks.user),
}));
vi.mock("@/lib/bunny", () => ({
  bunnyConfigured: () => true,
  buildPlayback: mocks.buildPlayback,
}));
vi.mock("@/lib/ratelimit", () => ({ rateLimit: () => ({ ok: true }), clientIp: () => "127.0.0.1" }));

import { POST } from "./route";

function dbFor(
  access: Record<string, unknown>[] = [],
  levelId = "level-1",
  levelRows: Record<string, unknown>[] = [
    { id: "level-1", course_id: "course-a", relation: "sequential", is_free: false, sort: 1 },
    { id: "level-2", course_id: "course-a", relation: "sequential", is_free: false, sort: 2 },
    { id: "level-independent", course_id: "course-b", relation: "unrelated", is_free: false, sort: 1 },
  ],
  progress: Record<string, unknown>[] = [],
): FakeSupabase {
  return createFakeSupabase({
    lessons: [{ id: "lesson-1", level_id: levelId, is_free_preview: false, langs: ["ar"], bunny_video_id: null }],
    lesson_videos: [{ lesson_id: "lesson-1", lang: "ar", bunny_video_id: "video-1" }],
    courses: [{ id: "course-a", is_published: true }, { id: "course-b", is_published: true }],
    levels: levelRows,
    access,
    progress,
  });
}

async function post() {
  return POST(new Request("http://localhost/api/video-ticket", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lessonId: "lesson-1", lang: "ar" }),
  }));
}

describe("POST /api/video-ticket authorization", () => {
  beforeEach(() => {
    mocks.user = { id: "student-1", email: "student@example.test", role: "student" };
    mocks.db = dbFor();
    mocks.buildPlayback.mockClear();
  });

  it("rejects signed-out requests without issuing playback", async () => {
    mocks.user = null;
    expect((await post()).status).toBe(401);
    expect(mocks.buildPlayback).not.toHaveBeenCalled();
  });

  it("denies an unrelated level without its matching grant", async () => {
    mocks.db = dbFor([{ user_id: "student-1", course_id: "course-a", level_id: null, source: "purchase" }], "level-independent");
    expect((await post()).status).toBe(403);
    expect(mocks.buildPlayback).not.toHaveBeenCalled();
  });

  it("issues playback for a direct level grant", async () => {
    mocks.db = dbFor([{ user_id: "student-1", course_id: null, level_id: "level-1", source: "grant" }]);
    const response = await post();
    expect(response.status).toBe(200);
    expect(mocks.buildPlayback).toHaveBeenCalledWith("video-1", { lang: "ar" });
  });

  it("does not look up video metadata for a denied lesson", async () => {
    mocks.db = dbFor([], "level-independent");
    expect((await post()).status).toBe(403);
    expect(mocks.db.upserts).toHaveLength(0);
    expect(mocks.buildPlayback).not.toHaveBeenCalled();
  });

  it("returns a sanitized error when the entitlement reads fail", async () => {
    const secret = "database-password=hidden";
    mocks.db = createFakeSupabase({
      lessons: [{ id: "lesson-1", level_id: "level-1", is_free_preview: false, langs: ["ar"] }],
      courses: [{ id: "course-a", is_published: true }],
      levels: [{ id: "level-1", course_id: "course-a", relation: "sequential", is_free: false, sort: 1 }],
    }, { access: { message: secret } });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await post();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "تعذّر تشغيل الفيديو، حاول مرة أخرى." });
    expect(mocks.buildPlayback).not.toHaveBeenCalled();
    expect(JSON.stringify(logger.mock.calls)).not.toContain(secret);
  });

  it("returns a validation response for malformed JSON", async () => {
    const response = await POST(new Request("http://localhost/api/video-ticket", {
      method: "POST", headers: { "content-type": "application/json" }, body: "{",
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "lessonId مطلوب" });
  });

  it("issues playback after an enrolled student completes the previous level", async () => {
    mocks.db = createFakeSupabase({
      lessons: [
        { id: "lesson-1", level_id: "level-2", is_free_preview: false, langs: ["ar"] },
        { id: "prior-lesson", level_id: "level-1", is_free_preview: false },
      ],
      lesson_videos: [{ lesson_id: "lesson-1", lang: "ar", bunny_video_id: "video-1" }],
      courses: [{ id: "course-a", is_published: true }],
      levels: [
        { id: "level-1", course_id: "course-a", relation: "sequential", is_free: false, sort: 1 },
        { id: "level-2", course_id: "course-a", relation: "sequential", is_free: false, sort: 2 },
      ],
      access: [{ user_id: "student-1", course_id: "course-a", level_id: null, source: "purchase" }],
      progress: [{ user_id: "student-1", lesson_id: "prior-lesson", completed: true }],
    });
    const response = await post();
    expect(response.status, await response.clone().text()).toBe(200);
    expect(mocks.buildPlayback).toHaveBeenCalledTimes(1);
  });
});
