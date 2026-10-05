"use strict";
/** Suite 2 — content management: courses, levels, lessons, videos, coupons, packages, payment, teasers, FAQ, VIP guards. */
const H = require("./lib");
const { check, rest, login, action, rows, ok, track, STAMP } = H;

async function run() {
  const C = await login();
  const paymentBefore = await rows("payment_methods?select=key,enabled,instructions_ar,instructions_en");
  const stripeBefore = paymentBefore.find((m) => m.key === "stripe");
  const whatsBefore = paymentBefore.find((m) => m.key === "whatsapp_transfer");

  const title = "temp course ar " + STAMP;
  const editedTitle = "temp course edited " + STAMP;
  const c1 = await action(C, "upsertCourse", {
    title_ar: title,
    title_en: "Temp course",
    price_cents: 1000,
    is_free: false,
    relation: "sequential",
  });
  check("upsertCourse creates a draft", ok(c1) && c1.data.course && c1.data.course.is_published === false, c1.status + " " + JSON.stringify(c1.data));
  check("successful action carries no audit warning", ok(c1) && !c1.data.auditWarning, JSON.stringify(c1.data));
  const courseId = c1.data && c1.data.course && c1.data.course.id;
  track("courses", courseId);
  if (!courseId) return; // subsequent checks cannot run without a course

  const c2 = await action(C, "upsertCourse", {
    id: courseId,
    title_ar: editedTitle,
    price_cents: 1500,
    is_free: false,
    relation: "sequential",
    kind: "main",
  });
  const afterEdit = await rows("courses?id=eq." + courseId + "&select=title_ar,price_cents,is_published,kind");
  check(
    "upsertCourse edits the row",
    ok(c2) && afterEdit[0] && afterEdit[0].price_cents === 1500 && afterEdit[0].kind === "main",
    JSON.stringify(afterEdit[0]),
  );

  // Same title again → same slug → unique-constraint violation must surface as a clear 409, not a 500.
  const DUPLICATE_MSG = "قيمة مكررة — هذا الرابط أو المعرّف مستخدم مسبقاً. اختر قيمة أخرى.";
  const dup = await action(C, "upsertCourse", { title_ar: editedTitle, price_cents: 1000, is_free: false });
  check(
    "duplicate slug returns 409 with a clear message",
    dup.status === 409 && dup.data && dup.data.error === DUPLICATE_MSG,
    dup.status + " " + JSON.stringify(dup.data),
  );
  const dupRows = await rows("courses?select=id&title_ar=eq." + encodeURIComponent(editedTitle));
  check("duplicate attempt creates no extra row", dupRows.length === 1, "rows=" + dupRows.length);

  const early = await action(C, "setCoursePublished", { id: courseId, is_published: true });
  check("publish blocked until a level+lesson exists", early.status === 400, early.status + " " + JSON.stringify(early.data));

  const lv = await action(C, "upsertLevel", { courseId: courseId, title_ar: "level one", sort: 0, relation: "sequential", is_free: false });
  check("upsertLevel", ok(lv) && lv.data.level && lv.data.level.id, JSON.stringify(lv.data));
  const levelId = lv.data && lv.data.level && lv.data.level.id;

  const ls = await action(C, "upsertLesson", {
    levelId: levelId,
    title_ar: "temp lesson",
    subsection: "exercises",
    kind: "video",
    sort: 0,
    langs: ["ar"],
  });
  check("upsertLesson", ok(ls) && ls.data.lesson && ls.data.lesson.id, JSON.stringify(ls.data));
  const lessonId = ls.data && ls.data.lesson && ls.data.lesson.id;

  const av = await action(C, "attachVideo", { lessonId: lessonId, bunnyVideoId: "temp-video-id", lang: "ar" });
  const videos = await rows("lesson_videos?select=id,lang,bunny_video_id&lesson_id=eq." + lessonId);
  check("attachVideo links a Bunny id", ok(av) && videos.length === 1 && videos[0].bunny_video_id === "temp-video-id", JSON.stringify(videos));

  const pub = await action(C, "setCoursePublished", { id: courseId, is_published: true });
  const published = await rows("courses?id=eq." + courseId + "&select=is_published");
  const anonSee = await rest("courses?select=id&is_published=eq.true&id=eq." + courseId, { key: H.AKEY });
  check(
    "publish makes the course publicly readable",
    ok(pub) && published[0] && published[0].is_published === true && anonSee.data && anonSee.data.length === 1,
    JSON.stringify({ db: published, public: anonSee.data }),
  );

  const ls2 = await action(C, "upsertLesson", {
    id: lessonId,
    levelId: levelId,
    title_ar: "temp lesson edited",
    subsection: "exercises",
    kind: "video",
    sort: 0,
  });
  const lsRows = await rows("lessons?id=eq." + lessonId + "&select=title_ar");
  check("upsertLesson edits the row", ok(ls2) && lsRows[0] && lsRows[0].title_ar === "temp lesson edited", JSON.stringify(lsRows[0]));

  const unp = await action(C, "setCoursePublished", { id: courseId, is_published: false });
  const unpub = await rows("courses?id=eq." + courseId + "&select=is_published");
  const anonGone = await rest("courses?select=id&id=eq." + courseId, { key: H.AKEY });
  check(
    "unpublish hides it from the public catalog",
    ok(unp) && unpub[0] && unpub[0].is_published === false && (!anonGone.data || anonGone.data.length === 0),
    JSON.stringify({ db: unpub, public: anonGone.data }),
  );

  const delLs = await action(C, "deleteLesson", { id: lessonId });
  const goneLs = await rows("lessons?id=eq." + lessonId + "&select=id");
  const goneVideo = await rows("lesson_videos?select=id&lesson_id=eq." + lessonId);
  check(
    "deleteLesson removes the lesson and its video row",
    ok(delLs) && goneLs.length === 0 && goneVideo.length === 0,
    JSON.stringify({ lesson: goneLs.length, videos: goneVideo.length }),
  );

  const delLv = await action(C, "deleteLevel", { id: levelId });
  const goneLv = await rows("levels?id=eq." + levelId + "&select=id");
  check("deleteLevel removes the level", ok(delLv) && goneLv.length === 0, JSON.stringify(goneLv));

  // deleteCourse stays disabled by design — the row survives the suite and is
  // removed by teardown (tracked above).
  const delCourse = await action(C, "deleteCourse", { id: courseId });
  const stillThere = await rows("courses?id=eq." + courseId + "&select=id");
  check("deleteCourse stays disabled (409) and keeps the row", delCourse.status === 409 && stillThere.length === 1, delCourse.status + " " + JSON.stringify(delCourse.data));

  const cp = await action(C, "upsertCoupon", { code: "TEMP-COUPON", percent_off: 25, active: true });
  const cpRows = await rows("coupons?select=code,percent_off&code=eq.TEMP-COUPON");
  check("upsertCoupon writes the row", ok(cp) && cpRows[0] && cpRows[0].percent_off === 25, JSON.stringify(cpRows));
  const cpDel = await action(C, "deleteCoupon", { code: "TEMP-COUPON" });
  const cpGone = await rows("coupons?select=code&code=eq.TEMP-COUPON");
  check("deleteCoupon removes the row", ok(cpDel) && cpGone.length === 0, JSON.stringify(cpGone));

  const pk = await action(C, "upsertPackage", { title_ar: "temp package", price_cents: 5000, all_courses: true, is_active: true, sort: 99 });
  const pkId = pk.data && pk.data.id;
  const pkRows = await rows("packages?select=id,is_active&id=eq." + (pkId || "none"));
  check("upsertPackage writes the row", ok(pk) && pkRows.length === 1, JSON.stringify(pkRows));
  const pkToggle = await action(C, "upsertPackage", {
    id: pkId,
    title_ar: "temp package",
    price_cents: 5000,
    all_courses: true,
    is_active: false,
    sort: 99,
  });
  const pkRows2 = await rows("packages?select=is_active&id=eq." + (pkId || "none"));
  check("upsertPackage toggles state", ok(pkToggle) && pkRows2[0] && pkRows2[0].is_active === false, JSON.stringify(pkRows2));
  const pkDel = await action(C, "deletePackage", { id: pkId });
  const pkGone = await rows("packages?select=id&id=eq." + (pkId || "none"));
  check("deletePackage removes the row", ok(pkDel) && pkGone.length === 0, JSON.stringify(pkGone));

  const payOff = await action(C, "togglePaymentMethod", { key: "stripe", enabled: false });
  const offRows = await rows("payment_methods?select=enabled&key=eq.stripe");
  check("togglePaymentMethod disables", ok(payOff) && offRows[0] && offRows[0].enabled === false, JSON.stringify(offRows));
  const payOn = await action(C, "togglePaymentMethod", { key: "stripe", enabled: true });
  const onRows = await rows("payment_methods?select=enabled&key=eq.stripe");
  check("togglePaymentMethod re-enables", ok(payOn) && onRows[0] && onRows[0].enabled === true, JSON.stringify(onRows));
  if (stripeBefore && stripeBefore.enabled === false) {
    await action(C, "togglePaymentMethod", { key: "stripe", enabled: false });
  }
  const payFinal = await rows("payment_methods?select=enabled&key=eq.stripe");
  check(
    "payment method state restored to its original value",
    Boolean(stripeBefore) && payFinal[0] && payFinal[0].enabled === stripeBefore.enabled,
    JSON.stringify({ original: stripeBefore && stripeBefore.enabled, final: payFinal[0] && payFinal[0].enabled }),
  );

  const instr = await action(C, "savePaymentInstructions", {
    key: "whatsapp_transfer",
    instructions_ar: "temp instructions ar",
    instructions_en: "temp instructions en",
  });
  const instrRows = await rows("payment_methods?select=instructions_ar&key=eq.whatsapp_transfer");
  check("savePaymentInstructions writes", ok(instr) && instrRows[0] && instrRows[0].instructions_ar === "temp instructions ar", JSON.stringify(instrRows));
  const restore = await action(C, "savePaymentInstructions", {
    key: "whatsapp_transfer",
    instructions_ar: whatsBefore.instructions_ar,
    instructions_en: whatsBefore.instructions_en,
  });
  const restored = await rows("payment_methods?select=instructions_ar&key=eq.whatsapp_transfer");
  check("payment instructions restored", ok(restore) && restored[0] && restored[0].instructions_ar === whatsBefore.instructions_ar, JSON.stringify(restored[0]));

  const t1 = await action(C, "upsertTestimonial", { student_name: "temp student", body_ar: "temp review", rating: 5, approved: false });
  const t1Rows = await rows("testimonials?select=id&id=eq." + ((t1.data && t1.data.id) || "none"));
  check("upsertTestimonial writes", ok(t1) && t1Rows.length === 1, JSON.stringify(t1Rows));
  const t1d = await action(C, "deleteTestimonial", { id: t1.data.id });
  const t1Gone = await rows("testimonials?select=id&id=eq." + t1.data.id);
  check("deleteTestimonial removes", ok(t1d) && t1Gone.length === 0, "");

  const s1 = await action(C, "upsertTopStudent", { student_name: "temp top", sort: 99 });
  check("upsertTopStudent writes", ok(s1) && s1.data.id, JSON.stringify(s1.data));
  const s1d = await action(C, "deleteTopStudent", { id: s1.data.id });
  const s1Gone = await rows("top_students?select=id&id=eq." + s1.data.id);
  check("deleteTopStudent removes", ok(s1d) && s1Gone.length === 0, "");

  const w1 = await action(C, "upsertWork", {
    student_name: "temp work",
    image_url: "https://example.com/temp.jpg",
    caption_ar: "temp",
    approved: false,
  });
  check("upsertWork writes", ok(w1) && w1.data.id, JSON.stringify(w1.data));
  const w1d = await action(C, "deleteWork", { id: w1.data.id });
  const w1Gone = await rows("student_works?select=id&id=eq." + w1.data.id);
  check("deleteWork removes", ok(w1d) && w1Gone.length === 0, "");

  const f1 = await action(C, "upsertFaq", { question_ar: "temp question?", answer_ar: "temp answer", sort: 99 });
  check("upsertFaq writes", ok(f1) && f1.data.id, JSON.stringify(f1.data));
  const f1d = await action(C, "deleteFaq", { id: f1.data.id });
  const f1Gone = await rows("faqs?select=id&id=eq." + f1.data.id);
  check("deleteFaq removes", ok(f1d) && f1Gone.length === 0, "");

  const vip = await action(C, "setVip", { enabled: true, title_ar: "retired" });
  check("setVip stays retired (400)", vip.status === 400, vip.status + " " + JSON.stringify(vip.data));
  const vipCourse = await action(C, "upsertCourse", { kind: "vip", title_ar: "retired vip " + STAMP });
  check("vip-kind course stays retired (400)", vipCourse.status === 400, vipCourse.status + " " + JSON.stringify(vipCourse.data));
}

module.exports = { run };
