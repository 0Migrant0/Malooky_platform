"use strict";
/**
 * Admin action matrix — end-to-end runner.
 *
 * Exercises every admin action against a live server (staging) and asserts
 * the resulting DB state, then removes everything it created.
 *
 * Usage:
 *   BASE_URL=https://staging.example.com npm run test:e2e
 *
 * The runner first verifies statically that every action case in the route is
 * covered, so a new action can never slip past the matrix unnoticed.
 *
 * Exit codes: 0 = all checks passed and cleanup complete,
 *             1 = one or more checks failed (or cleanup leaked),
 *             2 = setup/runtime error (server unreachable, config missing).
 */
const fs = require("fs");
const path = require("path");
const H = require("./lib");

const suites = [
  ["auth + session", require("./suite-auth")],
  ["content management", require("./suite-content")],
  ["people, orders & audit", require("./suite-people")],
];

/** Every `case "..."` in the admin action route must appear here. */
const COVERED_ACTIONS = [
  "createUser", "setRole", "grant", "revoke",
  "upsertCourse", "setCoursePublished", "deleteCourse",
  "upsertLevel", "deleteLevel", "upsertLesson", "deleteLesson", "attachVideo",
  "approveOrder", "rejectOrder",
  "upsertPackage", "deletePackage", "upsertCoupon", "deleteCoupon",
  "togglePaymentMethod", "savePaymentInstructions",
  "upsertTestimonial", "deleteTestimonial", "upsertTopStudent", "deleteTopStudent",
  "upsertWork", "deleteWork", "upsertFaq", "deleteFaq",
  "setConsultStatus", "setVip",
];

/** Static guard: fails the run if the route gains an uncovered action (or the list goes stale). */
function checkCoverage() {
  const routePath = path.resolve(__dirname, "..", "..", "src", "app", "api", "admin", "action", "route.ts");
  const source = fs.readFileSync(routePath, "utf8");
  const declared = Array.from(source.matchAll(/case "([A-Za-z][A-Za-z0-9]*)"/g)).map((m) => m[1]);
  const uncovered = declared.filter((a) => !COVERED_ACTIONS.includes(a));
  const stale = COVERED_ACTIONS.filter((a) => !declared.includes(a));
  H.suite("coverage");
  H.check(
    "every route action case is covered by the matrix",
    declared.length > 0 && uncovered.length === 0 && stale.length === 0,
    JSON.stringify({ declared: declared.length, uncovered: uncovered, stale: stale }),
  );
}

async function main() {
  console.log("Admin action matrix — target " + (H.BASE || "(BASE_URL not set)"));
  checkCoverage();
  await H.requireConfig();
  await H.preflight();

  let cleanupOk = true;
  try {
    await H.setup();
    for (const [name, suiteModule] of suites) {
      const before = H.results.length;
      H.suite(name);
      await suiteModule.run();
      const part = H.results.slice(before);
      const bad = part.filter((r) => !r.ok).length;
      console.log(`==== ${name}: ${part.length - bad}/${part.length} ====`);
    }
  } finally {
    if (H.tracked()) {
      cleanupOk = await H.teardown();
    }
  }

  const failed = H.results.filter((r) => !r.ok);
  console.log(`\n==== ${H.results.length - failed.length}/${H.results.length} checks passed ====`);
  failed.forEach((f) => console.log(`FAILED: [${f.suite}] ${f.name}  ${f.detail}`));
  if (!cleanupOk) console.log("CLEANUP INCOMPLETE — some temp rows remain (see the cleanup log above).");
  if (failed.length || !cleanupOk) process.exitCode = 1;
}

main().catch((e) => {
  console.error("E2E ERROR:", e && e.message ? e.message : e);
  process.exitCode = 2;
});
