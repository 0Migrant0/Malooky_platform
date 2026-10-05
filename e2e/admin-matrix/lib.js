"use strict";
/**
 * Shared harness for the live admin-action matrix (e2e).
 *
 * Runs against a real server (staging) and asserts real DB state via the
 * Supabase REST API with the service-role key. Configuration comes from the
 * repo `.env`, overridable through environment variables:
 *
 *   BASE_URL   (required) staging server origin, e.g. https://staging.example.com
 *
 * The suite creates its own temporary admin account on every run and removes
 * everything it created (accounts, courses, orders, consults, coupons, audit
 * rows) in `teardown()`, so it is safe to run repeatedly against staging.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const TIMEOUT_MS = 30000;
const STAMP = Date.now();

function readEnvFile() {
  const out = {};
  let raw;
  try {
    raw = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  } catch (e) {
    return out;
  }
  for (const line of raw.split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (line.startsWith("#") || eq <= 0) continue;
    out[line.slice(0, eq)] = line.slice(eq + 1).trim();
  }
  return out;
}

const fileEnv = readEnvFile();
const env = (name) => process.env[name] || fileEnv[name] || "";

const SUPA = env("NEXT_PUBLIC_SUPABASE_URL");
const SKEY = env("SUPABASE_SERVICE_ROLE_KEY");
const AKEY = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const BASE = (process.env.BASE_URL || "").replace(/\/+$/, "");

const ADMIN_EMAIL = `temp-admin-e2e-${STAMP}@test.malooky.dev`;
const ADMIN_PASSWORD = `E2eAdmin-${STAMP}-Aa1!`;
let adminUid = "";

/** Everything this run created, so teardown can remove exactly that. */
const created = {
  courses: new Set(),
  coupons: new Set(),
  students: new Set(), // auth uids created via the createUser action
  studentEmails: new Set(),
  consultEmails: new Set(),
};

function track(kind, value) {
  if (value) created[kind].add(value);
}

function tracked() {
  return Boolean(adminUid) || created.students.size > 0;
}

// ---------------------------------------------------------------- results ---
const results = [];
let currentSuite = "suite";

function suite(name) {
  currentSuite = name;
  console.log(`\n--- ${name} ---`);
}

function check(name, ok, detail) {
  results.push({ suite: currentSuite, name: name, ok: Boolean(ok), detail: detail || "" });
  console.log((ok ? "PASS  " : "FAIL  ") + name + (detail ? `   [${detail}]` : ""));
}

// ------------------------------------------------------------------- http ---
async function api(route, opts) {
  opts = opts || {};
  const headers = {};
  if (opts.body) headers["content-type"] = "application/json";
  if (opts.cookie) headers.cookie = opts.cookie;
  Object.assign(headers, opts.headers || {});
  const res = await fetch(BASE + route, {
    method: opts.method || "GET",
    headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return { status: res.status, data: data, headers: res.headers, setCookie: setCookie };
}

async function rest(search, opts) {
  opts = opts || {};
  const key = opts.key || SKEY;
  const headers = { apikey: key, authorization: "Bearer " + key };
  if (opts.body) {
    headers["content-type"] = "application/json";
    headers.prefer = "return=representation";
  }
  Object.assign(headers, opts.headers || {});
  const res = await fetch(SUPA + "/rest/v1/" + search, {
    method: opts.method || "GET",
    headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data: data };
}

async function html(route, cookie) {
  const res = await fetch(BASE + route, {
    headers: cookie ? { cookie: cookie } : {},
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return { status: res.status, text: await res.text() };
}

function cookieHeader(setCookie) {
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

function decodeJwt(token) {
  const payload = token.split(".")[1];
  const b64 = payload.split("-").join("+").split("_").join("/");
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

async function rows(query) {
  const r = await rest(query);
  return Array.isArray(r.data) ? r.data : [];
}

function ok(r) {
  return r.status === 200 && r.data && r.data.ok === true;
}

async function login() {
  const r = await api("/api/auth/login", {
    method: "POST",
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  check(
    "POST /api/auth/login as admin",
    r.status === 200 && r.data && r.data.ok === true && r.data.role === "admin",
    "status=" + r.status + " " + JSON.stringify(r.data),
  );
  return cookieHeader(r.setCookie);
}

async function action(cookie, name, payload) {
  return api("/api/admin/action", { method: "POST", cookie: cookie, body: { action: name, payload: payload } });
}

// ----------------------------------------------------------- preflight ------
async function requireConfig() {
  if (!BASE) {
    throw new Error("BASE_URL is required, e.g. BASE_URL=https://staging.example.com npm run test:e2e");
  }
  if (!SUPA || !SKEY || !AKEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env");
  }
}

async function preflight() {
  try {
    const res = await fetch(BASE + "/login", { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error("status " + res.status);
  } catch (e) {
    throw new Error(`Cannot reach the server at ${BASE}/login (${e.message}). Is it running? Check BASE_URL.`);
  }
}

// ------------------------------------------------------------- lifecycle ----
async function setup() {
  const res = await fetch(SUPA + "/auth/v1/admin/users", {
    method: "POST",
    headers: { apikey: SKEY, authorization: "Bearer " + SKEY, "content-type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, email_confirm: true }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = await res.json();
  if (!res.ok || !body.id) {
    throw new Error("Could not create temp admin: " + JSON.stringify(body).slice(0, 200));
  }
  adminUid = body.id;

  // The profiles trigger usually creates the row (default role student) — force admin.
  const patched = await rest("profiles?id=eq." + adminUid, { method: "PATCH", body: { role: "admin" } });
  if (!Array.isArray(patched.data) || patched.data.length === 0) {
    await rest("profiles", { method: "POST", body: { id: adminUid, email: ADMIN_EMAIL, full_name: "E2E Temp Admin", role: "admin" } });
  }
  const verify = await rest("profiles?select=role&id=eq." + adminUid);
  if (!(verify.data && verify.data[0] && verify.data[0].role === "admin")) {
    throw new Error("Temp admin profile is not admin: " + JSON.stringify(verify.data));
  }
  console.log(`temp admin ready: ${ADMIN_EMAIL}`);
}

async function del(label, table, query) {
  const r = await rest(table + "?" + query, { method: "DELETE" });
  const success = r.status === 204 || r.status === 200;
  console.log(`cleanup ${label}: ${r.status}`);
  return success;
}

/**
 * Removes everything this run created. Returns false if any delete failed so
 * the runner can exit non-zero and report the leak.
 */
async function teardown() {
  console.log("\n--- cleanup ---");
  const failed = [];
  const ids = (set) => Array.from(set).join(",");
  const students = Array.from(created.students);

  const courses = Array.from(created.courses);
  if (courses.length) {
    const courseFilter = "in.(" + courses.join(",") + ")";
    const levels = await rows("levels?select=id&course_id=" + courseFilter);
    if (levels.length) {
      const levelFilter = "in.(" + levels.map((l) => l.id).join(",") + ")";
      const lessons = await rows("lessons?select=id&level_id=" + levelFilter);
      if (lessons.length) {
        const lessonFilter = "in.(" + lessons.map((l) => l.id).join(",") + ")";
        if (!(await del("lesson_videos", "lesson_videos", "lesson_id=" + lessonFilter))) failed.push("lesson_videos");
        if (!(await del("lessons", "lessons", "id=" + lessonFilter))) failed.push("lessons");
      }
      if (!(await del("levels", "levels", "id=" + levelFilter))) failed.push("levels");
    }
    if (!(await del("courses", "courses", "id=" + courseFilter))) failed.push("courses");
  }

  if (students.length) {
    if (!(await del("access", "access", "user_id=in.(" + ids(created.students) + ")"))) failed.push("access");
    const emailList = Array.from(created.studentEmails);
    const orQuery =
      "or=(user_id.in.(" + ids(created.students) + ")" + (emailList.length ? ",email.in.(" + emailList.join(",") + ")" : "") + ")";
    if (!(await del("manual_orders", "manual_orders", orQuery))) failed.push("manual_orders");
  }

  if (created.consultEmails.size) {
    if (!(await del("consult_requests", "consult_requests", "email=in.(" + ids(created.consultEmails) + ")"))) failed.push("consult_requests");
  }
  if (created.coupons.size) {
    if (!(await del("coupons", "coupons", "code=in.(" + ids(created.coupons) + ")"))) failed.push("coupons");
  }
  if (!(await del("admin_audit_logs", "admin_audit_logs", "actor_email=eq." + encodeURIComponent(ADMIN_EMAIL)))) {
    failed.push("admin_audit_logs");
  }

  const profiles = [adminUid].concat(students).filter(Boolean);
  if (!(await del("profiles", "profiles", "id=in.(" + profiles.join(",") + ")"))) failed.push("profiles");

  for (const uid of profiles) {
    const res = await fetch(SUPA + "/auth/v1/admin/users/" + uid, {
      method: "DELETE",
      headers: { apikey: SKEY, authorization: "Bearer " + SKEY },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const success = res.status === 200;
    console.log(`cleanup auth user ${uid.slice(0, 8)}: ${res.status}`);
    if (!success && res.status !== 404) failed.push("auth user " + uid.slice(0, 8));
  }

  if (failed.length) {
    console.log("CLEANUP FAILED FOR: " + failed.join(", "));
    return false;
  }
  console.log("cleanup complete — no temp rows left behind");
  return true;
}

module.exports = {
  STAMP,
  SUPA,
  SKEY,
  AKEY,
  BASE,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  results,
  suite,
  check,
  track,
  tracked,
  api,
  rest,
  html,
  rows,
  ok,
  login,
  action,
  cookieHeader,
  decodeJwt,
  requireConfig,
  preflight,
  setup,
  teardown,
};
