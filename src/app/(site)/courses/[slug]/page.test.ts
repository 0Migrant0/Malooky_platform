import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  course: { id: "course-1", slug: "course", title_ar: "عنوان", title_en: "Title", subtitle_ar: "وصف", subtitle_en: "Description", price_cents: 1200, is_free: false, is_published: true, stripe_price_id: "private-price" },
  levels: [{ id: "level-1", course_id: "course-1", title_ar: "مستوى", title_en: "Level", description_ar: null, description_en: null, sort: 1, is_free: false, price_cents: null }],
  lessons: [{ id: "lesson-1", level_id: "level-1", subsection: "exercises", title_ar: "درس", title_en: "Lesson", is_free_preview: false, bunny_video_id: "private-video", body_ar: "private lesson body", drive_url: "private drive" }],
  selections: [] as { table: string; columns: string }[],
}));

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not found"); } }));
vi.mock("@/lib/supabase", () => ({
  SupabaseConfigurationError: class SupabaseConfigurationError extends Error {},
  supabaseAdmin: () => ({
    from(table: string) {
      return {
        select(columns: string) {
          mocks.selections.push({ table, columns });
          const rows: Record<string, unknown>[] = table === "courses" ? [mocks.course] : table === "levels" ? mocks.levels : mocks.lessons;
          const project = (row: Record<string, unknown>) => Object.fromEntries(columns.split(",").map((column) => [column, row[column]]));
          const query = {
            eq() { return query; },
            in(column: string, values: unknown[]) {
              query.rows = rows.filter((row) => values.includes(row[column]));
              return query;
            },
            rows,
            order() { return query; },
            maybeSingle: async () => ({ data: project(rows[0]), error: null }),
            then(resolve: (value: { data: unknown[]; error: null }) => unknown) {
              return Promise.resolve({ data: query.rows.map(project), error: null }).then(resolve);
            },
          };
          return query;
        },
      };
    },
  }),
  getUserFromCookies: async () => null,
}));

import CourseDetail from "./page";

describe("public course detail data boundary", () => {
  beforeEach(() => {
    mocks.course = { id: "course-1", slug: "course", title_ar: "عنوان", title_en: "Title", subtitle_ar: "وصف", subtitle_en: "Description", price_cents: 1200, is_free: false, is_published: true, stripe_price_id: "private-price" };
    mocks.levels = [{ id: "level-1", course_id: "course-1", title_ar: "مستوى", title_en: "Level", description_ar: null, description_en: null, sort: 1, is_free: false, price_cents: null }];
    mocks.lessons = [{ id: "lesson-1", level_id: "level-1", subsection: "exercises", title_ar: "درس", title_en: "Lesson", is_free_preview: false, bunny_video_id: "private-video", body_ar: "private lesson body", drive_url: "private drive" }];
    mocks.selections = [];
  });

  it("selects and passes only display fields, excluding private course and lesson data", async () => {
    const element = await CourseDetail({ params: Promise.resolve({ slug: "course" }) });
    const props = (element as { props: Record<string, unknown> }).props;

    expect(mocks.selections).toContainEqual({ table: "lessons", columns: "id,level_id,subsection,title_ar,title_en,is_free_preview" });
    expect(mocks.selections.find(({ table }) => table === "courses")?.columns)
      .toBe("id,slug,title_ar,title_en,subtitle_ar,subtitle_en,price_cents,is_free");
    expect(props.lessons).toEqual([{ id: "lesson-1", level_id: "level-1", subsection: "exercises", title_ar: "درس", title_en: "Lesson", is_free_preview: false }]);
    expect(JSON.stringify(props)).not.toMatch(/private-video|private lesson body|private drive|private-price/);
  });

  it("passes an empty lesson list and skips lesson query when no levels exist", async () => {
    mocks.levels = [];
    const element = await CourseDetail({ params: Promise.resolve({ slug: "course" }) });
    expect(mocks.selections.some(({ table }) => table === "lessons")).toBe(false);
    expect((element as { props: Record<string, unknown> }).props.lessons).toEqual([]);
  });
});
