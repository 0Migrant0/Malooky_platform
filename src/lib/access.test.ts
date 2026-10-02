import { describe, expect, it } from "vitest";
import { lessonAccessible, lessonPlayable, levelUnlocked } from "./access";
import type { Lesson, Level } from "./types";

const levels: Level[] = [
  {
    id: "level-1", course_id: "course-a", title_ar: "One", title_en: null,
    description_ar: null, description_en: null, sort: 1, relation: "sequential",
    price_cents: null, is_free: false,
  },
  {
    id: "level-2", course_id: "course-a", title_ar: "Two", title_en: null,
    description_ar: null, description_en: null, sort: 2, relation: "sequential",
    price_cents: null, is_free: false,
  },
  {
    id: "level-independent", course_id: "course-b", title_ar: "Independent", title_en: null,
    description_ar: null, description_en: null, sort: 1, relation: "unrelated",
    price_cents: null, is_free: false,
  },
];

const lessons: Lesson[] = [
  { id: "lesson-1", level_id: "level-1", subsection: "exercises", title_ar: "One", title_en: null, kind: "video", sort: 1, duration_seconds: null, bunny_video_id: null, drive_url: null, body_ar: null, body_en: null, is_free_preview: false, langs: ["ar"] },
  { id: "lesson-2", level_id: "level-2", subsection: "exercises", title_ar: "Two", title_en: null, kind: "video", sort: 1, duration_seconds: null, bunny_video_id: null, drive_url: null, body_ar: null, body_en: null, is_free_preview: false, langs: ["ar"] },
  { id: "preview", level_id: "level-independent", subsection: "exercises", title_ar: "Preview", title_en: null, kind: "video", sort: 1, duration_seconds: null, bunny_video_id: null, drive_url: null, body_ar: null, body_en: null, is_free_preview: true, langs: ["ar"] },
];

describe("level and lesson access", () => {
  it.each([
    ["no access", [], false],
    ["another course grant", [{ course_id: "course-a", level_id: null, source: "purchase" }], false],
    ["direct level grant", [{ course_id: null, level_id: "level-independent", source: "grant" }], true],
    ["matching course grant", [{ course_id: "course-b", level_id: null, source: "purchase" }], true],
  ])("scopes unrelated level access: %s", (_label, access, expected) => {
    expect(levelUnlocked(levels, 2, access, [], lessons)).toBe(expected);
  });

  it("preserves sequential unlock only after every previous lesson is completed", () => {
    expect(levelUnlocked(levels, 1, [], [], lessons)).toBe(false);
    expect(levelUnlocked(levels, 1, [], [{ lesson_id: "lesson-1", completed: true }], lessons)).toBe(true);
    expect(levelUnlocked(levels, 1, [], [{ lesson_id: "lesson-1", completed: false }], lessons)).toBe(false);
  });

  it("does not unlock a sequential level when its previous level has no lessons", () => {
    const emptyPrevious = levels.map((level) => ({ ...level }));
    expect(levelUnlocked(emptyPrevious, 1, [], [], lessons.filter((lesson) => lesson.level_id !== "level-1"))).toBe(false);
  });

  it("requires matching-course access even when an unrelated course is purchased", () => {
    expect(lessonAccessible(lessons[2], levels, [{ course_id: "course-a", level_id: null, source: "purchase" }], [], lessons)).toBe(true);
    const lockedLesson = { ...lessons[2], is_free_preview: false };
    expect(lessonAccessible(lockedLesson, levels, [{ course_id: "course-a", level_id: null, source: "purchase" }], [], lessons)).toBe(false);
    expect(lessonAccessible(lockedLesson, levels, [{ course_id: "course-b", level_id: null, source: "purchase" }], [], lessons)).toBe(true);
  });

  it("keeps free previews playable without granting access to their level", () => {
    expect(lessonPlayable(lessons[2], levels, [], [], lessons)).toBe(true);
    expect(levelUnlocked(levels, 2, [], [], lessons)).toBe(false);
  });
});
