"use strict";
/** Suite 3 — people, orders & audit: createUser, roles, grant/revoke, transfer orders, consults, audit log. */
const H = require("./lib");
const { check, api, rest, login, action, rows, ok, track, STAMP, ADMIN_EMAIL } = H;

async function run() {
  const C = await login();
  const stamp = STAMP;
  const studentEmail = "temp-student-e2e-" + stamp + "@test.malooky.dev";
  const studentPassword = "E2eStudent-" + stamp + "Aa1!";
  track("studentEmails", studentEmail);
  track("coupons", "STUDENT-PROBE");

  const created = await action(C, "createUser", { email: studentEmail, password: studentPassword, fullName: "Temp Student" });
  const studentId = created.data && created.data.id;
  check("createUser creates the account + profile", ok(created) && !!studentId, JSON.stringify(created.data));
  track("students", studentId);
  const profile = await rows("profiles?select=id,email,role&id=eq." + (studentId || "none"));
  check("profile row exists with student role", profile[0] && profile[0].role === "student", JSON.stringify(profile));

  // GoTrue's duplicate-email rejection must surface as a clear 409, not a generic 500.
  const EMAIL_MSG = "البريد الإلكتروني مستخدم مسبقاً.";
  const dupEmail = await action(C, "createUser", { email: ADMIN_EMAIL, password: studentPassword });
  check(
    "createUser rejects an existing email with 409",
    dupEmail.status === 409 && dupEmail.data && dupEmail.data.error === EMAIL_MSG,
    dupEmail.status + " " + JSON.stringify(dupEmail.data),
  );

  const studentLogin = await api("/api/auth/login", { method: "POST", body: { email: studentEmail, password: studentPassword } });
  check("temp student can sign in", studentLogin.status === 200 && studentLogin.data && studentLogin.data.role === "student", JSON.stringify(studentLogin.data));
  const studentCookie = H.cookieHeader(studentLogin.setCookie);
  const asStudent = await action(studentCookie, "upsertCoupon", { code: "STUDENT-PROBE", percent_off: 5, active: true });
  check("a student session is rejected with 403", asStudent.status === 403, asStudent.status + " " + JSON.stringify(asStudent.data));

  const promote = await action(C, "setRole", { userId: studentId, role: "admin" });
  const promoted = await rows("profiles?select=role&id=eq." + studentId);
  check("setRole promotes to admin", ok(promote) && promoted[0] && promoted[0].role === "admin", JSON.stringify(promoted));
  const demote = await action(C, "setRole", { userId: studentId, role: "student" });
  const demoted = await rows("profiles?select=role&id=eq." + studentId);
  check("setRole demotes back to student", ok(demote) && demoted[0] && demoted[0].role === "student", JSON.stringify(demoted));

  const course = await action(C, "upsertCourse", { title_ar: "grant target course " + stamp, price_cents: 500, is_free: false });
  const courseId = course.data && course.data.course && course.data.course.id;
  check("temp course created for grant/revoke", ok(course) && !!courseId, JSON.stringify(course.data));
  track("courses", courseId);

  const grant = await action(C, "grant", { userId: studentId, courseId: courseId, levelId: null, source: "grant" });
  const granted = await rows("access?select=id,user_id,course_id,source&user_id=eq." + studentId);
  check("grant writes the access row", ok(grant) && granted.length === 1 && granted[0].course_id === courseId, JSON.stringify(granted));
  const revoke = await action(C, "revoke", { userId: studentId, courseId: courseId, levelId: null });
  const revoked = await rows("access?select=id&user_id=eq." + studentId);
  check("revoke removes the access row", ok(revoke) && revoked.length === 0, JSON.stringify(revoked));

  const seedOrder = async (suffix) => {
    const r = await rest("manual_orders", {
      method: "POST",
      body: {
        email: studentEmail,
        full_name: "Temp Student",
        course_id: courseId,
        amount: 500,
        proof_url: "proofs/temp-" + suffix + ".jpg",
        whatsapp: "000000000",
        status: "pending",
      },
    });
    return r.data && r.data[0] && r.data[0].id;
  };
  const order1Id = await seedOrder("approve");
  check("seeded pending transfer order", !!order1Id, String(order1Id));
  const approve = await action(C, "approveOrder", { id: order1Id });
  const approved = await rows("manual_orders?select=id,status,user_id&id=eq." + order1Id);
  const accessAfter = await rows("access?select=id,user_id,course_id,source&user_id=eq." + studentId);
  check(
    "approveOrder grants access and approves the order",
    ok(approve) && approved[0] && approved[0].status === "approved" && approved[0].user_id === studentId && accessAfter.length === 1,
    JSON.stringify({ order: approved, access: accessAfter }),
  );
  check("approveOrder response carries no audit warning", ok(approve) && !approve.data.auditWarning, JSON.stringify(approve.data));

  const order2Id = await seedOrder("reject");
  const reject = await action(C, "rejectOrder", { id: order2Id, note: "temp reject" });
  const rejected = await rows("manual_orders?select=id,status,note&id=eq." + order2Id);
  check(
    "rejectOrder marks the order rejected",
    ok(reject) && rejected[0] && rejected[0].status === "rejected" && rejected[0].note === "temp reject",
    JSON.stringify(rejected),
  );

  const consultEmail = "temp-consult-e2e-" + stamp + "@test.dev";
  track("consultEmails", consultEmail);
  const consult = await api("/api/consult", {
    method: "POST",
    body: { name: "Temp consult", email: consultEmail, message: "temp consult message" },
  });
  check("public consult form accepted", consult.status === 200 && consult.data && consult.data.ok === true, JSON.stringify(consult.data));
  const consultRows = await rows("consult_requests?select=id,status&order=created_at.desc&limit=1");
  const consultId = consultRows[0] && consultRows[0].id;
  check("consult request stored", !!consultId, JSON.stringify(consultRows));
  const contacted = await action(C, "setConsultStatus", { id: consultId, status: "contacted" });
  const contactedRow = await rows("consult_requests?select=status&id=eq." + consultId);
  check("setConsultStatus -> contacted", ok(contacted) && contactedRow[0] && contactedRow[0].status === "contacted", JSON.stringify(contactedRow));
  const closed = await action(C, "setConsultStatus", { id: consultId, status: "closed" });
  const closedRow = await rows("consult_requests?select=status&id=eq." + consultId);
  check("setConsultStatus -> closed", ok(closed) && closedRow[0] && closedRow[0].status === "closed", JSON.stringify(closedRow));

  // Scope the audit assertions to this run's temp admin so the suite works on
  // a staging DB that already contains other actors' history.
  const audit = await rows("admin_audit_logs?select=action,entity_type,actor_email&actor_email=eq." + encodeURIComponent(ADMIN_EMAIL));
  const actionsSeen = new Set(audit.map((a) => a.action));
  check("audit log received rows", audit.length > 0, "rows=" + audit.length);
  const expected = ["createUser", "setRole", "grant", "revoke", "upsertCourse", "approveOrder", "rejectOrder", "setConsultStatus"];
  const missing = expected.filter((a) => !actionsSeen.has(a));
  check("audit covers people/course/order/consult actions", missing.length === 0, "missing=" + JSON.stringify(missing));
  const actors = Array.from(new Set(audit.map((a) => a.actor_email)));
  check("audit actor is the admin", actors.length === 1 && actors[0] === ADMIN_EMAIL, JSON.stringify(actors));
}

module.exports = { run };
