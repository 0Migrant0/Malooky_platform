"use strict";
/** Suite 1 — auth & session: login, cookie issue, TTL, /api/me, guards, refresh rotation. */
const H = require("./lib");
const { check, api, html, login, action, cookieHeader, decodeJwt, track, STAMP } = H;

async function run() {
  const probeCode = "E2E-REFRESH-" + STAMP;
  track("coupons", probeCode);
  track("coupons", "ANONPROBE");

  let COOKIE = await login();
  check(
    "session cookies issued",
    COOKIE.includes("sb-access-token=") && COOKIE.includes("sb-refresh-token="),
    COOKIE.slice(0, 48) + "...",
  );

  const access = COOKIE.split("sb-access-token=")[1].split(";")[0];
  const refresh = COOKIE.split("sb-refresh-token=")[1].split(";")[0];
  const claims = decodeJwt(access);
  const ttl = claims.exp - claims.iat;
  check("access token TTL measured", ttl > 0, ttl + "s = " + Math.round(ttl / 60) + "min (session dies at expiry without refresh)");

  const me = await api("/api/me", { cookie: COOKIE });
  check(
    "GET /api/me returns the admin session",
    me.status === 200 && me.data && me.data.user && me.data.user.role === "admin",
    JSON.stringify(me.data),
  );

  const anon = await action(null, "upsertCoupon", { code: "ANONPROBE", percent_off: 5, active: true });
  check("anonymous admin action rejected with 403", anon.status === 403, "status=" + anon.status + " " + JSON.stringify(anon.data));

  const dash = await html("/dash", COOKIE);
  check(
    "GET /dash renders the dashboard",
    dash.status === 200 &&
      dash.text.includes("لوحة التحكم") &&
      !dash.text.includes("تعذّر تحميل هذه الصفحة") &&
      !dash.text.includes("الخدمة غير مهيأة"),
    "status=" + dash.status + " bytes=" + dash.text.length,
  );
  check("audit tab is available (migration applied)", !dash.text.includes("سجل التغييرات غير مهيأ"), "");

  const tampered = access.slice(0, -3) + (access.slice(-3) === "abc" ? "xyz" : "abc");
  const probe = await action("sb-access-token=" + tampered + "; sb-refresh-token=" + refresh, "upsertCoupon", {
    code: probeCode,
    percent_off: 7,
    active: false,
  });
  check(
    "an unusable access token no longer blocks an admin action (refresh kicks in)",
    probe.status === 200 && probe.data && probe.data.ok === true,
    "status=" + probe.status + " " + JSON.stringify(probe.data),
  );
  const rotated = cookieHeader(probe.setCookie);
  check(
    "rotated cookies returned on refresh",
    rotated.includes("sb-access-token=") && rotated.includes("sb-refresh-token="),
    rotated.slice(0, 60),
  );
  if (rotated.includes("sb-access-token=")) COOKIE = rotated;

  const evil = await api("/api/auth/refresh?next=https://evil.example", { cookie: COOKIE });
  const evilLoc = evil.headers.get("location") || "";
  check("refresh endpoint refuses external redirect targets", !evilLoc.includes("evil.example"), "status=" + evil.status + " loc=" + evilLoc);

  const freshRefresh = COOKIE.split("sb-refresh-token=")[1].split(";")[0];
  const again = await api("/api/auth/refresh?next=/dash", { cookie: "sb-refresh-token=" + freshRefresh });
  const loc = again.headers.get("location") || "";
  check(
    "GET /api/auth/refresh rotates the session and returns to /dash",
    again.status >= 300 && again.status < 400 && loc.endsWith("/dash"),
    "status=" + again.status + " loc=" + loc,
  );
  check(
    "refresh endpoint sets fresh cookies",
    cookieHeader(again.setCookie).includes("sb-access-token="),
    cookieHeader(again.setCookie).slice(0, 60),
  );
}

module.exports = { run };
