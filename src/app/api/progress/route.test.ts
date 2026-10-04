import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";

const mocks = vi.hoisted(() => ({
  db: null as FakeSupabase | null,
  user: { id: "student-1", email: "student@example.test", role: "student" } as { id: string; email: string; role: "student" } | null,
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: () => mocks.db,
  getUserFromCookies: () => Promise.resolve(mocks.user),
}));

import { POST } from "./route";

function dbFor(access: Record<string, unknown>[] = [], progress: Record<string, unknown>[] = []): FakeSupabase {
  return createFakeSupabase({
    lessons: [{ id: "lesson-1", level_id: "level-1", is_free_preview: false }],
    courses: [{ id: "course-a", is_published: true }, { id: "course-b", is_published: true }],
    levels: [
      { id: "level-1", course_id: "course-a", relation: "sequential", is_free: false, sort: 1 },
      { id: "level-2", course_id: "course-a", relation: "sequential", is_free: false, sort: 2 },
      { id: "level-independent", course_id: "course-b", relation: "unrelated", is_free: false, sort: 1 },
    ],
    access,
    progress,
  });
}

async function post(completed = true) {
  return POST(new Request("http://localhost/api/progress", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lessonId: "lesson-1", completed }),
  }));
}

describe("POST /api/progress authorization", () => {
  beforeEach(() => {
    mocks.user = { id: "student-1", email: "student@example.test", role: "student" };
    mocks.db = dbFor();
  });

  it("rejects signed-out requests", async () => {
    mocks.user = null;
    expect((await post()).status).toBe(401);
    expect(mocks.db?.upserts).toHaveLength(0);
  });

  it("does not accept progress for an unowned lesson", async () => {
    const response = await post();
    expect(response.status).toBe(403);
    expect(mocks.db?.upserts).toHaveLength(0);
  });

  it("does not let another course grant authorize this course", async () => {
    mocks.db = dbFor([{ user_id: "student-1", course_id: "course-other", level_id: null, source: "purchase" }]);
    expect((await post()).status).toBe(403);
    expect(mocks.db.upserts).toHaveLength(0);
  });

  it("does not accept progress for an ungranted unrelated course", async () => {
    mocks.db = createFakeSupabase({
      lessons: [{ id: "lesson-1", level_id: "level-independent", is_free_preview: false }],
      courses: [{ id: "course-b", is_published: true }],
      levels: [{ id: "level-independent", course_id: "course-b", relation: "unrelated", is_free: false, sort: 1 }],
      access: [{ user_id: "student-1", course_id: "course-a", level_id: null, source: "purchase" }],
    });
    expect((await post()).status).toBe(403);
    expect(mocks.db.upserts).toHaveLength(0);
  });

  it("records progress for an explicitly granted level", async () => {
    mocks.db = dbFor([{ user_id: "student-1", course_id: null, level_id: "level-1", source: "grant" }]);
    const response = await post();
    expect(response.status, await response.clone().text()).toBe(200);
    expect(mocks.db.upserts).toHaveLength(1);
  });

  it("returns sanitized server failure when a required progress read fails", async () => {
    const secret = "database-password=hidden";
    mocks.db = createFakeSupabase({
      lessons: [{ id: "lesson-1", level_id: "level-1", is_free_preview: false }],
      levels: [{ id: "level-1", course_id: "course-a", relation: "sequential", is_free: false, sort: 1 }],
      courses: [{ id: "course-a", is_published: true }],
      access: [{ user_id: "student-1", course_id: "course-a", level_id: null, source: "purchase" }],
    }, { levels: { message: secret } });
    const response = await post();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "حدث خطأ، حاول مرة أخرى" });
  });

  it("returns sanitized server failure when saving progress fails", async () => {
    const secret = "database-password=hidden";
    mocks.db = createFakeSupabase({
      lessons: [{ id: "lesson-1", level_id: "level-1", is_free_preview: false }],
      courses: [{ id: "course-a", is_published: true }],
      levels: [{ id: "level-1", course_id: "course-a", relation: "sequential", is_free: false, sort: 1 }],
      access: [{ user_id: "student-1", course_id: "course-a", level_id: null, source: "purchase" }],
    }, { "progress.upsert": { message: secret } });
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await post();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "حدث خطأ، حاول مرة أخرى" });
    expect(JSON.stringify(logger.mock.calls)).not.toContain(secret);
  });

  it("returns a validation response for malformed JSON", async () => {
    const response = await POST(new Request("http://localhost/api/progress", {
      method: "POST", headers: { "content-type": "application/json" }, body: "{",
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "lessonId مطلوب" });
  });

  it("preserves enrolled sequential progression after the previous level is complete", async () => {
    mocks.db = createFakeSupabase({
      lessons: [
        { id: "lesson-1", level_id: "level-2", is_free_preview: false },
        { id: "prior-lesson", level_id: "level-1", is_free_preview: false },
      ],
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
    expect(mocks.db.upserts).toHaveLength(1);
  });
});
